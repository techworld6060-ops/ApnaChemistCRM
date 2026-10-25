import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Send,
  Check,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  ShieldCheck,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Globe,
  Pill,
} from 'lucide-react';
import { Patient, PharmacySettings, WhatsAppChatMessage } from '../types';
import { api } from '../services/api';

interface WhatsAppSimulatorProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatientId: (id: string) => void;
  settings: PharmacySettings | null;
  onRefreshData: () => void;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  patients,
  selectedPatientId,
  onSelectPatientId,
  settings,
  onRefreshData,
}) => {
  const [messages, setMessages] = useState<WhatsAppChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSimulatingAction, setIsSimulatingAction] = useState(false);
  const [viewMode, setViewMode] = useState<'whatsapp' | 'web_portal'>('whatsapp');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const currentPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const fetchChat = async (patientId: string) => {
    try {
      setIsLoadingChat(true);
      const chat = await api.getChat(patientId);
      setMessages(chat);
    } catch (err) {
      console.error('Failed to load chat:', err);
    } finally {
      setIsLoadingChat(false);
    }
  };

  useEffect(() => {
    if (currentPatient) {
      fetchChat(currentPatient.id);
    }
  }, [currentPatient?.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleButtonClick = async (payload: string, buttonTitle: string) => {
    if (!currentPatient) return;
    try {
      setIsSimulatingAction(true);
      await api.simulateInbound(currentPatient.id, payload, buttonTitle);
      await fetchChat(currentPatient.id);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Simulation error');
    } finally {
      setIsSimulatingAction(false);
    }
  };

  const handleSendCustomText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentPatient) return;

    const textToSend = inputText.trim();
    setInputText('');
    try {
      setIsSimulatingAction(true);
      await api.simulateInbound(currentPatient.id, 'CUSTOM_TEXT', textToSend);
      await fetchChat(currentPatient.id);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Simulation error');
    } finally {
      setIsSimulatingAction(false);
    }
  };

  const handleSendReminderNow = async () => {
    if (!currentPatient) return;
    try {
      setIsSimulatingAction(true);
      await api.dispatchReminder(currentPatient.id);
      await fetchChat(currentPatient.id);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch reminder');
    } finally {
      setIsSimulatingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Simulator Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Zero-App Patient WhatsApp Simulator
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Interactive Demo Sandbox
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Experience what your chronic patients see on their smartphones. No app installation needed!
          </p>
        </div>

        {/* Patient Switcher & Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('whatsapp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'whatsapp'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>WhatsApp Chat</span>
            </button>
            <button
              onClick={() => setViewMode('web_portal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'web_portal'
                  ? 'bg-white text-teal-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Zero-App Web View</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
            <span className="text-slate-400 font-medium">Patient:</span>
            <select
              value={currentPatient?.id}
              onChange={(e) => onSelectPatientId(e.target.value)}
              className="font-bold text-slate-800 bg-transparent border-0 cursor-pointer focus:ring-0 p-0"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.phone})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Simulator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Device Frame (7 Cols) */}
        <div className="lg:col-span-7 flex justify-center">
          {viewMode === 'whatsapp' ? (
            /* Smartphone Shell */
            <div className="w-full max-w-[400px] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 relative">
              {/* Phone Speaker & Camera Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
                <div className="w-2.5 h-2.5 bg-slate-900 rounded-full ml-3 border border-slate-700"></div>
              </div>

              {/* Screen Container */}
              <div className="w-full h-[620px] bg-[#efeae2] rounded-[32px] overflow-hidden flex flex-col relative pt-7">
                {/* WhatsApp Top Bar */}
                <div className="bg-[#075e54] text-white px-3 py-2.5 flex items-center justify-between shadow-md shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 border border-white/20">
                      <Pill className="w-4 h-4 text-teal-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs truncate">
                          {settings?.name || 'ApnaChemist & Care'}
                        </span>
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 text-slate-900 flex items-center justify-center text-[9px] font-bold">
                          ✓
                        </span>
                      </div>
                      <p className="text-[10px] text-teal-100 truncate">
                        Official Business Account • Online
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-teal-100">
                    <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
                    <Video className="w-4 h-4 cursor-pointer hover:text-white" />
                    <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
                  </div>
                </div>

                {/* WhatsApp Chat Bubbles Area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
                  {/* End to End Encryption Notice */}
                  <div className="mx-auto max-w-[260px] bg-[#ffeecd] border border-[#f5d99f] rounded-lg p-2 text-center text-[10px] text-amber-900 shadow-2xs leading-tight">
                    🔒 Messages are end-to-end encrypted. ApnaChemist CRM complies with Indian DPDP Act standards.
                  </div>

                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No WhatsApp history yet. Click below to trigger a reminder!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOutbound = msg.direction === 'outbound';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isOutbound ? 'items-start' : 'items-end'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg p-2.5 shadow-2xs text-xs relative ${
                              isOutbound
                                ? 'bg-white text-slate-900 rounded-tl-none'
                                : 'bg-[#dcf8c6] text-slate-900 rounded-tr-none'
                            }`}
                          >
                            <p className="whitespace-pre-line leading-relaxed text-[11px]">
                              {msg.text}
                            </p>

                            {/* Interactive Quick Reply Buttons if template */}
                            {msg.buttons && (
                              <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
                                {msg.buttons.map((btn) => (
                                  <button
                                    key={btn.payload}
                                    onClick={() => handleButtonClick(btn.payload, btn.title)}
                                    disabled={isSimulatingAction}
                                    className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                                  >
                                    <span>{btn.title}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Timestamp & double ticks */}
                            <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                              <span>
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isOutbound ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                              ) : (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {isSimulatingAction && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-white/80 w-fit px-2.5 py-1 rounded-full shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
                      <span>Chemist is typing...</span>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* WhatsApp Chat Input Bar */}
                <form
                  onSubmit={handleSendCustomText}
                  className="bg-[#f0f2f5] p-2 flex items-center gap-1.5 border-t border-slate-200 shrink-0"
                >
                  <button
                    type="button"
                    className="p-1.5 text-slate-500 hover:text-slate-700"
                    title="Emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type a patient reply (e.g. Please add Crocin)..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 bg-white px-3 py-1.5 text-xs rounded-full border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  {inputText.trim() ? (
                    <button
                      type="submit"
                      disabled={isSimulatingAction}
                      className="w-8 h-8 rounded-full bg-[#075e54] text-white flex items-center justify-center shrink-0 hover:bg-[#064e46]"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="p-1.5 text-slate-500 hover:text-slate-700"
                      title="Voice Note"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )}
                </form>
              </div>
            </div>
          ) : (
            /* Zero-App Instant Web Page View */
            <div className="w-full max-w-[400px] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 relative">
              <div className="w-full h-[620px] bg-white rounded-[32px] overflow-hidden flex flex-col relative pt-7">
                {/* Browser URL Bar */}
                <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center gap-2 text-[10px] text-slate-600 font-mono">
                  <span className="text-emerald-600 font-bold">https://</span>
                  <span className="truncate">apnachemist.com/refill/{currentPatient?.uhid}</span>
                </div>

                {/* Instant Refill Web Form */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <div className="text-center pt-2">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl mx-auto flex items-center justify-center text-teal-700 mb-1.5 border border-teal-200">
                      <Pill className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {settings?.name || 'ApnaChemist & Care'}
                    </h3>
                    <p className="text-[11px] text-slate-500">1-Tap Prescription Refill</p>
                  </div>

                  <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
                    <p className="font-bold text-teal-900">
                      Namaste {currentPatient?.name}
                    </p>
                    <p className="text-[11px] text-teal-800">
                      Your recurring prescription is due on{' '}
                      <strong>{currentPatient?.nextRefillDueDate}</strong>.
                    </p>
                  </div>

                  {/* Medicines */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Medications to Refill
                    </span>
                    {currentPatient?.medications.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-[11px]">{m.name}</p>
                          <p className="text-[10px] text-slate-500">{m.dosage}</p>
                        </div>
                        <span className="font-bold text-slate-900 font-mono">₹{m.price}</span>
                      </div>
                    ))}
                  </div>

                  {/* Address */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                    <span className="text-slate-400 block text-[10px] font-medium">Delivery To:</span>
                    <span className="font-medium text-slate-800">
                      {currentPatient?.address || 'Counter Pickup'}
                    </span>
                  </div>

                  {/* Confirm One-Tap Refill Button */}
                  <button
                    onClick={() => handleButtonClick('ACTION_REQUEST_REFILL', '📦 Request Refill')}
                    disabled={isSimulatingAction}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    Confirm One-Tap Reorder (₹
                    {currentPatient?.medications.reduce((s, m) => s + m.price, 0)})
                  </button>

                  <p className="text-[10px] text-center text-slate-400 leading-tight">
                    Prescriptions verified by registered pharmacist. No login or app download required.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions, Patient Details & Testing Tools (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Patient Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">Active Patient Profile</span>
              <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-bold">
                {currentPatient?.uhid}
              </span>
            </div>

            <div className="space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Name:</span>
                <span className="font-bold text-slate-900">{currentPatient?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">WhatsApp Phone:</span>
                <span className="font-mono">{currentPatient?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Consent Status:</span>
                <span
                  className={`font-semibold px-2 py-0.2 rounded ${
                    currentPatient?.consent.status === 'opted_in'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {currentPatient?.consent.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Next Refill Due:</span>
                <span className="font-bold text-amber-700">{currentPatient?.nextRefillDueDate}</span>
              </div>
            </div>

            <button
              onClick={handleSendReminderNow}
              disabled={isSimulatingAction || currentPatient?.consent.status !== 'opted_in'}
              className="w-full mt-2 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Trigger Refill Reminder Now</span>
            </button>
          </div>

          {/* Quick Simulation Buttons */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Simulate Inbound Patient Actions
            </h3>
            <p className="text-[11px] text-slate-500">
              Test what happens in the backend CRM when the customer taps buttons in WhatsApp:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleButtonClick('ACTION_REQUEST_REFILL', '📦 Request Refill')}
                disabled={isSimulatingAction}
                className="w-full p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold rounded-lg text-left flex items-center justify-between transition-colors shadow-2xs disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📦</span>
                  <div>
                    <div className="text-xs">Tap "Request Refill"</div>
                    <div className="text-[10px] text-emerald-700 font-normal">
                      Instantly generates Refill Request #REF in dashboard
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                onClick={() => handleButtonClick('ACTION_REMIND_LATER', '⏰ Remind Me Later')}
                disabled={isSimulatingAction}
                className="w-full p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold rounded-lg text-left flex items-center justify-between transition-colors shadow-2xs disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">⏰</span>
                  <div>
                    <div className="text-xs">Tap "Remind Me Later"</div>
                    <div className="text-[10px] text-amber-700 font-normal">
                      Snoozes schedule and pushes due date by 48 hours
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-600" />
              </button>

              <button
                onClick={() => handleButtonClick('ACTION_STOP_REMINDERS', '🛑 Stop Reminders')}
                disabled={isSimulatingAction}
                className="w-full p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 font-bold rounded-lg text-left flex items-center justify-between transition-colors shadow-2xs disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🛑</span>
                  <div>
                    <div className="text-xs">Tap "Stop Reminders" (Opt-Out)</div>
                    <div className="text-[10px] text-rose-700 font-normal">
                      DPDP opt-out; blocks all future automated WhatsApp messages
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
