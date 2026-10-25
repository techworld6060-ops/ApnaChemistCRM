import React, { useState } from 'react';
import {
  X,
  Phone,
  Calendar,
  Pill,
  ShieldCheck,
  Clock,
  Send,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Edit2,
  ExternalLink,
} from 'lucide-react';
import { Patient, ConsentStatus, ReminderEvent } from '../types';

interface PatientDetailDrawerProps {
  patient: Patient | null;
  onClose: () => void;
  onUpdateConsent: (patientId: string, status: ConsentStatus, reason?: string) => Promise<void>;
  onDispatchReminder: (patientId: string) => Promise<void>;
  onDeletePatient: (patientId: string) => Promise<void>;
  onOpenSimulatorForPatient: (patientId: string) => void;
  reminders: ReminderEvent[];
}

export const PatientDetailDrawer: React.FC<PatientDetailDrawerProps> = ({
  patient,
  onClose,
  onUpdateConsent,
  onDispatchReminder,
  onDeletePatient,
  onOpenSimulatorForPatient,
  reminders,
}) => {
  if (!patient) return null;

  const [optOutReason, setOptOutReason] = useState('');
  const [showOptOutDialog, setShowOptOutDialog] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState('');

  const patientReminders = reminders.filter((r) => r.patientId === patient.id);

  const today = new Date();
  const dueDate = new Date(patient.nextRefillDueDate);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  const isOverdue = diffDays < 0;

  const handleSendReminder = async () => {
    try {
      setIsSendingReminder(true);
      setSendSuccessMsg('');
      await onDispatchReminder(patient.id);
      setSendSuccessMsg('WhatsApp reminder successfully dispatched!');
      setTimeout(() => setSendSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch reminder');
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleConsentChange = async (newStatus: ConsentStatus) => {
    if (newStatus === 'opted_out') {
      setShowOptOutDialog(true);
      return;
    }
    await onUpdateConsent(patient.id, newStatus);
  };

  const confirmOptOut = async () => {
    await onUpdateConsent(patient.id, 'opted_out', optOutReason || 'Customer requested opt-out');
    setShowOptOutDialog(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-2xs">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {patient.uhid}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  patient.consent.status === 'opted_in'
                    ? 'bg-emerald-100 text-emerald-800'
                    : patient.consent.status === 'paused'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {patient.consent.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{patient.name}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{patient.gender}, {patient.age} yrs</span>
              <span>•</span>
              <span className="font-mono">{patient.phone}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenSimulatorForPatient(patient.id)}
              className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Open WhatsApp Simulator for this patient"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {sendSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{sendSuccessMsg}</span>
            </div>
          )}

          {/* Due Status & Quick Dispatch Banner */}
          <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-teal-50/30 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Refill Due Status
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-base font-extrabold ${
                    isOverdue ? 'text-rose-600' : diffDays <= 3 ? 'text-amber-600' : 'text-slate-900'
                  }`}
                >
                  {isOverdue ? `${Math.abs(diffDays)} Days Overdue` : diffDays === 0 ? 'Due Today' : `Due in ${diffDays} Days`}
                </span>
                <span className="text-slate-500 font-mono">({patient.nextRefillDueDate})</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Last Refill: {patient.lastRefillDate} • Cycle: {patient.refillCycleDays} Days
              </p>
            </div>

            <button
              onClick={handleSendReminder}
              disabled={isSendingReminder || patient.consent.status !== 'opted_in'}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSendingReminder ? 'animate-spin' : ''}`} />
              <span>{isSendingReminder ? 'Sending...' : 'Send Reminder'}</span>
            </button>
          </div>

          {/* Chronic Conditions */}
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
              Therapy Areas
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {patient.chronicConditions.map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-semibold text-[11px]"
                >
                  {c}
                </span>
              ))}
              {patient.doctorName && (
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-medium text-[11px] border border-blue-100">
                  Doctor: {patient.doctorName}
                </span>
              )}
            </div>
          </div>

          {/* Prescribed Medications */}
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2.5 flex items-center justify-between">
              <span>Prescription Regimen</span>
              <span className="text-slate-500 font-normal">
                Est. Total: ₹{patient.medications.reduce((sum, m) => sum + m.price, 0)}
              </span>
            </h4>
            <div className="space-y-2">
              {patient.medications.map((med) => (
                <div
                  key={med.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{med.name}</p>
                      <p className="text-[11px] text-slate-500">{med.dosage}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <span>Daily: {med.dailyDose}/day</span>
                        <span>•</span>
                        <span>Qty: {med.quantityPerRefill} {med.unit}</span>
                        <span>•</span>
                        <span>{med.daysSupply} days supply</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900 text-xs">₹{med.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Address */}
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
              Fulfillment & Delivery
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Preference:</span>
                <span className="font-semibold text-slate-900 capitalize">
                  {patient.deliveryPreference.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Address:</span>
                <span className="font-medium text-slate-900 text-right max-w-[280px]">
                  {patient.address || 'In-store counter pickup'}
                </span>
              </div>
              {patient.notes && (
                <div className="pt-2 border-t border-slate-200/60 text-slate-500 italic">
                  Note: {patient.notes}
                </div>
              )}
            </div>
          </div>

          {/* DPDP Consent & Privacy Ledger */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-800 text-xs">Consent Ledger (DPDP Compliant)</h4>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(patient.consent.timestamp).toLocaleDateString()}
              </span>
            </div>

            <div className="text-[11px] text-slate-600 space-y-1">
              <p>
                <span className="text-slate-400">Opt-in Source:</span>{' '}
                <span className="font-semibold capitalize text-slate-800">
                  {patient.consent.source.replace(/_/g, ' ')}
                </span>
              </p>
              {patient.consent.notes && (
                <p>
                  <span className="text-slate-400">Audit Notes:</span> {patient.consent.notes}
                </p>
              )}
              {patient.consent.optOutTimestamp && (
                <p className="text-rose-600 font-medium">
                  Opted out on: {new Date(patient.consent.optOutTimestamp).toLocaleString()} ({patient.consent.optOutReason})
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Update Status:</span>
              {patient.consent.status !== 'opted_in' && (
                <button
                  onClick={() => handleConsentChange('opted_in')}
                  className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded text-[11px] border border-emerald-200"
                >
                  Opt-In
                </button>
              )}
              {patient.consent.status !== 'paused' && (
                <button
                  onClick={() => handleConsentChange('paused')}
                  className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold rounded text-[11px] border border-amber-200"
                >
                  Pause
                </button>
              )}
              {patient.consent.status !== 'opted_out' && (
                <button
                  onClick={() => handleConsentChange('opted_out')}
                  className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold rounded text-[11px] border border-rose-200"
                >
                  Opt-Out
                </button>
              )}
            </div>
          </div>

          {/* Past Reminders & Responses */}
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2.5">
              WhatsApp Reminders History ({patientReminders.length})
            </h4>
            {patientReminders.length === 0 ? (
              <p className="text-slate-400 text-xs italic">No reminders sent yet.</p>
            ) : (
              <div className="space-y-2">
                {patientReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">
                        Template: {rem.templateName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rem.status === 'responded'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rem.status === 'delivered'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rem.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Dispatched: {rem.sentAt ? new Date(rem.sentAt).toLocaleString() : rem.scheduledDate}
                    </p>
                    {rem.responseText && (
                      <div className="p-2 bg-emerald-50 rounded text-emerald-900 text-[11px] font-medium border border-emerald-100">
                        Patient Response: {rem.responseText}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete / Right to be Forgotten */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-400">DPDP Right to be Forgotten</span>
            <button
              onClick={() => {
                if (confirm(`Permanently delete all records for ${patient.name}? This complies with DPDP erasure rules and cannot be undone.`)) {
                  onDeletePatient(patient.id);
                  onClose();
                }
              }}
              className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Patient Record</span>
            </button>
          </div>
        </div>

        {/* Opt-Out Modal Dialog */}
        {showOptOutDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40">
            <div className="bg-white rounded-xl p-5 max-w-sm w-full space-y-4 shadow-xl border">
              <h3 className="font-bold text-slate-900 text-sm">Confirm Patient Opt-Out</h3>
              <p className="text-xs text-slate-600">
                Please record the reason for opting out. Future automated WhatsApp messages will be blocked.
              </p>
              <input
                type="text"
                placeholder="Reason (e.g. Switched pharmacy / prefers phone call)"
                value={optOutReason}
                onChange={(e) => setOptOutReason(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowOptOutDialog(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmOptOut}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded"
                >
                  Confirm Opt-Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
