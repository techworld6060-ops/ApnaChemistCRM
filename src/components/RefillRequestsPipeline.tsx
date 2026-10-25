import React, { useState } from 'react';
import {
  PackageCheck,
  CheckCircle2,
  Clock,
  Truck,
  ShoppingBag,
  CreditCard,
  FileText,
  User,
  Phone,
  MapPin,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RefillRequest } from '../types';

interface RefillRequestsPipelineProps {
  refillRequests: RefillRequest[];
  onUpdateStatus: (
    id: string,
    status: RefillRequest['status'],
    options?: { staffName?: string; invoiceNumber?: string; paymentStatus?: RefillRequest['paymentStatus'] }
  ) => Promise<void>;
  onOpenSimulatorForPatient: (patientId: string) => void;
  staffName?: string;
}

export const RefillRequestsPipeline: React.FC<RefillRequestsPipelineProps> = ({
  refillRequests,
  onUpdateStatus,
  onOpenSimulatorForPatient,
  staffName = 'Ramesh Shastri, B.Pharm',
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'new_request' | 'in_progress' | 'dispensed_completed'>('all');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [invoiceInput, setInvoiceInput] = useState('');
  const [paymentMode, setPaymentMode] = useState<RefillRequest['paymentStatus']>('upi_collected');

  const filtered = refillRequests.filter((req) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'new_request') return req.status === 'new_request';
    if (activeFilter === 'in_progress') {
      return (
        req.status === 'pharmacist_reviewing' ||
        req.status === 'packed_ready' ||
        req.status === 'out_for_delivery'
      );
    }
    if (activeFilter === 'dispensed_completed') return req.status === 'dispensed_completed';
    return true;
  });

  const handleStartReview = async (id: string) => {
    await onUpdateStatus(id, 'pharmacist_reviewing', { staffName });
  };

  const handleMarkPacked = async (id: string) => {
    await onUpdateStatus(id, 'packed_ready', { staffName });
  };

  const handleMarkOutForDelivery = async (id: string) => {
    await onUpdateStatus(id, 'out_for_delivery', { staffName });
  };

  const handleOpenCompleteModal = (req: RefillRequest) => {
    setCompletingId(req.id);
    const randomInv = `INV-AC-${Math.floor(8000 + Math.random() * 2000)}`;
    setInvoiceInput(req.billInvoiceNumber || randomInv);
    setPaymentMode(req.paymentStatus || 'upi_collected');
  };

  const handleConfirmComplete = async () => {
    if (!completingId) return;
    await onUpdateStatus(completingId, 'dispensed_completed', {
      staffName,
      invoiceNumber: invoiceInput,
      paymentStatus: paymentMode,
    });
    setCompletingId(null);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore if confetti throws
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Refill Orders & Dispensing Pipeline
          </h1>
          <p className="text-xs text-slate-500">
            Real-time orders received from WhatsApp zero-app reorder buttons and instant checkout
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Orders ({refillRequests.length})
          </button>
          <button
            onClick={() => setActiveFilter('new_request')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === 'new_request'
                ? 'bg-white text-teal-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New ({refillRequests.filter((r) => r.status === 'new_request').length})
          </button>
          <button
            onClick={() => setActiveFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === 'in_progress'
                ? 'bg-white text-amber-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In Prep ({refillRequests.filter((r) => r.status === 'pharmacist_reviewing' || r.status === 'packed_ready' || r.status === 'out_for_delivery').length})
          </button>
          <button
            onClick={() => setActiveFilter('dispensed_completed')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === 'dispensed_completed'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dispensed ({refillRequests.filter((r) => r.status === 'dispensed_completed').length})
          </button>
        </div>
      </div>

      {/* Orders Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            <PackageCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No refill requests in this view</p>
            <p className="text-xs text-slate-400 mt-1">
              When a patient clicks "Request Refill" on WhatsApp, orders appear here instantly.
            </p>
          </div>
        ) : (
          filtered.map((req) => {
            const isCompleted = req.status === 'dispensed_completed';
            return (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {req.requestId}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        req.status === 'new_request'
                          ? 'bg-teal-100 text-teal-800 animate-pulse'
                          : req.status === 'pharmacist_reviewing'
                          ? 'bg-blue-100 text-blue-800'
                          : req.status === 'packed_ready'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'out_for_delivery'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {req.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Patient Info */}
                  <div className="mt-3">
                    <h3 className="font-bold text-slate-900 text-sm">{req.patientName}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{req.patientPhone}</p>
                    <div className="mt-2 text-[11px] text-slate-600 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{req.patientAddress}</span>
                    </div>
                  </div>

                  {/* Medicines List */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Prescription Package
                    </span>
                    {req.medications.map((m, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="font-medium text-slate-800">
                          {m.name} × {m.quantity}
                        </span>
                        <span className="text-slate-600 font-mono">₹{m.price}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-200/80 flex justify-between text-xs font-bold text-slate-900">
                      <span>Total Invoice</span>
                      <span className="text-teal-700">₹{req.totalEstimatedCost}</span>
                    </div>
                  </div>

                  {/* Fulfillment details */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="capitalize font-medium text-slate-700">
                      {req.fulfillmentType === 'home_delivery' ? '🛵 Home Delivery' : '🏪 Counter Pickup'}
                    </span>
                    {req.preferredTimeSlot && (
                      <span className="text-slate-600">{req.preferredTimeSlot}</span>
                    )}
                  </div>

                  {req.patientNotes && (
                    <div className="mt-2 p-2 bg-amber-50/70 rounded text-[11px] text-amber-800 border border-amber-200/60">
                      <strong>Customer note:</strong> {req.patientNotes}
                    </div>
                  )}

                  {req.billInvoiceNumber && (
                    <div className="mt-2 text-[11px] text-slate-500 font-mono">
                      Invoice: <strong className="text-slate-800">{req.billInvoiceNumber}</strong> • By {req.dispensedByStaff}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  {req.status === 'new_request' && (
                    <button
                      onClick={() => handleStartReview(req.id)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                    >
                      Verify Stock & Review
                    </button>
                  )}

                  {req.status === 'pharmacist_reviewing' && (
                    <button
                      onClick={() => handleMarkPacked(req.id)}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                    >
                      Pack & Label Medicines
                    </button>
                  )}

                  {req.status === 'packed_ready' && (
                    <div className="flex gap-2">
                      {req.fulfillmentType === 'home_delivery' && (
                        <button
                          onClick={() => handleMarkOutForDelivery(req.id)}
                          className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Send for Delivery
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenCompleteModal(req)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                      >
                        Complete & Dispense
                      </button>
                    </div>
                  )}

                  {req.status === 'out_for_delivery' && (
                    <button
                      onClick={() => handleOpenCompleteModal(req)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                    >
                      Delivered & Payment Collected
                    </button>
                  )}

                  {isCompleted && (
                    <div className="text-center py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Dispensed • Adherence Cycle Updated</span>
                    </div>
                  )}

                  <button
                    onClick={() => onOpenSimulatorForPatient(req.patientId)}
                    className="w-full py-1 text-slate-500 hover:text-emerald-700 text-[11px] font-semibold text-center flex items-center justify-center gap-1"
                  >
                    <span>View Patient WhatsApp Thread</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Complete & Invoice Modal */}
      {completingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-sm">Dispense Refill & Generate Invoice</h3>
            </div>
            <p className="text-slate-500 text-[11px]">
              Finalize the transaction. This will log the dispensing pharmacist and advance the patient's next refill due date.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice / Bill Number</label>
              <input
                type="text"
                value={invoiceInput}
                onChange={(e) => setInvoiceInput(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
              >
                <option value="upi_collected">UPI Digital Payment (GPay / PhonePe / Paytm)</option>
                <option value="paid_counter">Cash Paid at Counter</option>
                <option value="cod_home_delivery">Cash on Delivery (Home Delivery)</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dispensing Pharmacist</label>
              <input
                type="text"
                disabled
                value={staffName}
                className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompletingId(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-2xs"
              >
                Confirm Dispensing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
