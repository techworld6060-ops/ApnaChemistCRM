import React, { useState } from 'react';
import {
  Building2,
  Clock,
  Key,
  ShieldCheck,
  Users,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react';
import { PharmacySettings, StaffUser } from '../types';

interface PharmacySettingsViewProps {
  settings: PharmacySettings | null;
  onUpdateSettings: (settings: Partial<PharmacySettings>) => Promise<void>;
  onResetDemo: () => Promise<void>;
}

export const PharmacySettingsView: React.FC<PharmacySettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetDemo,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'whatsapp' | 'staff' | 'privacy'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Pharmacy Profile State
  const [name, setName] = useState(settings?.name || '');
  const [tagline, setTagline] = useState(settings?.tagline || '');
  const [dlNumber, setDlNumber] = useState(settings?.dlNumber || '');
  const [gstin, setGstin] = useState(settings?.gstin || '');
  const [phone, setPhone] = useState(settings?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(settings?.whatsappBusinessNumber || '');
  const [email, setEmail] = useState(settings?.email || '');
  const [address, setAddress] = useState(settings?.address || '');
  const [city, setCity] = useState(settings?.city || 'Mumbai');
  const [pincode, setPincode] = useState(settings?.pincode || '400058');
  const [upiId, setUpiId] = useState(settings?.upiId || 'apnachemist@okhdfcbank');
  const [openTime, setOpenTime] = useState(settings?.businessHours.open || '08:30');
  const [closeTime, setCloseTime] = useState(settings?.businessHours.close || '22:30');

  // WhatsApp Meta Cloud API
  const [sandboxMode, setSandboxMode] = useState(settings?.sandboxMode ?? true);
  const [phoneNumberId, setPhoneNumberId] = useState(settings?.metaCloudApi.phoneNumberId || '');
  const [wabaId, setWabaId] = useState(settings?.metaCloudApi.wabaId || '');
  const [accessToken, setAccessToken] = useState(settings?.metaCloudApi.accessToken || '');
  const [webhookVerifyToken, setWebhookVerifyToken] = useState(
    settings?.metaCloudApi.webhookVerifyToken || 'apna_chemist_webhook_secret_2026'
  );

  // Staff
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(settings?.staffUsers || []);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffUser['role']>('Registered Pharmacist');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffReg, setNewStaffReg] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onUpdateSettings({
        name,
        tagline,
        dlNumber,
        gstin,
        phone,
        whatsappBusinessNumber: whatsappNumber,
        email,
        address,
        city,
        pincode,
        upiId,
        businessHours: { open: openTime, close: closeTime },
      });
      setFeedback('Pharmacy profile saved successfully!');
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onUpdateSettings({
        sandboxMode,
        metaCloudApi: {
          enabled: !sandboxMode && Boolean(phoneNumberId && accessToken),
          phoneNumberId,
          wabaId,
          accessToken,
          webhookVerifyToken,
          apiVersion: 'v21.0',
        },
      });
      setFeedback('Meta Cloud API configurations updated successfully!');
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaffName.trim()) return;
    const newStaff: StaffUser = {
      id: `staff-${Date.now().toString(36)}`,
      name: newStaffName.trim(),
      email: `${newStaffName.toLowerCase().replace(/\s+/g, '.')}@apnachemist.com`,
      role: newStaffRole,
      phone: newStaffPhone || '+91 98200 00000',
      regNumber: newStaffReg || 'PCI-MH-XXXXX',
      active: true,
    };
    const updated = [...staffUsers, newStaff];
    setStaffUsers(updated);
    await onUpdateSettings({ staffUsers: updated });
    setNewStaffName('');
    setNewStaffPhone('');
    setNewStaffReg('');
  };

  const handleExportData = () => {
    window.open('/api/export', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Pharmacy Settings & Production Integrations
        </h1>
        <p className="text-xs text-slate-500">
          Configure pharmacy drug license credentials, Meta WhatsApp Business Cloud API, and staff permissions
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Pharmacy Profile & DL</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'whatsapp'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Meta WhatsApp Cloud API</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staff Accounts & RBAC</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'privacy'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>DPDP Privacy & Data Control</span>
        </button>
      </div>

      {/* Tab: Pharmacy Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 max-w-2xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Retail Pharmacy Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Pharmacy Trade Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Drug License Numbers (DL 20B/21B) *</label>
              <input
                type="text"
                value={dlNumber}
                onChange={(e) => setDlNumber(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Official Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">WhatsApp Business Number</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Store Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">UPI ID for Patient Payments</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. apnachemist@okhdfcbank"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Opens At</label>
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Closes At</label>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs shadow-2xs"
            >
              {isSaving ? 'Saving...' : 'Save Pharmacy Profile'}
            </button>
          </div>
        </form>
      )}

      {/* Tab: WhatsApp Meta Cloud API */}
      {activeTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSaveWhatsApp} className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Meta WhatsApp Cloud API Credentials</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sandboxMode ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {sandboxMode ? 'Sandbox Simulator Mode' : 'Production Cloud API'}
              </span>
            </div>

            {/* Sandbox Mode Toggle */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sandboxMode}
                  onChange={(e) => setSandboxMode(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span className="font-bold text-slate-800">
                  Enable Sandbox / Interactive Simulator Mode
                </span>
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                When enabled, all WhatsApp reminders, delivery receipts, and patient button clicks run safely in the integrated mobile device simulator without sending real SMS/WhatsApp messages or incurring Meta message fees.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  WhatsApp Phone Number ID (From Meta Developers)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 104928192837482"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  WhatsApp Business Account (WABA) ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 109283746192837"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Permanent System User Access Token
                </label>
                <input
                  type="password"
                  placeholder="EAAG... (Never exposed to client)"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Webhook Verify Token (Secret for Meta verification handshake)
                </label>
                <input
                  type="text"
                  value={webhookVerifyToken}
                  onChange={(e) => setWebhookVerifyToken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs shadow-2xs"
              >
                {isSaving ? 'Saving...' : 'Save Meta API Config'}
              </button>
            </div>
          </form>

          {/* Setup Checklist Guide */}
          <div className="bg-slate-900 rounded-xl p-5 text-white shadow-md text-xs space-y-4 border border-slate-800">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <span>Production Setup Checklist</span>
            </h4>

            <div className="space-y-3 text-slate-300 text-[11px] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-white">Create Meta Developer App:</strong> Register a business app under Meta Business Suite with the WhatsApp product added.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-white">Verify Phone Number:</strong> Add your retail pharmacy telephone number to send from your verified store brand.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-white">Submit Template:</strong> Submit the pre-approved template <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-400 font-mono">refill_reminder_v2</code> for category UTILITY.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-900 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-white">Configure Webhook URL:</strong> Point Meta Webhook to <code className="bg-slate-800 px-1 py-0.5 rounded text-teal-300 font-mono">/api/whatsapp/webhook</code> with your verify token.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Staff Accounts */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 max-w-3xl space-y-5 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pharmacy Staff & Roles</h3>
              <p className="text-slate-500 text-[11px]">
                Enforce role-based access control for dispensing medications and logging transactions
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {staffUsers.map((staff) => (
              <div key={staff.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <p className="font-bold text-slate-900">{staff.name}</p>
                  <p className="text-[11px] text-slate-500">{staff.email} • {staff.phone}</p>
                  {staff.regNumber && (
                    <span className="text-[10px] text-slate-400 font-mono">Council Reg: {staff.regNumber}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    {staff.role}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Staff */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800">Add Authorized Pharmacy Staff</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Staff Full Name"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs"
              />
              <select
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value as any)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs"
              >
                <option value="Chief Pharmacist">Chief Pharmacist</option>
                <option value="Registered Pharmacist">Registered Pharmacist</option>
                <option value="Dispensing Assistant">Dispensing Assistant</option>
                <option value="Store Manager">Store Manager</option>
              </select>
              <input
                type="text"
                placeholder="Pharmacy Council Reg #"
                value={newStaffReg}
                onChange={(e) => setNewStaffReg(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleAddStaff}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded text-xs"
            >
              + Add Staff Member
            </button>
          </div>
        </div>
      )}

      {/* Tab: DPDP Privacy & Data Control */}
      {activeTab === 'privacy' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 max-w-2xl space-y-6 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Indian DPDP Act & Privacy Governance
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Strict compliance controls for patient consent, data minimization, right to erasure, and auditability
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-900">Data Minimization Principle</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                ApnaChemist CRM strictly collects only operational data required for chronic medication dispensing (patient name, WhatsApp number, prescribed medications, days supply, and consent records). No diagnostic advice or speculative clinical inferences are stored.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-800">Export All Data (JSON / CSV)</p>
                <p className="text-[11px] text-slate-500">
                  Generate a complete encrypted archive of patient registers, refill orders, and audit logs.
                </p>
              </div>
              <button
                onClick={handleExportData}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg shadow-2xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>Download Archive</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-800">Reset Demo Database</p>
                <p className="text-[11px] text-slate-500">
                  Reset the database back to realistic neighborhood chemist seed data with active orders.
                </p>
              </div>
              <button
                onClick={onResetDemo}
                className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold rounded-lg shadow-2xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset Demo Seed</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
