import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Pill,
  Send,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Patient } from '../types';

interface RefillCalendarProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onDispatchReminder: (patientId: string) => Promise<void>;
  onOpenSimulatorForPatient: (patientId: string) => void;
}

export const RefillCalendar: React.FC<RefillCalendarProps> = ({
  patients,
  onSelectPatient,
  onDispatchReminder,
  onOpenSimulatorForPatient,
}) => {
  // Center around October 2026 based on metadata
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 is October
  const [selectedDateStr, setSelectedDateStr] = useState('2026-10-25');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Map of date string YYYY-MM-DD -> patients due
  const dueMap: Record<string, Patient[]> = {};
  for (const p of patients) {
    if (!dueMap[p.nextRefillDueDate]) {
      dueMap[p.nextRefillDueDate] = [];
    }
    dueMap[p.nextRefillDueDate].push(p);
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectedPatients = dueMap[selectedDateStr] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Upcoming Refill Calendar
          </h1>
          <p className="text-xs text-slate-500">
            Forecast patient refill run-out dates and plan batch medication inventory and delivery slots
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 min-w-[120px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty offset days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 bg-slate-50/40 rounded-lg"></div>
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDateStr === dateStr;
              const isToday = dateStr === '2026-10-25';
              const patientsForDay = dueMap[dateStr] || [];

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-20 p-1.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20'
                      : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : isSelected
                          ? 'text-teal-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {patientsForDay.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        {patientsForDay.length} due
                      </span>
                    )}
                  </div>

                  {patientsForDay.length > 0 && (
                    <div className="space-y-0.5 overflow-hidden">
                      {patientsForDay.slice(0, 2).map((p) => (
                        <div
                          key={p.id}
                          className="text-[9px] font-medium text-slate-700 truncate bg-slate-100/80 px-1 py-0.5 rounded"
                        >
                          {p.name.split(' ')[0]}
                        </div>
                      ))}
                      {patientsForDay.length > 2 && (
                        <div className="text-[9px] text-teal-700 font-semibold pl-1">
                          +{patientsForDay.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Detail Panel (1 Col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Refill Schedule
              </span>
              <h2 className="text-sm font-bold text-slate-900 mt-0.5">
                {new Date(selectedDateStr).toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </h2>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              {selectedPatients.length} Refill{selectedPatients.length !== 1 ? 's' : ''} Due
            </span>
          </div>

          {selectedPatients.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No refills due on this date</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Select a date with scheduled refills</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {selectedPatients.map((patient) => {
                const totalCost = patient.medications.reduce((sum, m) => sum + m.price, 0);
                return (
                  <div
                    key={patient.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <button
                          onClick={() => onSelectPatient(patient)}
                          className="font-bold text-slate-900 hover:text-teal-600 text-xs text-left"
                        >
                          {patient.name}
                        </button>
                        <p className="text-[10px] text-slate-400 font-mono">{patient.phone}</p>
                      </div>
                      <span className="text-xs font-bold text-teal-700">₹{totalCost}</span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      {patient.medications.map((m) => (
                        <div key={m.id} className="truncate">
                          • {m.name} ({m.dosage})
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 capitalize">
                        {patient.deliveryPreference.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenSimulatorForPatient(patient.id)}
                          className="px-2 py-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100"
                        >
                          Simulator
                        </button>
                        <button
                          onClick={() => onDispatchReminder(patient.id)}
                          className="px-2.5 py-1 text-[10px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-2xs"
                        >
                          Send WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
