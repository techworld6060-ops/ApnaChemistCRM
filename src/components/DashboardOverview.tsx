import React from 'react';
import {
  Users,
  Calendar,
  PackageCheck,
  BellRing,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Patient, RefillRequest, ReminderEvent, AuditLog } from '../types';

interface DashboardOverviewProps {
  stats: any;
  patients: Patient[];
  refillRequests: RefillRequest[];
  reminders: ReminderEvent[];
  auditLogs: AuditLog[];
  onSelectTab: (tab: string) => void;
  onOpenEnrolModal: () => void;
  onRunBatchScheduler: () => void;
  onSelectPatient: (patient: Patient) => void;
  isDispatchingBatch: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  patients,
  refillRequests,
  reminders,
  auditLogs,
  onSelectTab,
  onOpenEnrolModal,
  onRunBatchScheduler,
  onSelectPatient,
  isDispatchingBatch,
}) => {
  // Find patients due in next 3 days
  const today = new Date().toISOString().split('T')[0];
  const dueSoonPatients = patients.filter((p) => {
    if (!p.active) return false;
    const due = new Date(p.nextRefillDueDate);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 3 && diffDays >= -5;
  });

  const pendingRequests = refillRequests.filter(
    (r) => r.status === 'new_request' || r.status === 'pharmacist_reviewing'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Greeting */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.18),transparent_70%)] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2.5 border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zero-App Refill & Care System</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Good Morning, Pharmacist 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              You have <span className="text-teal-400 font-semibold">{pendingRequests.length} refill orders</span> awaiting review and <span className="text-teal-400 font-semibold">{stats?.upcomingRefills || 0} patients</span> due for prescription refills this week.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onRunBatchScheduler}
              disabled={isDispatchingBatch}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-900/40 active:scale-95 disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isDispatchingBatch ? 'animate-bounce' : ''}`} />
              <span>{isDispatchingBatch ? 'Broadcasting...' : 'Broadcast Due Reminders'}</span>
            </button>
            <button
              onClick={onOpenEnrolModal}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-all border border-white/15"
            >
              <span>+ Enrol Patient</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Enrolled */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Enrolled</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{stats?.totalPatients || 0}</span>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {stats?.optedInPatients || 0} Opted-In (DPDP)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Active chronic therapy customers</p>
        </div>

        {/* Upcoming Refills */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Upcoming Refills (7 Days)</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{stats?.upcomingRefills || 0}</span>
            {stats?.overdueRefills > 0 ? (
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.overdueRefills} Overdue
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-500">On Track</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Medicines running out soon</p>
        </div>

        {/* Refill Orders Received */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Orders Received</span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{pendingRequests.length}</span>
            <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
              Needs Dispensing
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Placed via WhatsApp one-tap</p>
        </div>

        {/* Refill Adherence Rate */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Adherence Rate</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-700">{stats?.adherenceRate || 92}%</span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              +14% vs unassisted
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Patients refilling on schedule</p>
        </div>
      </div>

      {/* Main Content Grid: Pending Action Queue + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Action Queue & Due Patients */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Queue: Refill Orders Awaiting Dispense */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping"></div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Active Refill Requests ({refillRequests.length})
                </h2>
              </div>
              <button
                onClick={() => onSelectTab('requests')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 group"
              >
                <span>View Full Pipeline</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {refillRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No pending refill requests right now. All caught up!
              </div>
            ) : (
              <div className="space-y-3">
                {refillRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          {req.requestId}
                        </span>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm">
                          {req.patientName}
                        </span>
                        <span className="text-[10px] text-slate-500">{req.patientPhone}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                        {req.medications.map((m) => `${m.name} (${m.quantity} ${m.unit})`).join(', ')}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-900">Total: ₹{req.totalEstimatedCost}</span>
                        <span>•</span>
                        <span className="capitalize">{req.fulfillmentType.replace('_', ' ')}</span>
                        {req.preferredTimeSlot && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 font-medium">{req.preferredTimeSlot}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                          req.status === 'packed_ready'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'pharmacist_reviewing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {req.status.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => onSelectTab('requests')}
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 transition-colors shadow-2xs"
                      >
                        Open Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Urgent / Due Patients List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">
                  Patients Requiring Refill Attention ({dueSoonPatients.length})
                </h2>
                <p className="text-[11px] text-slate-500">
                  Prescription end-date is due within the next 3 days or recently overdue
                </p>
              </div>
              <button
                onClick={() => onSelectTab('patients')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 group"
              >
                <span>All Patients</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-2.5">Patient</th>
                    <th className="pb-2.5">Medications</th>
                    <th className="pb-2.5">Due Date</th>
                    <th className="pb-2.5">Consent</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dueSoonPatients.slice(0, 5).map((p) => {
                    const isOverdue = p.nextRefillDueDate < today;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 pr-2">
                          <button
                            onClick={() => onSelectPatient(p)}
                            className="font-bold text-slate-900 hover:text-teal-600 text-left block"
                          >
                            {p.name}
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono">{p.uhid} • {p.phone}</span>
                        </td>
                        <td className="py-3 pr-2 max-w-[200px] truncate text-slate-600">
                          {p.medications.map((m) => m.name).join(', ')}
                        </td>
                        <td className="py-3 pr-2 whitespace-nowrap">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                              isOverdue
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isOverdue ? 'Overdue' : 'Due'} {p.nextRefillDueDate}
                          </span>
                        </td>
                        <td className="py-3 pr-2">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              p.consent.status === 'opted_in'
                                ? 'bg-emerald-50 text-emerald-700'
                                : p.consent.status === 'paused'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {p.consent.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => onSelectPatient(p)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors"
                          >
                            View Care
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: WhatsApp Performance & Live Activity */}
        <div className="space-y-6">
          {/* WhatsApp Engine Metrics */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Engine</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Cloud API v21.0
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Delivery Success Rate</span>
                  <span className="font-bold text-slate-900">{stats?.deliveredRate || 100}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${stats?.deliveredRate || 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Patient Interactive Response Rate</span>
                  <span className="font-bold text-slate-900">{stats?.responseRate || 75}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full"
                    style={{ width: `${stats?.responseRate || 75}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-base font-extrabold text-slate-900">{stats?.totalRemindersSent || 0}</div>
                  <div className="text-[10px] text-slate-500">Messages Sent</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="text-base font-extrabold text-teal-700">₹0.00</div>
                  <div className="text-[10px] text-slate-500">Sandbox Cost</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('simulator')}
              className="w-full mt-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Open Patient WhatsApp Mirror</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Recent Activity Stream */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Live Activity Stream</span>
              </h2>
              <button
                onClick={() => onSelectTab('audit')}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              >
                Audit Log
              </button>
            </div>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {auditLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 text-xs">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      log.type === 'refill'
                        ? 'bg-teal-500'
                        : log.type === 'consent'
                        ? 'bg-purple-500'
                        : log.type === 'whatsapp'
                        ? 'bg-emerald-500'
                        : 'bg-slate-400'
                    }`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-semibold text-slate-800 truncate">{log.action}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{log.details}</p>
                    <span className="text-[10px] text-slate-400 font-mono">By {log.actor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
