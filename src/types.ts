export type ConsentStatus = 'opted_in' | 'paused' | 'opted_out';
export type ConsentSource = 'in_store_form' | 'qr_counter' | 'whatsapp_join' | 'verbal_consent';
export type DeliveryPreference = 'home_delivery' | 'store_pickup' | 'either';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  form: 'tablet' | 'capsule' | 'syrup' | 'inhaler' | 'injection' | 'drops';
  dailyDose: number;
  quantityPerRefill: number;
  unit: 'strips' | 'bottles' | 'units' | 'inhalers' | 'vials';
  daysSupply: number;
  price: number;
}

export interface Patient {
  id: string;
  uhid: string; // ApnaChemist unique ID e.g. AC-PAT-1042
  name: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  locality: string;
  city: string;
  pincode: string;
  deliveryPreference: DeliveryPreference;
  chronicConditions: string[];
  doctorName?: string;
  medications: Medication[];
  refillCycleDays: number;
  lastRefillDate: string; // YYYY-MM-DD
  nextRefillDueDate: string; // YYYY-MM-DD
  consent: {
    status: ConsentStatus;
    timestamp: string;
    source: ConsentSource;
    optOutTimestamp?: string;
    optOutReason?: string;
    notes?: string;
  };
  reminderStatus: 'upcoming' | 'queued' | 'sent' | 'delivered' | 'read' | 'refill_requested' | 'snoozed' | 'opted_out';
  notes: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderEvent {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  templateName: string;
  channel: 'whatsapp';
  scheduledDate: string;
  sentAt?: string;
  status: 'scheduled' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'responded';
  responseType?: 'request_refill' | 'remind_later' | 'stop_reminders' | 'custom_message';
  responseText?: string;
  responseAt?: string;
  messagePayload: {
    medicationSummary: string;
    daysRemaining: number;
    dueDate: string;
    estimatedAmount: number;
    deliveryAddress: string;
  };
  metaMessageId?: string;
  deliveryReceipts: Array<{
    status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
  }>;
  retryCount: number;
  errorReason?: string;
}

export interface RefillRequest {
  id: string;
  requestId: string; // e.g. REF-2026-081
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAddress: string;
  medications: Array<{
    name: string;
    dosage: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  totalEstimatedCost: number;
  fulfillmentType: 'home_delivery' | 'store_pickup';
  preferredTimeSlot?: string;
  patientNotes?: string;
  status: 'new_request' | 'pharmacist_reviewing' | 'packed_ready' | 'out_for_delivery' | 'dispensed_completed' | 'cancelled';
  requestedAt: string;
  reviewedAt?: string;
  fulfilledAt?: string;
  dispensedByStaff?: string;
  paymentStatus: 'pending' | 'cod_home_delivery' | 'upi_collected' | 'paid_counter';
  billInvoiceNumber?: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'Chief Pharmacist' | 'Registered Pharmacist' | 'Dispensing Assistant' | 'Store Manager';
  phone: string;
  regNumber?: string; // State Pharmacy Council Reg No.
  active: boolean;
}

export interface PharmacySettings {
  id: string;
  name: string;
  tagline: string;
  dlNumber: string; // Drug License 20B/21B
  gstin: string;
  phone: string;
  whatsappBusinessNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  upiId: string;
  businessHours: {
    open: string;
    close: string;
  };
  quietHours: {
    enabled: boolean;
    start: string; // e.g. "20:00"
    end: string; // e.g. "09:00"
  };
  reminderTiming: {
    bufferDaysBeforeDue: number; // default 3 days
    preferredSendTime: string; // e.g. "10:30"
    allowAutoBatch: boolean;
  };
  sandboxMode: boolean;
  metaCloudApi: {
    enabled: boolean;
    phoneNumberId: string;
    wabaId: string;
    accessToken: string;
    webhookVerifyToken: string;
    apiVersion: string;
  };
  staffUsers: StaffUser[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  details: string;
  type: 'patient' | 'reminder' | 'refill' | 'consent' | 'system' | 'whatsapp';
}

export interface WhatsAppChatMessage {
  id: string;
  patientId: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  type: 'template' | 'text' | 'button_reply' | 'interactive';
  text: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  buttons?: Array<{ title: string; payload: string }>;
  selectedButton?: string;
}
