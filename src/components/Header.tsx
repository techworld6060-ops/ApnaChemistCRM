import React from 'react';
import {
  Pill,
  Search,
  Plus,
  Smartphone,
  RotateCcw,
  ShieldCheck,
  Clock,
  User,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { PharmacySettings, StaffUser } from '../types';

interface HeaderProps {
  settings: PharmacySettings | null;
  activeStaff: StaffUser | null;
  onStaffChange: (staff: StaffUser) => void;
  onOpenEnrolModal: () => void;
  onOpenSimulator: () => void;
  onResetDemo: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeStaff,
  onStaffChange,
  onOpenEnrolModal,
  onOpenSimulator,
  onResetDemo,
  searchQuery,
  onSearchChange,
  onSelectTab,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Store Status */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              onClick={() => onSelectTab('overview')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <Pill className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-lg tracking-tight">ApnaChemist</span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                    CRM
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                  <span className="truncate max-w-[200px]">{settings?.name || 'Local Chemist'}</span>
                  <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Counter Open
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient by name, phone, UHID, or medicine..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Actions & Staff Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* WhatsApp Simulator Button */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs"
              title="Launch Zero-App WhatsApp Simulator"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp Simulator</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </button>

            {/* Enrol Patient Button */}
            <button
              onClick={onOpenEnrolModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm shadow-teal-600/30 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Enrol Patient</span>
              <span className="sm:hidden">Enrol</span>
            </button>

            {/* Staff Selector */}
            {settings?.staffUsers && settings.staffUsers.length > 0 && (
              <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <select
                    value={activeStaff?.id || settings.staffUsers[0]?.id}
                    onChange={(e) => {
                      const selected = settings.staffUsers.find((s) => s.id === e.target.value);
                      if (selected) onStaffChange(selected);
                    }}
                    className="text-xs font-medium text-slate-800 bg-transparent border-0 cursor-pointer focus:ring-0 p-0 pr-4"
                  >
                    {settings.staffUsers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} ({staff.role.split(' ')[0]})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {activeStaff?.regNumber || 'Pharmacist on Duty'}
                  </p>
                </div>
              </div>
            )}

            {/* Reset Demo */}
            <button
              onClick={onResetDemo}
              title="Reset to fresh demo dataset"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
