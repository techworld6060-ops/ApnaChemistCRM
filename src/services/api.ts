import {
  Patient,
  PharmacySettings,
  RefillRequest,
  ReminderEvent,
  AuditLog,
  WhatsAppChatMessage,
  ConsentStatus,
} from '../types';

export const api = {
  // Stats
  async getStats() {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    const json = await res.json();
    return json.data;
  },

  // Patients
  async getPatients(params?: { search?: string; status?: string; condition?: string }): Promise<Patient[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.condition) searchParams.set('condition', params.condition);

    const res = await fetch(`/api/patients?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch patients');
    const json = await res.json();
    return json.data;
  },

  async getPatient(id: string): Promise<Patient> {
    const res = await fetch(`/api/patients/${id}`);
    if (!res.ok) throw new Error('Failed to fetch patient');
    const json = await res.json();
    return json.data;
  },

  async createPatient(patientData: Partial<Patient>): Promise<Patient> {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create patient');
    }
    const json = await res.json();
    return json.data;
  },

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    const res = await fetch(`/api/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update patient');
    const json = await res.json();
    return json.data;
  },

  async updateConsent(
    id: string,
    status: ConsentStatus,
    reason?: string,
    notes?: string
  ): Promise<Patient> {
    const res = await fetch(`/api/patients/${id}/consent`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason, notes }),
    });
    if (!res.ok) throw new Error('Failed to update consent');
    const json = await res.json();
    return json.data;
  },

  async deletePatient(id: string): Promise<void> {
    const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete patient');
  },

  // Refill Requests
  async getRefillRequests(status?: string): Promise<RefillRequest[]> {
    const url = status ? `/api/refill-requests?status=${status}` : '/api/refill-requests';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch refill requests');
    const json = await res.json();
    return json.data;
  },

  async createRefillRequest(reqData: Partial<RefillRequest>): Promise<RefillRequest> {
    const res = await fetch('/api/refill-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqData),
    });
    if (!res.ok) throw new Error('Failed to create refill request');
    const json = await res.json();
    return json.data;
  },

  async updateRefillStatus(
    id: string,
    status: RefillRequest['status'],
    options?: { staffName?: string; invoiceNumber?: string; paymentStatus?: RefillRequest['paymentStatus'] }
  ): Promise<RefillRequest> {
    const res = await fetch(`/api/refill-requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...options }),
    });
    if (!res.ok) throw new Error('Failed to update refill status');
    const json = await res.json();
    return json.data;
  },

  // Reminders
  async getReminders(): Promise<ReminderEvent[]> {
    const res = await fetch('/api/reminders');
    if (!res.ok) throw new Error('Failed to fetch reminders');
    const json = await res.json();
    return json.data;
  },

  async dispatchReminder(patientId: string, customMessage?: string): Promise<ReminderEvent> {
    const res = await fetch('/api/reminders/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, customMessage }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to dispatch reminder');
    }
    return json.data;
  },

  async runBatchScheduler(): Promise<{ triggeredCount: number; skippedCount: number; details: string[] }> {
    const res = await fetch('/api/reminders/batch-run', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to run batch scheduler');
    const json = await res.json();
    return json.data;
  },

  // Settings
  async getSettings(): Promise<PharmacySettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    const json = await res.json();
    return json.data;
  },

  async updateSettings(settings: Partial<PharmacySettings>): Promise<PharmacySettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    const json = await res.json();
    return json.data;
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    const json = await res.json();
    return json.data;
  },

  // WhatsApp Chat & Simulation
  async getChat(patientId: string): Promise<WhatsAppChatMessage[]> {
    const res = await fetch(`/api/whatsapp/chat/${patientId}`);
    if (!res.ok) throw new Error('Failed to fetch chat');
    const json = await res.json();
    return json.data;
  },

  async simulateInbound(
    patientId: string,
    actionPayload: string,
    textReply?: string
  ): Promise<{ success: boolean; message: string; refillRequest?: RefillRequest }> {
    const res = await fetch('/api/whatsapp/simulate-incoming', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, actionPayload, textReply }),
    });
    if (!res.ok) throw new Error('Failed to simulate incoming event');
    const json = await res.json();
    return json.data;
  },

  // Demo Reset
  async resetDemo(): Promise<void> {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo');
  },
};
