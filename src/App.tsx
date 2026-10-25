import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { PatientManagement } from './components/PatientManagement';
import { EnrolPatientModal } from './components/EnrolPatientModal';
import { PatientDetailDrawer } from './components/PatientDetailDrawer';
import { RemindersSystem } from './components/RemindersSystem';
import { RefillRequestsPipeline } from './components/RefillRequestsPipeline';
import { RefillCalendar } from './components/RefillCalendar';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { PharmacySettingsView } from './components/PharmacySettingsView';
import { ComplianceAuditLogs } from './components/ComplianceAuditLogs';
import {
  Patient,
  PharmacySettings,
  RefillRequest,
  ReminderEvent,
  AuditLog,
  StaffUser,
  ConsentStatus,
} from './types';
import { api } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [stats, setStats] = useState<any>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [refillRequests, setRefillRequests] = useState<RefillRequest[]>([]);
  const [reminders, setReminders] = useState<ReminderEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<PharmacySettings | null>(null);
  const [activeStaff, setActiveStaff] = useState<StaffUser | null>(null);

  // Modals & Drawers
  const [isEnrolModalOpen, setIsEnrolModalOpen] = useState(false);
  const [selectedPatientForDrawer, setSelectedPatientForDrawer] = useState<Patient | null>(null);
  const [simulatorPatientId, setSimulatorPatientId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDispatchingBatch, setIsDispatchingBatch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const [statsData, patientsData, requestsData, remindersData, logsData, settingsData] =
        await Promise.all([
          api.getStats().catch(() => null),
          api.getPatients().catch(() => []),
          api.getRefillRequests().catch(() => []),
          api.getReminders().catch(() => []),
          api.getAuditLogs().catch(() => []),
          api.getSettings().catch(() => null),
        ]);

      if (statsData) setStats(statsData);
      if (patientsData) {
        setPatients(patientsData);
        if (!simulatorPatientId && patientsData.length > 0) {
          setSimulatorPatientId(patientsData[0].id);
        }
      }
      if (requestsData) setRefillRequests(requestsData);
      if (remindersData) setReminders(remindersData);
      if (logsData) setAuditLogs(logsData);
      if (settingsData) {
        setSettings(settingsData);
        if (!activeStaff && settingsData.staffUsers?.length > 0) {
          setActiveStaff(settingsData.staffUsers[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [simulatorPatientId, activeStaff]);

  useEffect(() => {
    loadData();
    // Poll every 12 seconds for fresh updates
    const interval = setInterval(() => {
      loadData();
    }, 12000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Keep drawer patient in sync with latest patient array
  useEffect(() => {
    if (selectedPatientForDrawer) {
      const refreshed = patients.find((p) => p.id === selectedPatientForDrawer.id);
      if (refreshed) setSelectedPatientForDrawer(refreshed);
    }
  }, [patients, selectedPatientForDrawer]);

  // Handlers
  const handleSavePatient = async (patientData: Partial<Patient>) => {
    await api.createPatient(patientData);
    await loadData();
  };

  const handleUpdateConsent = async (
    patientId: string,
    status: ConsentStatus,
    reason?: string
  ) => {
    await api.updateConsent(patientId, status, reason);
    await loadData();
  };

  const handleDispatchReminder = async (patientId: string) => {
    await api.dispatchReminder(patientId);
    await loadData();
  };

  const handleDeletePatient = async (patientId: string) => {
    await api.deletePatient(patientId);
    setSelectedPatientForDrawer(null);
    await loadData();
  };

  const handleRunBatchScheduler = async () => {
    try {
      setIsDispatchingBatch(true);
      const res = await api.runBatchScheduler();
      await loadData();
      alert(`Batch scheduler executed: ${res.triggeredCount} WhatsApp reminders dispatched, ${res.skippedCount} skipped.`);
    } catch (err: any) {
      alert(err.message || 'Batch run failed');
    } finally {
      setIsDispatchingBatch(false);
    }
  };

  const handleUpdateRequestStatus = async (
    id: string,
    status: RefillRequest['status'],
    options?: { staffName?: string; invoiceNumber?: string; paymentStatus?: RefillRequest['paymentStatus'] }
  ) => {
    await api.updateRefillStatus(id, status, options);
    await loadData();
  };

  const handleUpdateSettings = async (newSettings: Partial<PharmacySettings>) => {
    const updated = await api.updateSettings(newSettings);
    setSettings(updated);
    await loadData();
  };

  const handleResetDemo = async () => {
    if (confirm('Reset database to realistic neighborhood chemist seed data?')) {
      await api.resetDemo();
      await loadData();
      alert('Database successfully reset to demo seed!');
    }
  };

  const handleOpenSimulatorForPatient = (patientId: string) => {
    setSimulatorPatientId(patientId);
    setCurrentTab('simulator');
    setSelectedPatientForDrawer(null);
  };

  const pendingRequestsCount = refillRequests.filter(
    (r) => r.status === 'new_request' || r.status === 'pharmacist_reviewing'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Header */}
      <Header
        settings={settings}
        activeStaff={activeStaff}
        onStaffChange={setActiveStaff}
        onOpenEnrolModal={() => setIsEnrolModalOpen(true)}
        onOpenSimulator={() => setCurrentTab('simulator')}
        onResetDemo={handleResetDemo}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim() && currentTab !== 'patients') {
            setCurrentTab('patients');
          }
        }}
        onSelectTab={setCurrentTab}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingRequestsCount={pendingRequestsCount}
          upcomingRefillsCount={stats?.upcomingRefills || 0}
          sandboxMode={settings?.sandboxMode ?? true}
          adherenceRate={stats?.adherenceRate || 92}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {isLoading && !stats ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
              <span className="w-4 h-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mr-2"></span>
              <span>Loading ApnaChemist CRM...</span>
            </div>
          ) : (
            <>
              {currentTab === 'overview' && (
                <DashboardOverview
                  stats={stats}
                  patients={patients}
                  refillRequests={refillRequests}
                  reminders={reminders}
                  auditLogs={auditLogs}
                  onSelectTab={setCurrentTab}
                  onOpenEnrolModal={() => setIsEnrolModalOpen(true)}
                  onRunBatchScheduler={handleRunBatchScheduler}
                  onSelectPatient={setSelectedPatientForDrawer}
                  isDispatchingBatch={isDispatchingBatch}
                />
              )}

              {currentTab === 'patients' && (
                <PatientManagement
                  patients={patients}
                  onSelectPatient={setSelectedPatientForDrawer}
                  onOpenEnrolModal={() => setIsEnrolModalOpen(true)}
                  onDispatchReminder={handleDispatchReminder}
                  onOpenSimulatorForPatient={handleOpenSimulatorForPatient}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              )}

              {currentTab === 'reminders' && (
                <RemindersSystem
                  reminders={reminders}
                  patients={patients}
                  settings={settings}
                  onRunBatchScheduler={handleRunBatchScheduler}
                  onDispatchReminder={handleDispatchReminder}
                  onUpdateSettings={handleUpdateSettings}
                  isDispatchingBatch={isDispatchingBatch}
                  onOpenSimulatorForPatient={handleOpenSimulatorForPatient}
                />
              )}

              {currentTab === 'requests' && (
                <RefillRequestsPipeline
                  refillRequests={refillRequests}
                  onUpdateStatus={handleUpdateRequestStatus}
                  onOpenSimulatorForPatient={handleOpenSimulatorForPatient}
                  staffName={activeStaff?.name}
                />
              )}

              {currentTab === 'calendar' && (
                <RefillCalendar
                  patients={patients}
                  onSelectPatient={setSelectedPatientForDrawer}
                  onDispatchReminder={handleDispatchReminder}
                  onOpenSimulatorForPatient={handleOpenSimulatorForPatient}
                />
              )}

              {currentTab === 'simulator' && (
                <WhatsAppSimulator
                  patients={patients}
                  selectedPatientId={simulatorPatientId}
                  onSelectPatientId={setSimulatorPatientId}
                  settings={settings}
                  onRefreshData={loadData}
                />
              )}

              {currentTab === 'settings' && (
                <PharmacySettingsView
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onResetDemo={handleResetDemo}
                />
              )}

              {currentTab === 'audit' && (
                <ComplianceAuditLogs logs={auditLogs} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Enrol Patient Modal */}
      <EnrolPatientModal
        isOpen={isEnrolModalOpen}
        onClose={() => setIsEnrolModalOpen(false)}
        onSave={handleSavePatient}
      />

      {/* Patient Detail Drawer */}
      <PatientDetailDrawer
        patient={selectedPatientForDrawer}
        onClose={() => setSelectedPatientForDrawer(null)}
        onUpdateConsent={handleUpdateConsent}
        onDispatchReminder={handleDispatchReminder}
        onDeletePatient={handleDeletePatient}
        onOpenSimulatorForPatient={handleOpenSimulatorForPatient}
        reminders={reminders}
      />
    </div>
  );
}
