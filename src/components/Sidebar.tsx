import React from 'react';
import {
  LayoutDashboard,
  Users,
  BellRing,
  PackageCheck,
  CalendarDays,
  Smartphone,
  Settings,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingRequestsCount: number;
  upcomingRefillsCount: number;
  sandboxMode: boolean;
  adherenceRate: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingRequestsCount,
  upcomingRefillsCount,
  sandboxMode,
  adherenceRate,
}) => {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: Users,
      badge: null,
    },
    {
      id: 'reminders',
      label: 'Refill Reminders',
      icon: BellRing,
      badge: upcomingRefillsCount > 0 ? `${upcomingRefillsCount} due` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'requests',
      label: 'Refill Orders',
      icon: PackageCheck,
      badge: pendingRequestsCount > 0 ? `${pendingRequestsCount}` : null,
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200 animate-pulse',
    },
    {
      id: 'calendar',
      label: 'Refill Calendar',
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'simulator',
      label: 'WhatsApp Simulator',
      icon: Smartphone,
      badge: 'Zero-App',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: 'settings',
      label: 'Settings & Meta API',
      icon: Settings,
      badge: null,
    },
    {
      id: 'audit',
      label: 'Compliance & Logs',
      icon: ShieldCheck,
      badge: 'DPDP',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Nav List */}
      <div className="p-3 space-y-1 flex-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-teal-600 stroke-[2.2]' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pharmacy Adherence Widget */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 m-3 rounded-xl border">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-700">Patient Adherence</span>
          <span className="font-bold text-teal-700">{adherenceRate}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-2">
          <div
            className="bg-teal-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${adherenceRate}%` }}
          ></div>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Patients receiving timely chronic refills within prescribed window.
        </p>

        {sandboxMode && (
          <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-amber-700">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span className="font-medium">Sandbox Mode Active</span>
          </div>
        )}
      </div>
    </aside>
  );
};
