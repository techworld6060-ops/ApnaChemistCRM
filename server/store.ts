import fs from 'fs';
import path from 'path';
import {
  Patient,
  PharmacySettings,
  RefillRequest,
  ReminderEvent,
  AuditLog,
  WhatsAppChatMessage,
  ConsentStatus,
} from '../src/types.js';
import {
  initialPatients,
  initialPharmacySettings,
  initialRefillRequests,
  initialReminders,
  initialAuditLogs,
  initialChatMessages,
} from './seedData.js';

interface StoreData {
  settings: PharmacySettings;
  patients: Patient[];
  refillRequests: RefillRequest[];
  reminders: ReminderEvent[];
  auditLogs: AuditLog[];
  chatMessages: WhatsAppChatMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

class DataStore {
  private data: StoreData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): StoreData {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const fileContent = fs.readFileSync(STORE_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (err) {
      console.warn('Could not read store.json, using seed defaults:', err);
    }

    return {
      settings: initialPharmacySettings,
      patients: initialPatients,
      refillRequests: initialRefillRequests,
      reminders: initialReminders,
      auditLogs: initialAuditLogs,
      chatMessages: initialChatMessages,
    };
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting store.json:', err);
    }
  }

  // --- Settings ---
  public getSettings(): PharmacySettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<PharmacySettings>): PharmacySettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.addAuditLog({
      actor: 'Chief Pharmacist',
      actorRole: 'Admin',
      action: 'Pharmacy Settings Updated',
      details: 'Updated operational settings / WhatsApp configuration',
      type: 'system',
    });
    this.persist();
    return this.data.settings;
  }

  // --- Patients ---
  public getPatients(filter?: { search?: string; status?: string; condition?: string }): Patient[] {
    let list = this.data.patients;
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.uhid.toLowerCase().includes(q) ||
          p.locality.toLowerCase().includes(q) ||
          p.medications.some((m) => m.name.toLowerCase().includes(q))
      );
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter((p) => p.consent.status === filter.status);
    }
    if (filter?.condition && filter.condition !== 'all') {
      list = list.filter((p) =>
        p.chronicConditions.some((c) => c.toLowerCase().includes(filter.condition!.toLowerCase()))
      );
    }
    return list;
  }

  public getPatientById(id: string): Patient | undefined {
    return this.data.patients.find((p) => p.id === id || p.uhid === id || p.phone === id);
  }

  public addPatient(patientData: Omit<Patient, 'id' | 'uhid' | 'createdAt' | 'updatedAt'>): Patient {
    const nextNum = 1000 + this.data.patients.length + 1;
    const now = new Date().toISOString();
    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now().toString(36)}`,
      uhid: `AC-PAT-${nextNum}`,
      createdAt: now,
      updatedAt: now,
    };

    this.data.patients.unshift(newPatient);
    this.addAuditLog({
      actor: 'Counter Staff',
      actorRole: 'Pharmacist',
      action: 'Patient Enrolled',
      details: `Enrolled ${newPatient.name} (${newPatient.phone}) with ${newPatient.consent.status} consent`,
      type: 'patient',
    });
    this.persist();
    return newPatient;
  }

  public updatePatient(id: string, updates: Partial<Patient>): Patient | null {
    const idx = this.data.patients.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const current = this.data.patients[idx];
    const updated: Patient = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.data.patients[idx] = updated;
    this.addAuditLog({
      actor: 'Pharmacist',
      actorRole: 'Staff',
      action: 'Patient Record Updated',
      details: `Updated details for ${updated.name} (${updated.uhid})`,
      type: 'patient',
    });
    this.persist();
    return updated;
  }

  public updatePatientConsent(
    id: string,
    status: ConsentStatus,
    reason?: string,
    notes?: string
  ): Patient | null {
    const patient = this.getPatientById(id);
    if (!patient) return null;

    const now = new Date().toISOString();
    patient.consent = {
      ...patient.consent,
      status,
      optOutTimestamp: status === 'opted_out' ? now : undefined,
      optOutReason: status === 'opted_out' ? (reason || 'Patient requested opt-out') : undefined,
      notes: notes || patient.consent.notes,
    };

    if (status === 'opted_out') {
      patient.reminderStatus = 'opted_out';
    } else if (status === 'opted_in' && patient.reminderStatus === 'opted_out') {
      patient.reminderStatus = 'upcoming';
    }

    patient.updatedAt = now;

    this.addAuditLog({
      actor: 'Compliance Ledger',
      actorRole: 'DPDP Officer',
      action: `Consent changed to ${status.toUpperCase()}`,
      details: `Patient ${patient.name} (${patient.phone}) consent changed. Reason: ${reason || 'Direct change'}`,
      type: 'consent',
    });

    this.persist();
    return patient;
  }

  public deletePatient(id: string): boolean {
    const idx = this.data.patients.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const p = this.data.patients[idx];
    this.data.patients.splice(idx, 1);
    this.addAuditLog({
      actor: 'Chief Pharmacist',
      actorRole: 'Admin',
      action: 'Patient Deactivated / Deleted (DPDP Right to be Forgotten)',
      details: `Permanent record removal for ${p.name} (${p.phone})`,
      type: 'patient',
    });
    this.persist();
    return true;
  }

  // --- Refill Requests ---
  public getRefillRequests(status?: string): RefillRequest[] {
    if (status && status !== 'all') {
      return this.data.refillRequests.filter((r) => r.status === status);
    }
    return this.data.refillRequests;
  }

  public createRefillRequest(reqData: Omit<RefillRequest, 'id' | 'requestId' | 'requestedAt'>): RefillRequest {
    const id = `ref-${Date.now().toString(36)}`;
    const randomNum = Math.floor(100 + Math.random() * 900);
    const newReq: RefillRequest = {
      ...reqData,
      id,
      requestId: `REF-2026-${randomNum}`,
      requestedAt: new Date().toISOString(),
    };

    this.data.refillRequests.unshift(newReq);

    // Update patient status
    const patient = this.getPatientById(newReq.patientId);
    if (patient) {
      patient.reminderStatus = 'refill_requested';
      patient.updatedAt = new Date().toISOString();
    }

    this.addAuditLog({
      actor: 'WhatsApp Patient Channel',
      actorRole: 'System',
      action: 'Refill Order Created',
      details: `${newReq.patientName} placed refill #${newReq.requestId} (Total: ₹${newReq.totalEstimatedCost})`,
      type: 'refill',
    });

    this.persist();
    return newReq;
  }

  public updateRefillRequestStatus(
    id: string,
    status: RefillRequest['status'],
    options?: { staffName?: string; invoiceNumber?: string; paymentStatus?: RefillRequest['paymentStatus'] }
  ): RefillRequest | null {
    const req = this.data.refillRequests.find((r) => r.id === id || r.requestId === id);
    if (!req) return null;

    req.status = status;
    const now = new Date().toISOString();

    if (status === 'pharmacist_reviewing') {
      req.reviewedAt = now;
      if (options?.staffName) req.dispensedByStaff = options.staffName;
    } else if (status === 'dispensed_completed') {
      req.fulfilledAt = now;
      if (options?.staffName) req.dispensedByStaff = options.staffName;
      if (options?.invoiceNumber) req.billInvoiceNumber = options.invoiceNumber;
      if (options?.paymentStatus) req.paymentStatus = options.paymentStatus;

      // Automatically update patient last refill date to today, and next due date to +30 days!
      const patient = this.getPatientById(req.patientId);
      if (patient) {
        const todayStr = now.split('T')[0];
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + (patient.refillCycleDays || 30));
        patient.lastRefillDate = todayStr;
        patient.nextRefillDueDate = nextDate.toISOString().split('T')[0];
        patient.reminderStatus = 'upcoming';
        patient.updatedAt = now;
      }
    }

    this.addAuditLog({
      actor: options?.staffName || 'Pharmacist on Duty',
      actorRole: 'Staff',
      action: `Refill #${req.requestId} status changed to ${status}`,
      details: `Updated refill pipeline for ${req.patientName}`,
      type: 'refill',
    });

    this.persist();
    return req;
  }

  // --- Reminders Engine ---
  public getReminders(): ReminderEvent[] {
    return this.data.reminders;
  }

  public dispatchReminder(patientId: string, customMessage?: string): { success: boolean; reminder?: ReminderEvent; reason?: string } {
    const patient = this.getPatientById(patientId);
    if (!patient) return { success: false, reason: 'Patient not found' };

    if (patient.consent.status !== 'opted_in') {
      return { success: false, reason: `Cannot send reminder: Patient consent status is ${patient.consent.status}` };
    }

    // Check Quiet Hours
    const settings = this.getSettings();
    if (settings.quietHours.enabled) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMins = now.getMinutes();
      const currentTimeNum = currentHours * 60 + currentMins;

      const [startH, startM] = settings.quietHours.start.split(':').map(Number);
      const [endH, endM] = settings.quietHours.end.split(':').map(Number);
      const startNum = startH * 60 + startM;
      const endNum = endH * 60 + endM;

      const isQuietTime = startNum > endNum
        ? currentTimeNum >= startNum || currentTimeNum < endNum
        : currentTimeNum >= startNum && currentTimeNum < endNum;

      if (isQuietTime) {
        console.warn(`[Quiet Hours Notice] Current time is within quiet hours (${settings.quietHours.start} - ${settings.quietHours.end}). Simulation will deliver with warning flag.`);
      }
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const dueDate = new Date(patient.nextRefillDueDate);
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

    const medNames = patient.medications.map((m) => `${m.name} (${m.quantityPerRefill} ${m.unit})`).join(', ');
    const totalAmount = patient.medications.reduce((sum, m) => sum + (m.price || 0), 0);

    const reminderId = `rem-${Date.now().toString(36)}`;
    const metaMessageId = `wamid.${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

    const newReminder: ReminderEvent = {
      id: reminderId,
      patientId: patient.id,
      patientName: patient.name,
      patientPhone: patient.phone,
      templateName: 'refill_reminder_v2',
      channel: 'whatsapp',
      scheduledDate: todayStr,
      sentAt: now.toISOString(),
      status: 'delivered',
      messagePayload: {
        medicationSummary: medNames,
        daysRemaining,
        dueDate: patient.nextRefillDueDate,
        estimatedAmount: totalAmount,
        deliveryAddress: patient.address,
      },
      metaMessageId,
      deliveryReceipts: [
        { status: 'queued', timestamp: new Date(now.getTime() - 2000).toISOString() },
        { status: 'sent', timestamp: new Date(now.getTime() - 1000).toISOString() },
        { status: 'delivered', timestamp: now.toISOString() },
      ],
      retryCount: 0,
    };

    this.data.reminders.unshift(newReminder);
    patient.reminderStatus = 'delivered';
    patient.updatedAt = now.toISOString();

    // Also add to chat messages for the patient!
    const reminderChatMsg: WhatsAppChatMessage = {
      id: `msg-${Date.now()}`,
      patientId: patient.id,
      direction: 'outbound',
      timestamp: now.toISOString(),
      type: 'interactive',
      text: customMessage || `Namaste ${patient.name} ji 🙏\n\nThis is a friendly reminder from *${settings.name}*.\n\nYour chronic care medications:\n${patient.medications.map((m) => `• ${m.name} (${m.dosage})`).join('\n')}\n\nEstimated supply remaining: *${daysRemaining} day(s)* (Due: ${patient.nextRefillDueDate}).\nEstimated Total: *₹${totalAmount}*\n\nWould you like us to prepare your refill?`,
      status: 'delivered',
      buttons: [
        { title: '📦 Request Refill', payload: 'ACTION_REQUEST_REFILL' },
        { title: '⏰ Remind Me Later', payload: 'ACTION_REMIND_LATER' },
        { title: '🛑 Stop Reminders', payload: 'ACTION_STOP_REMINDERS' },
      ],
    };
    this.data.chatMessages.push(reminderChatMsg);

    this.addAuditLog({
      actor: 'WhatsApp Cloud Dispatcher',
      actorRole: 'System',
      action: 'Refill Reminder Sent',
      details: `WhatsApp reminder dispatched to ${patient.name} (${patient.phone}) via template refill_reminder_v2`,
      type: 'whatsapp',
    });

    this.persist();
    return { success: true, reminder: newReminder };
  }

  public runBatchScheduler(): { triggeredCount: number; skippedCount: number; details: string[] } {
    const settings = this.getSettings();
    const bufferDays = settings.reminderTiming.bufferDaysBeforeDue || 3;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let triggeredCount = 0;
    let skippedCount = 0;
    const details: string[] = [];

    for (const patient of this.data.patients) {
      if (!patient.active) {
        skippedCount++;
        continue;
      }
      if (patient.consent.status !== 'opted_in') {
        skippedCount++;
        details.push(`Skipped ${patient.name}: Consent is ${patient.consent.status}`);
        continue;
      }

      // Check if already sent today
      const alreadySentToday = this.data.reminders.some(
        (r) => r.patientId === patient.id && r.scheduledDate === todayStr && r.status !== 'failed'
      );
      if (alreadySentToday) {
        skippedCount++;
        continue;
      }

      // Calculate days until due
      const dueDate = new Date(patient.nextRefillDueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

      // Trigger if due within bufferDays (e.g. 3 days) or overdue (diffDays <= bufferDays)
      if (diffDays <= bufferDays && diffDays >= -7) {
        const result = this.dispatchReminder(patient.id);
        if (result.success) {
          triggeredCount++;
          details.push(`Dispatched to ${patient.name} (Due in ${diffDays} days)`);
        }
      } else {
        skippedCount++;
      }
    }

    this.addAuditLog({
      actor: 'Batch Reminder Scheduler',
      actorRole: 'Cron / Dispatcher',
      action: 'Batch Reminder Execution',
      details: `Executed scheduled run: ${triggeredCount} reminders dispatched, ${skippedCount} skipped`,
      type: 'reminder',
    });

    this.persist();
    return { triggeredCount, skippedCount, details };
  }

  // --- WhatsApp Inbound & Simulator ---
  public handleWhatsAppInbound(patientId: string, actionPayload: string, textReply?: string): { success: boolean; message: string; refillRequest?: RefillRequest } {
    const patient = this.getPatientById(patientId);
    if (!patient) return { success: false, message: 'Patient not found' };

    const now = new Date();
    const nowIso = now.toISOString();

    // Add incoming chat message
    const inboundMsg: WhatsAppChatMessage = {
      id: `msg-${Date.now()}`,
      patientId: patient.id,
      direction: 'inbound',
      timestamp: nowIso,
      type: 'button_reply',
      text: textReply || (actionPayload === 'ACTION_REQUEST_REFILL' ? '📦 Request Refill' : actionPayload === 'ACTION_REMIND_LATER' ? '⏰ Remind Me Later' : '🛑 Stop Reminders'),
      selectedButton: actionPayload,
    };
    this.data.chatMessages.push(inboundMsg);

    // Find latest reminder to update status
    const latestReminder = this.data.reminders.find((r) => r.patientId === patient.id);
    if (latestReminder) {
      latestReminder.status = 'responded';
      latestReminder.responseAt = nowIso;
      latestReminder.responseText = inboundMsg.text;
    }

    if (actionPayload === 'ACTION_REQUEST_REFILL') {
      if (latestReminder) latestReminder.responseType = 'request_refill';
      patient.reminderStatus = 'refill_requested';

      // Create Refill Order automatically!
      const totalCost = patient.medications.reduce((sum, m) => sum + (m.price || 0), 0);
      const newRefillReq = this.createRefillRequest({
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        patientAddress: patient.address,
        medications: patient.medications.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          quantity: m.quantityPerRefill,
          unit: m.unit,
          price: m.price,
        })),
        totalEstimatedCost: totalCost,
        fulfillmentType: patient.deliveryPreference === 'store_pickup' ? 'store_pickup' : 'home_delivery',
        preferredTimeSlot: 'As soon as possible',
        patientNotes: 'One-tap refill request confirmed via WhatsApp button',
        status: 'new_request',
        paymentStatus: 'pending',
      });

      // Immediate confirmation WhatsApp response
      const settings = this.getSettings();
      const replyMsg: WhatsAppChatMessage = {
        id: `msg-${Date.now() + 1}`,
        patientId: patient.id,
        direction: 'outbound',
        timestamp: new Date(now.getTime() + 1000).toISOString(),
        type: 'text',
        text: `Dhanyawad ${patient.name} ji! 🌿\n\nYour refill request *#${newRefillReq.requestId}* has been received at *${settings.name}*.\n\nOur pharmacist is reviewing your prescription and preparing your medications.\n📍 Address: ${patient.address}\n💵 Estimated Total: ₹${totalCost}\n\nWe will message you when packed. For immediate changes, call us at ${settings.phone}.`,
        status: 'delivered',
      };
      this.data.chatMessages.push(replyMsg);

      this.persist();
      return { success: true, message: 'Refill request created and confirmation sent', refillRequest: newRefillReq };
    }

    if (actionPayload === 'ACTION_REMIND_LATER') {
      if (latestReminder) latestReminder.responseType = 'remind_later';
      patient.reminderStatus = 'snoozed';

      // Snooze due date by 2 days
      const currentDueDate = new Date(patient.nextRefillDueDate);
      currentDueDate.setDate(currentDueDate.getDate() + 2);
      patient.nextRefillDueDate = currentDueDate.toISOString().split('T')[0];

      const replyMsg: WhatsAppChatMessage = {
        id: `msg-${Date.now() + 1}`,
        patientId: patient.id,
        direction: 'outbound',
        timestamp: new Date(now.getTime() + 1000).toISOString(),
        type: 'text',
        text: `Got it, ${patient.name} ji! 👍\n\nWe have snoozed your reminder. We will check in with you again in 48 hours. Take care!`,
        status: 'delivered',
      };
      this.data.chatMessages.push(replyMsg);

      this.addAuditLog({
        actor: 'Patient via WhatsApp',
        actorRole: 'Patient',
        action: 'Reminder Snoozed',
        details: `Patient ${patient.name} requested Remind Me Later (+2 days)`,
        type: 'whatsapp',
      });

      this.persist();
      return { success: true, message: 'Reminder snoozed for 48 hours' };
    }

    if (actionPayload === 'ACTION_STOP_REMINDERS') {
      if (latestReminder) latestReminder.responseType = 'stop_reminders';
      this.updatePatientConsent(patient.id, 'opted_out', 'Patient clicked Stop Reminders on WhatsApp');

      const replyMsg: WhatsAppChatMessage = {
        id: `msg-${Date.now() + 1}`,
        patientId: patient.id,
        direction: 'outbound',
        timestamp: new Date(now.getTime() + 1000).toISOString(),
        type: 'text',
        text: `You have successfully unsubscribed from automated WhatsApp refill reminders from ${this.getSettings().name}. You will not receive any further automated messages.\n\nTo restart anytime, simply reply "START".`,
        status: 'delivered',
      };
      this.data.chatMessages.push(replyMsg);

      this.persist();
      return { success: true, message: 'Patient opted out. All automated messages stopped.' };
    }

    // Default free-text reply
    const replyMsg: WhatsAppChatMessage = {
      id: `msg-${Date.now() + 1}`,
      patientId: patient.id,
      direction: 'outbound',
      timestamp: new Date(now.getTime() + 1000).toISOString(),
      type: 'text',
      text: `Thank you for your message, ${patient.name} ji! Pharmacist Ramesh Shastri has been notified and will assist you shortly at ${this.getSettings().phone}.`,
      status: 'delivered',
    };
    this.data.chatMessages.push(replyMsg);

    this.persist();
    return { success: true, message: 'Message logged and acknowledged' };
  }

  public getChatMessages(patientId: string): WhatsAppChatMessage[] {
    return this.data.chatMessages.filter((m) => m.patientId === patientId);
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const newLog: AuditLog = {
      ...log,
      id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(newLog);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
  }

  // --- Dashboard Stats Summary ---
  public getStats() {
    const totalPatients = this.data.patients.filter((p) => p.active).length;
    const optedInPatients = this.data.patients.filter((p) => p.consent.status === 'opted_in').length;
    const optedOutPatients = this.data.patients.filter((p) => p.consent.status === 'opted_out').length;

    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);
    const nowStr = now.toISOString().split('T')[0];
    const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];

    const upcomingRefills = this.data.patients.filter(
      (p) => p.active && p.nextRefillDueDate >= nowStr && p.nextRefillDueDate <= sevenDaysStr
    ).length;

    const overdueRefills = this.data.patients.filter(
      (p) => p.active && p.nextRefillDueDate < nowStr
    ).length;

    const pendingRefillRequests = this.data.refillRequests.filter(
      (r) => r.status === 'new_request' || r.status === 'pharmacist_reviewing' || r.status === 'packed_ready'
    ).length;

    const remindersToday = this.data.reminders.filter((r) => r.scheduledDate === nowStr).length;
    const deliveredCount = this.data.reminders.filter((r) => r.status === 'delivered' || r.status === 'read' || r.status === 'responded').length;
    const responseCount = this.data.reminders.filter((r) => r.status === 'responded').length;

    const adherenceRate = totalPatients > 0
      ? Math.round(((totalPatients - overdueRefills) / totalPatients) * 100)
      : 92;

    return {
      totalPatients,
      optedInPatients,
      optedOutPatients,
      upcomingRefills,
      overdueRefills,
      pendingRefillRequests,
      remindersToday,
      totalRemindersSent: this.data.reminders.length,
      deliveredRate: this.data.reminders.length > 0 ? Math.round((deliveredCount / this.data.reminders.length) * 100) : 100,
      responseRate: this.data.reminders.length > 0 ? Math.round((responseCount / this.data.reminders.length) * 100) : 75,
      adherenceRate,
    };
  }

  // Reset to initial demo data
  public resetToSeed(): void {
    this.data = {
      settings: initialPharmacySettings,
      patients: initialPatients,
      refillRequests: initialRefillRequests,
      reminders: initialReminders,
      auditLogs: initialAuditLogs,
      chatMessages: initialChatMessages,
    };
    this.persist();
  }
}

export const store = new DataStore();
