import React, { useState } from 'react';
import {
  BellRing,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  FileText,
  Sliders,
  Calendar,
  Sparkles,
  Smartphone,
  Eye,
} from 'lucide-react';
import { ReminderEvent, PharmacySettings, Patient } from '../types';

interface RemindersSystemProps {
  reminders: ReminderEvent[];
  patients: Patient[];
  settings: PharmacySettings | null;
  onRunBatchScheduler: () => Promise<void>;
  onDispatchReminder: (patientId: string) => Promise<void>;
  onUpdateSettings: (settings: Partial<PharmacySettings>) => Promise<void>;
  isDispatchingBatch: boolean;
  onOpenSimulatorForPatient: (patientId: string) => void;
}

export const RemindersSystem: React.FC<RemindersSystemProps> = ({
  reminders,
  patients,
  settings,
  onRunBatchScheduler,
  onDispatchReminder,
  onUpdateSettings,
  isDispatchingBatch,
  onOpenSimulatorForPatient,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'logs' | 'templates' | 'rules'>('queue');
  const [selectedTemplate, setSelectedTemplate] = useState('refill_reminder_v2');
  const [bufferDays, setBufferDays] = useState(settings?.reminderTiming.bufferDaysBeforeDue || 3);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(settings?.quietHours.enabled ?? true);
  const [quietStart, setQuietStart] = useState(settings?.quietHours.start || '20:30');
  const [quietEnd, setQuietEnd] = useState(settings?.quietHours.end || '08:30');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');

  // Queue of patients due for reminders
  const today = new Date();
  const queuePatients = patients.filter((p) => {
    if (!p.active) return false;
    if (p.consent.status !== 'opted_in') return false;

    const due = new Date(p.nextRefillDueDate);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    // Due within configured bufferDays
    return diffDays <= bufferDays && diffDays >= -7;
  });

  const handleSaveRules = async () => {
    try {
      setIsSavingSettings(true);
      await onUpdateSettings({
        reminderTiming: {
          ...settings?.reminderTiming,
          bufferDaysBeforeDue: Number(bufferDays),
          preferredSendTime: settings?.reminderTiming.preferredSendTime || '10:00',
          allowAutoBatch: true,
        },
        quietHours: {
          enabled: quietHoursEnabled,
          start: quietStart,
          end: quietEnd,
        },
      });
      setSaveFeedback('Reminder schedule and quiet hours successfully updated!');
      setTimeout(() => setSaveFeedback(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update rules');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Automated Refill Reminders Engine
          </h1>
          <p className="text-xs text-slate-500">
            Intelligent scheduler calculating prescription run-out dates and dispatching WhatsApp interactive messages
          </p>
        </div>

        <button
          onClick={onRunBatchScheduler}
          disabled={isDispatchingBatch}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-teal-600/30 active:scale-95 disabled:opacity-50"
        >
          <Send className={`w-3.5 h-3.5 ${isDispatchingBatch ? 'animate-bounce' : ''}`} />
          <span>{isDispatchingBatch ? 'Broadcasting Batch...' : 'Run Automated Scheduler Now'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'queue'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Today's Reminder Queue</span>
          <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px]">
            {queuePatients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Delivery & Response Logs</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
            {reminders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Meta WhatsApp Templates</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Timing & Quiet Hours</span>
        </button>
      </div>

      {/* Tab: Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-slate-900">
                Scheduled Execution Window: {settings?.reminderTiming.bufferDaysBeforeDue || 3} Days Prior
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                The scheduler checks all opted-in chronic patients whose current supply runs out in ≤ {settings?.reminderTiming.bufferDaysBeforeDue || 3} days.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Opt-In Filter Enforced</span>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-3">Therapy / Medications</th>
                    <th className="py-3 px-3">Supply Due Date</th>
                    <th className="py-3 px-3">Days Remaining</th>
                    <th className="py-3 px-3">Est. Amount</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queuePatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        No reminders queued for today. All chronic patients have adequate supply!
                      </td>
                    </tr>
                  ) : (
                    queuePatients.map((p) => {
                      const dueDate = new Date(p.nextRefillDueDate);
                      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                      const totalCost = p.medications.reduce((sum, m) => sum + m.price, 0);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{p.phone}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-[220px]">
                            {p.medications.map((m) => m.name).join(', ')}
                          </td>
                          <td className="py-3 px-3 font-mono font-medium text-slate-700">
                            {p.nextRefillDueDate}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                diffDays < 0
                                  ? 'bg-rose-50 text-rose-700'
                                  : diffDays <= 1
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-teal-50 text-teal-700'
                              }`}
                            >
                              {diffDays < 0 ? `${Math.abs(diffDays)}d Overdue` : diffDays === 0 ? 'Ends Today' : `${diffDays} days`}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">₹{totalCost}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => onOpenSimulatorForPatient(p.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors border border-emerald-200"
                              >
                                Simulator
                              </button>
                              <button
                                onClick={() => onDispatchReminder(p.id)}
                                className="px-3 py-1 text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors shadow-2xs"
                              >
                                Send WhatsApp
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Message ID & Timestamp</th>
                  <th className="py-3 px-3">Patient</th>
                  <th className="py-3 px-3">Template</th>
                  <th className="py-3 px-3">Delivery Status</th>
                  <th className="py-3 px-3">Patient Response</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reminders.map((rem) => (
                  <tr key={rem.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[120px]">
                        {rem.metaMessageId || rem.id}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {rem.sentAt ? new Date(rem.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : rem.scheduledDate}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{rem.patientName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{rem.patientPhone}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {rem.templateName}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rem.status === 'responded'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rem.status === 'read'
                            ? 'bg-blue-100 text-blue-800'
                            : rem.status === 'delivered'
                            ? 'bg-teal-50 text-teal-700'
                            : rem.status === 'failed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rem.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {rem.responseText ? (
                        <div className="font-medium text-slate-800 text-[11px] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{rem.responseText}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Awaiting response</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onOpenSimulatorForPatient(rem.patientId)}
                        className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                      >
                        View Chat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Meta WhatsApp Templates Preview */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Approved WhatsApp Templates
            </h3>
            <div className="space-y-2">
              {[
                {
                  id: 'refill_reminder_v2',
                  name: 'refill_reminder_v2',
                  category: 'UTILITY',
                  status: 'APPROVED',
                  desc: 'Scheduled monthly prescription reminder with 3 interactive action buttons',
                },
                {
                  id: 'order_confirmed_v1',
                  name: 'order_confirmed_v1',
                  category: 'UTILITY',
                  status: 'APPROVED',
                  desc: 'Sent immediately when patient clicks [Request Refill] with invoice & time slot',
                },
                {
                  id: 'consent_optin_confirmation_v1',
                  name: 'consent_optin_confirmation_v1',
                  category: 'AUTHENTICATION',
                  status: 'APPROVED',
                  desc: 'Sent when patient signs up at counter to verify mobile opt-in',
                },
              ].map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedTemplate === tmpl.id
                      ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs font-mono">{tmpl.name}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {tmpl.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{tmpl.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Template Mockup Card */}
          <div className="md:col-span-2 bg-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="font-mono font-bold text-emerald-400">Template: {selectedTemplate}</span>
              </div>
              <span className="text-slate-400 text-[11px]">Language: en_IN / hi_IN</span>
            </div>

            <div className="mt-5 max-w-md mx-auto bg-slate-800/80 rounded-xl p-4 border border-slate-700 shadow-md">
              <div className="text-xs space-y-3 leading-relaxed text-slate-200">
                <p className="font-semibold text-white">
                  Namaste {'{{patient_name}}'} ji 🙏
                </p>
                <p>
                  This is a prescription care update from <strong className="text-teal-300">{'{{pharmacy_name}}'}</strong>.
                </p>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700 text-[11px] space-y-1 font-mono text-slate-300">
                  <p>• {'{{medication_list}}'}</p>
                  <p className="text-amber-300">Estimated supply remaining: {'{{days_remaining}}'} days</p>
                  <p>Estimated total: ₹{'{{estimated_amount}}'}</p>
                </div>
                <p className="text-[11px] text-slate-300">
                  Would you like our pharmacist to pack and deliver your regular refill?
                </p>
              </div>

              {/* Quick Reply Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-700/80 space-y-2">
                <div className="py-2 bg-teal-600/30 text-teal-300 font-bold text-xs text-center rounded-lg border border-teal-500/40">
                  📦 Request Refill
                </div>
                <div className="py-2 bg-slate-700/40 text-slate-300 font-medium text-xs text-center rounded-lg border border-slate-600">
                  ⏰ Remind Me Later
                </div>
                <div className="py-2 bg-rose-950/30 text-rose-300 font-medium text-xs text-center rounded-lg border border-rose-800/40">
                  🛑 Stop Reminders
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-4">
              Registered with Meta WhatsApp Business Account under category "Healthcare Utility"
            </p>
          </div>
        </div>
      )}

      {/* Tab: Timing & Quiet Hours */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 max-w-2xl space-y-5 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Reminder Timing & Quiet Hours</h3>
            <p className="text-slate-500 text-[11px]">
              Configure when automatic refill notices should be triggered and enforce strict quiet hours
            </p>
          </div>

          {saveFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveFeedback}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Refill Reminder Buffer (Days before prescription expires)
              </label>
              <select
                value={bufferDays}
                onChange={(e) => setBufferDays(Number(e.target.value))}
                className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value={1}>1 Day Prior</option>
                <option value={2}>2 Days Prior</option>
                <option value={3}>3 Days Prior (Recommended for Indian Retail Chemist)</option>
                <option value={5}>5 Days Prior</option>
                <option value={7}>7 Days Prior (1 Week)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                A 3-day buffer provides patients ample time to order without experiencing medicine stock-outs.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span className="font-semibold text-slate-800">
                  Enforce Patient Quiet Hours (No automated messages during rest times)
                </span>
              </label>

              {quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-md">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Quiet Hours Start
                    </label>
                    <input
                      type="time"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Quiet Hours End
                    </label>
                    <input
                      type="time"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleSaveRules}
                disabled={isSavingSettings}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs transition-colors shadow-2xs"
              >
                {isSavingSettings ? 'Saving...' : 'Save Timing Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
