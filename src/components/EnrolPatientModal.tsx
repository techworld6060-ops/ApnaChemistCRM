import React, { useState } from 'react';
import { X, Plus, Trash2, Pill, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { Patient, Medication, ConsentSource, DeliveryPreference } from '../types';

interface EnrolPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Partial<Patient>) => Promise<void>;
}

const COMMON_CONDITIONS = [
  'Type 2 Diabetes',
  'Hypertension',
  'Hypothyroidism',
  'Dyslipidemia',
  'Cardiac Care',
  'Asthma / COPD',
  'Arthritis',
  'GERD',
];

export const EnrolPatientModal: React.FC<EnrolPatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [age, setAge] = useState<number | ''>(52);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [pincode, setPincode] = useState('400058');
  const [deliveryPreference, setDeliveryPreference] = useState<DeliveryPreference>('home_delivery');
  const [doctorName, setDoctorName] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>(['Type 2 Diabetes']);
  const [refillCycleDays, setRefillCycleDays] = useState(30);
  const [lastRefillDate, setLastRefillDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  // Consent
  const [consentAgreed, setConsentAgreed] = useState(true);
  const [consentSource, setConsentSource] = useState<ConsentSource>('in_store_form');
  const [consentNotes, setConsentNotes] = useState('Physical consent form signed at counter.');

  // Medications
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: 'med-new-1',
      name: 'Glycomet GP 1/850 Tablet',
      dosage: '1mg Glimepiride + 850mg Metformin',
      form: 'tablet',
      dailyDose: 2,
      quantityPerRefill: 60,
      unit: 'strips',
      daysSupply: 30,
      price: 340,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      {
        id: `med-${Date.now()}`,
        name: '',
        dosage: '',
        form: 'tablet',
        dailyDose: 1,
        quantityPerRefill: 30,
        unit: 'strips',
        daysSupply: 30,
        price: 150,
      },
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: keyof Medication, val: any) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: val };
    setMedications(updated);
  };

  const toggleCondition = (cond: string) => {
    if (selectedConditions.includes(cond)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== cond));
    } else {
      setSelectedConditions([...selectedConditions, cond]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Patient full name is required');
      return;
    }
    if (!phone.trim() || phone.trim() === '+91') {
      setErrorMsg('Valid phone number is required for WhatsApp reminders');
      return;
    }
    if (medications.length === 0 || !medications[0].name.trim()) {
      setErrorMsg('At least one prescribed chronic medication is required');
      return;
    }

    try {
      setIsSubmitting(true);
      // Calculate next due date
      const lastDate = new Date(lastRefillDate);
      lastDate.setDate(lastDate.getDate() + Number(refillCycleDays));
      const nextDueDate = lastDate.toISOString().split('T')[0];

      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        age: Number(age) || 45,
        gender,
        address: address.trim(),
        locality: locality.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        deliveryPreference,
        doctorName: doctorName.trim(),
        chronicConditions: selectedConditions,
        medications: medications.filter((m) => m.name.trim() !== ''),
        refillCycleDays: Number(refillCycleDays),
        lastRefillDate,
        nextRefillDueDate: nextDueDate,
        consent: {
          status: consentAgreed ? 'opted_in' : 'opted_out',
          timestamp: new Date().toISOString(),
          source: consentSource,
          notes: consentNotes,
        },
        notes: notes.trim(),
        active: true,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to enrol patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Enrol Chronic Care Patient</h2>
              <p className="text-xs text-slate-500">Record regimen and obtain WhatsApp refill reminder consent</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Demographic Info */}
          <div>
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
              1. Patient Demographics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">WhatsApp Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98201 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Delivery Preference</label>
                <select
                  value={deliveryPreference}
                  onChange={(e) => setDeliveryPreference(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="home_delivery">Home Delivery</option>
                  <option value="store_pickup">Store Pickup</option>
                  <option value="either">Either</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Delivery Address & Locality</label>
                <input
                  type="text"
                  placeholder="Flat/House No., Building Name, Street / Locality"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Prescribing Doctor (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Agrawal"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Chronic Conditions */}
          <div>
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
              2. Chronic Therapy Areas
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_CONDITIONS.map((cond) => {
                const isSelected = selectedConditions.includes(cond);
                return (
                  <button
                    type="button"
                    key={cond}
                    onClick={() => toggleCondition(cond)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cond} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prescribed Medications */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                3. Medication Regimen & Supply
              </h3>
              <button
                type="button"
                onClick={handleAddMedication}
                className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medication</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {medications.map((med, idx) => (
                <div
                  key={med.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 relative group"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-500 font-medium">Medicine Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Telma 40mg Tablet"
                        value={med.name}
                        onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-500 font-medium">Dosage / Formulation</label>
                      <input
                        type="text"
                        placeholder="e.g. 40mg Telmisartan"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium">Daily Dose</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.5"
                        value={med.dailyDose}
                        onChange={(e) => handleMedChange(idx, 'dailyDose', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium">Qty per Refill</label>
                      <input
                        type="number"
                        min="1"
                        value={med.quantityPerRefill}
                        onChange={(e) => handleMedChange(idx, 'quantityPerRefill', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium">Days Supply</label>
                      <input
                        type="number"
                        min="1"
                        value={med.daysSupply}
                        onChange={(e) => handleMedChange(idx, 'daysSupply', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                      />
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-500 font-medium">Est. Price (₹)</label>
                        <input
                          type="number"
                          value={med.price}
                          onChange={(e) => handleMedChange(idx, 'price', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                        />
                      </div>
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Settings */}
          <div>
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
              4. Refill Schedule
            </h3>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Refill Cycle (Days)</label>
                <select
                  value={refillCycleDays}
                  onChange={(e) => setRefillCycleDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                >
                  <option value={15}>Every 15 Days</option>
                  <option value={28}>Every 28 Days (4 Weeks)</option>
                  <option value={30}>Every 30 Days (Standard Month)</option>
                  <option value={60}>Every 60 Days (2 Months)</option>
                  <option value={90}>Every 90 Days (Quarterly)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Last Refill Date</label>
                <input
                  type="date"
                  value={lastRefillDate}
                  onChange={(e) => setLastRefillDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* DPDP Consent Section */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900 text-xs">
                  DPDP & WhatsApp Business Consent
                </h4>
                <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                  Under the Indian Digital Personal Data Protection (DPDP) Act and Meta WhatsApp Business Policy, customers must explicitly opt-in to receive refill reminders.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={consentAgreed}
                onChange={(e) => setConsentAgreed(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded mt-0.5 border-slate-300 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-800 font-medium">
                Patient has provided informed, explicit consent to receive prescription refill notifications and care updates on WhatsApp.
              </span>
            </label>

            {consentAgreed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] text-emerald-800 font-semibold mb-1">
                    Consent Source
                  </label>
                  <select
                    value={consentSource}
                    onChange={(e) => setConsentSource(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-md text-xs text-slate-800"
                  >
                    <option value="in_store_form">In-Store Physical Signed Slip</option>
                    <option value="qr_counter">Counter QR Code Scan (e-Opt-in)</option>
                    <option value="verbal_consent">Verbal Counter Confirmation with OTP</option>
                    <option value="whatsapp_join">Incoming WhatsApp "JOIN" Message</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-emerald-800 font-semibold mb-1">
                    Compliance Audit Note
                  </label>
                  <input
                    type="text"
                    value={consentNotes}
                    onChange={(e) => setConsentNotes(e.target.value)}
                    placeholder="e.g. Signed physical form at Counter 1"
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-md text-xs text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Enrolling Patient...' : 'Enrol & Schedule Reminders'}
          </button>
        </div>
      </div>
    </div>
  );
};
