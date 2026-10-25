import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Send,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  MoreVertical,
  Pill,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
} from 'lucide-react';
import { Patient, ConsentStatus } from '../types';

interface PatientManagementProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onOpenEnrolModal: () => void;
  onDispatchReminder: (patientId: string) => Promise<void>;
  onOpenSimulatorForPatient: (patientId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const PatientManagement: React.FC<PatientManagementProps> = ({
  patients,
  onSelectPatient,
  onOpenEnrolModal,
  onDispatchReminder,
  onOpenSimulatorForPatient,
  searchQuery,
  onSearchChange,
}) => {
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedConsent, setSelectedConsent] = useState('all');
  const [selectedDueFilter, setSelectedDueFilter] = useState('all');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = patient.name.toLowerCase().includes(q);
        const matchesPhone = patient.phone.includes(q);
        const matchesUhid = patient.uhid.toLowerCase().includes(q);
        const matchesLocality = patient.locality.toLowerCase().includes(q);
        const matchesMed = patient.medications.some((m) => m.name.toLowerCase().includes(q));
        if (!matchesName && !matchesPhone && !matchesUhid && !matchesLocality && !matchesMed) {
          return false;
        }
      }

      // Condition
      if (selectedCondition !== 'all') {
        const hasCond = patient.chronicConditions.some((c) =>
          c.toLowerCase().includes(selectedCondition.toLowerCase())
        );
        if (!hasCond) return false;
      }

      // Consent
      if (selectedConsent !== 'all') {
        if (patient.consent.status !== selectedConsent) return false;
      }

      // Due Filter
      if (selectedDueFilter !== 'all') {
        const due = new Date(patient.nextRefillDueDate);
        const now = new Date();
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (selectedDueFilter === 'overdue' && diffDays >= 0) return false;
        if (selectedDueFilter === 'due_3_days' && (diffDays < 0 || diffDays > 3)) return false;
        if (selectedDueFilter === 'due_7_days' && (diffDays < 0 || diffDays > 7)) return false;
      }

      return true;
    });
  }, [patients, searchQuery, selectedCondition, selectedConsent, selectedDueFilter]);

  const handleSendReminder = async (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setSendingId(patientId);
      await onDispatchReminder(patientId);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch reminder');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Patient Care & Refill Management
          </h1>
          <p className="text-xs text-slate-500">
            Manage chronic therapy profiles, WhatsApp consent ledger, and recurring refill schedules
          </p>
        </div>

        <button
          onClick={onOpenEnrolModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Enrol Chronic Patient</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name, mobile number, UHID, or medicine..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Quick Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Condition Filter */}
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Conditions</option>
              <option value="diabetes">Diabetes</option>
              <option value="hypertension">Hypertension</option>
              <option value="thyroid">Thyroid</option>
              <option value="cardiac">Cardiac</option>
              <option value="asthma">Asthma / COPD</option>
            </select>

            {/* Consent Filter */}
            <select
              value={selectedConsent}
              onChange={(e) => setSelectedConsent(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Consent (DPDP)</option>
              <option value="opted_in">Opted-In Only</option>
              <option value="paused">Paused</option>
              <option value="opted_out">Opted-Out</option>
            </select>

            {/* Due Date Filter */}
            <select
              value={selectedDueFilter}
              onChange={(e) => setSelectedDueFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Due Dates</option>
              <option value="due_3_days">Due Within 3 Days</option>
              <option value="due_7_days">Due Within 7 Days</option>
              <option value="overdue">Overdue Refills</option>
            </select>
          </div>
        </div>

        {/* Results Counter & Active Pills */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-900">{filteredPatients.length}</strong> of{' '}
            <strong>{patients.length}</strong> enrolled patients
          </span>
          {(selectedCondition !== 'all' || selectedConsent !== 'all' || selectedDueFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCondition('all');
                setSelectedConsent('all');
                setSelectedDueFilter('all');
                onSearchChange('');
              }}
              className="text-teal-600 hover:text-teal-800 font-semibold"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Patient & UHID</th>
                <th className="py-3 px-3">Therapy / Conditions</th>
                <th className="py-3 px-3">Medications</th>
                <th className="py-3 px-3">Next Refill Due</th>
                <th className="py-3 px-3">Consent Status</th>
                <th className="py-3 px-3">Reminder Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Pill className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No matching patients found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your filters or enrol a new patient</p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const dueDate = new Date(patient.nextRefillDueDate);
                  const now = new Date();
                  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                  const isOverdue = diffDays < 0;
                  const isDueSoon = diffDays >= 0 && diffDays <= 3;

                  return (
                    <tr
                      key={patient.id}
                      onClick={() => onSelectPatient(patient)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors block">
                              {patient.name}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                              <span>{patient.uhid}</span>
                              <span>•</span>
                              <span>{patient.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Conditions */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {patient.chronicConditions.slice(0, 2).map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                            >
                              {c}
                            </span>
                          ))}
                          {patient.chronicConditions.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">
                              +{patient.chronicConditions.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Medications Preview */}
                      <td className="py-3.5 px-3">
                        <div className="max-w-[200px]">
                          <p className="font-medium text-slate-800 truncate text-[11px]">
                            {patient.medications[0]?.name || 'No med'}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {patient.medications.length} total • ₹
                            {patient.medications.reduce((sum, m) => sum + m.price, 0)}/cycle
                          </span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span
                            className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] w-fit ${
                              isOverdue
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isDueSoon
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {isOverdue ? `${Math.abs(diffDays)}d Overdue` : diffDays === 0 ? 'Due Today' : `In ${diffDays} days`}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {patient.nextRefillDueDate}
                          </span>
                        </div>
                      </td>

                      {/* Consent */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            patient.consent.status === 'opted_in'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : patient.consent.status === 'paused'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {patient.consent.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Reminder Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-medium capitalize px-2 py-0.5 rounded ${
                            patient.reminderStatus === 'refill_requested'
                              ? 'bg-teal-100 text-teal-800 font-bold'
                              : patient.reminderStatus === 'delivered'
                              ? 'bg-blue-50 text-blue-700'
                              : patient.reminderStatus === 'snoozed'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {patient.reminderStatus.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleSendReminder(patient.id, e)}
                            disabled={sendingId === patient.id || patient.consent.status !== 'opted_in'}
                            title="Send WhatsApp Reminder"
                            className="p-1.5 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors disabled:opacity-40"
                          >
                            <Send className={`w-3.5 h-3.5 ${sendingId === patient.id ? 'animate-spin' : ''}`} />
                          </button>

                          <button
                            onClick={() => onOpenSimulatorForPatient(patient.id)}
                            title="Open in WhatsApp Simulator"
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onSelectPatient(patient)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                            title="View Full Profile"
                          >
                            <ChevronRight className="w-4 h-4" />
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
  );
};
