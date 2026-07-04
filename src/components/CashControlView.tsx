import React, { useMemo } from 'react';
import { Booking, City, Provider, Carrier, RateMatrixEntry, HandoverStatus, CashHolder } from '../types';
import { ShieldAlert, CheckCircle, ArrowRightLeft, Users, AlertTriangle, Key } from 'lucide-react';

interface CashControlViewProps {
  bookings: Booking[];
  cities: City[];
  providers: Provider[];
  carriers: Carrier[];
  rateMatrix: RateMatrixEntry[];
  onUpdateBooking: (updated: Booking) => void;
}

export const CashControlView: React.FC<CashControlViewProps> = ({
  bookings,
  cities,
  providers,
  carriers,
  rateMatrix,
  onUpdateBooking
}) => {
  // Compute booking calculations helper
  const getBookingTransportPrice = (booking: Booking): number => {
    if (booking.transportCustomPrice !== null) {
      return booking.transportCustomPrice;
    }
    const city = cities.find(c => c.id === booking.cityId);
    const carrier = carriers.find(t => t.id === booking.carrierId);
    if (!city || !carrier) return 0;

    const hours = booking.transportDurationHours;
    let range: '0-4h' | '4-8h' | '8-12h' | '12-24h' = '0-4h';
    if (hours <= 4) range = '0-4h';
    else if (hours <= 8) range = '4-8h';
    else if (hours <= 12) range = '8-12h';
    else range = '12-24h';

    const matrixId = `${booking.carrierId}_${booking.cityId}_${range}`;
    const entry = rateMatrix.find(r => r.id === matrixId);
    return entry ? entry.price : 0;
  };

  // 1. Calculate holding balances
  const balances = useMemo(() => {
    let uncollectedUnpaid = 0; // customer has not paid
    let companyVerifiedCash = 0; // safe inside company admin
    
    // Dictionary of balances held by specific providers or carriers
    const providerBalances: { [id: string]: { name: string; amount: number; bookingsCount: number } } = {};
    const carrierBalances: { [id: string]: { name: string; amount: number; bookingsCount: number } } = {};

    providers.forEach(p => {
      providerBalances[p.id] = { name: p.name, amount: 0, bookingsCount: 0 };
    });
    carriers.forEach(c => {
      carrierBalances[c.id] = { name: c.name, amount: 0, bookingsCount: 0 };
    });

    bookings.forEach(b => {
      const transCost = getBookingTransportPrice(b);
      const totalRev = b.serviceBaseFee + b.extraServiceFees + transCost;

      if (b.customerPaymentStatus === 'Unpaid') {
        uncollectedUnpaid += totalRev;
      } else if (b.customerPaymentStatus === 'Paid (Bank Transfer)') {
        // Bank transfer is automatically company-received and verified
        companyVerifiedCash += totalRev;
      } else if (b.customerPaymentStatus === 'Paid (Cash)') {
        if (b.cashHolder === 'Company Admin' && b.cashHandoverStatus === 'Verified') {
          companyVerifiedCash += totalRev;
        } else if (b.cashHolder === 'Provider 1') {
          if (providerBalances[b.provider1Id]) {
            providerBalances[b.provider1Id].amount += totalRev;
            providerBalances[b.provider1Id].bookingsCount += 1;
          }
        } else if (b.cashHolder === 'Provider 2' && b.provider2Id) {
          if (providerBalances[b.provider2Id]) {
            providerBalances[b.provider2Id].amount += totalRev;
            providerBalances[b.provider2Id].bookingsCount += 1;
          }
        } else if (b.cashHolder === 'Carrier') {
          if (carrierBalances[b.carrierId]) {
            carrierBalances[b.carrierId].amount += totalRev;
            carrierBalances[b.carrierId].bookingsCount += 1;
          }
        }
      }
    });

    const activeProviderHandovers = Object.values(providerBalances).filter(pb => pb.amount > 0);
    const activeCarrierHandovers = Object.values(carrierBalances).filter(cb => cb.amount > 0);

    return {
      uncollectedUnpaid,
      companyVerifiedCash,
      activeProviderHandovers,
      activeCarrierHandovers,
      totalUnverifiedCash: activeProviderHandovers.reduce((sum, item) => sum + item.amount, 0) + 
                            activeCarrierHandovers.reduce((sum, item) => sum + item.amount, 0)
    };
  }, [bookings, cities, providers, carriers, rateMatrix]);

  // 2. Filter bookings that have pending cash handovers
  const pendingHandovers = useMemo(() => {
    return bookings.filter(b => 
      b.customerPaymentStatus === 'Paid (Cash)' && 
      !(b.cashHolder === 'Company Admin' && b.cashHandoverStatus === 'Verified')
    );
  }, [bookings]);

  // Actions
  const handleMarkSubmitted = (b: Booking) => {
    const updated: Booking = {
      ...b,
      cashHandoverStatus: 'Submitted to Company'
    };
    onUpdateBooking(updated);
  };

  const handleVerifyHandover = (b: Booking) => {
    const updated: Booking = {
      ...b,
      cashHolder: 'Company Admin',
      cashHandoverStatus: 'Verified'
    };
    onUpdateBooking(updated);
  };

  const formatEuro = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-up" id="cash-control-view">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-primary tracking-tight">
          Cash Control & Handover Log
        </h1>
        <p className="text-xs text-muted font-body mt-1">
          Ensure physical cash security by tracking the custodian responsibilities and confirming corporate handovers.
        </p>
      </div>

      {/* Grid: Cash Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="cash-balances-grid">
        
        {/* Card 1: Verified Cash on Hand */}
        <div className="bg-surface p-6 rounded-lg shadow-md flex items-center gap-5 border-l-4 border-emerald-500">
          <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold tracking-wider font-body">Verified Bank & Vault Cash</span>
            <span className="text-2xl font-heading font-bold text-primary">{formatEuro(balances.companyVerifiedCash)}</span>
            <p className="text-[11px] text-muted mt-1">
              Secured in Company Bank or verified cash safe.
            </p>
          </div>
        </div>

        {/* Card 2: Partner Held Exposure (Unsubmitted Cash) */}
        <div className="bg-surface p-6 rounded-lg shadow-md flex items-center gap-5 border-l-4 border-accent">
          <div className="p-3 bg-indigo-50 rounded-full text-accent">
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold tracking-wider font-body">Partner Held Exposure</span>
            <span className="text-2xl font-heading font-bold text-primary">{formatEuro(balances.totalUnverifiedCash)}</span>
            <p className="text-[11px] text-muted mt-1">
              Currently held by field guides or transit drivers.
            </p>
          </div>
        </div>

        {/* Card 3: Uncollected (Accounts Receivable) */}
        <div className="bg-surface p-6 rounded-lg shadow-md flex items-center gap-5 border-l-4 border-red-500">
          <div className="p-3 bg-red-50 rounded-full text-red-600">
            <ShieldAlert size={24} />
          </div>
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold tracking-wider font-body">Outstanding Receivables</span>
            <span className="text-2xl font-heading font-bold text-primary">{formatEuro(balances.uncollectedUnpaid)}</span>
            <p className="text-[11px] text-muted mt-1">
              Unpaid customer bookings awaiting settlement.
            </p>
          </div>
        </div>

      </div>

      {/* Detailed Custodian list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="custodian-breakdown">
        
        {/* Guides (Providers) Custody */}
        <div className="bg-surface p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-heading font-bold text-primary tracking-tight mb-1 flex items-center gap-2">
            <Users size={18} className="text-accent" />
            Field Guides Custody Ledger
          </h2>
          <p className="text-xs text-muted mb-4">Cash collected from customers and currently held by Lead/Assistant Guides.</p>
          
          <div className="space-y-3" id="guides-cash-ledgers">
            {balances.activeProviderHandovers.map(p => (
              <div key={p.name} className="flex justify-between items-center p-3 bg-bg rounded border border-border">
                <div>
                  <span className="font-semibold text-primary block text-xs">{p.name}</span>
                  <span className="text-[10px] text-muted">{p.bookingsCount} active cash booking(s)</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-heading font-bold text-primary">{formatEuro(p.amount)}</span>
                  <span className="text-[9px] block text-amber-600 font-semibold uppercase">Pending Handover</span>
                </div>
              </div>
            ))}
            {balances.activeProviderHandovers.length === 0 && (
              <div className="text-center py-8 text-muted text-xs">No active cash currently held by guides.</div>
            )}
          </div>
        </div>

        {/* Drivers (Carriers) Custody */}
        <div className="bg-surface p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-heading font-bold text-primary tracking-tight mb-1 flex items-center gap-2">
            <Users size={18} className="text-primary" />
            Transit Driver Custody Ledger
          </h2>
          <p className="text-xs text-muted mb-4">Cash collected from customers and currently held by Transportation Carriers.</p>

          <div className="space-y-3" id="drivers-cash-ledgers">
            {balances.activeCarrierHandovers.map(c => (
              <div key={c.name} className="flex justify-between items-center p-3 bg-bg rounded border border-border">
                <div>
                  <span className="font-semibold text-primary block text-xs">{c.name}</span>
                  <span className="text-[10px] text-muted">{c.bookingsCount} active transit booking(s)</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-heading font-bold text-primary">{formatEuro(c.amount)}</span>
                  <span className="text-[9px] block text-amber-600 font-semibold uppercase">Pending Handover</span>
                </div>
              </div>
            ))}
            {balances.activeCarrierHandovers.length === 0 && (
              <div className="text-center py-8 text-muted text-xs">No active cash currently held by transit carriers.</div>
            )}
          </div>
        </div>

      </div>

      {/* Handover Reconciliation Workspace (Awaiting action) */}
      <div className="bg-surface p-6 rounded-lg shadow-md" id="reconciliation-workspace">
        <h2 className="text-lg font-heading font-bold text-primary tracking-tight mb-1 flex items-center gap-2">
          <Key size={18} className="text-accent" />
          Reconciliation Queue
        </h2>
        <p className="text-xs text-muted mb-6">Verify handovers to officially balance company cash books and release liability from field partners.</p>

        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left text-xs" id="reconciliation-queue-table">
            <thead>
              <tr className="bg-primary/4 border-b border-border h-9 uppercase font-bold tracking-wider text-primary text-[11px]">
                <th className="px-4 w-16">ID</th>
                <th className="px-4">Client / Customer</th>
                <th className="px-4">Current Custodian</th>
                <th className="px-4 text-right">Cash Collected</th>
                <th className="px-4 text-center">Status</th>
                <th className="px-4 text-center w-52">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pendingHandovers.map(b => {
                const transPrice = getBookingTransportPrice(b);
                const totalCash = b.serviceBaseFee + b.extraServiceFees + transPrice;
                const city = cities.find(c => c.id === b.cityId);
                const holderLabel = b.cashHolder === 'Provider 1' 
                  ? `${providers.find(p => p.id === b.provider1Id)?.name || 'Provider'} (Lead)`
                  : b.cashHolder === 'Provider 2'
                  ? `${providers.find(p => p.id === b.provider2Id)?.name || 'Provider'} (Assistant)`
                  : b.cashHolder === 'Carrier'
                  ? `${carriers.find(c => c.id === b.carrierId)?.name || 'Transit'} (Driver)`
                  : b.cashHolder;

                return (
                  <tr key={b.id} className="hover:bg-bg/50 transition-colors h-12" id={`recon-row-${b.id}`}>
                    <td className="px-4 font-mono font-semibold text-primary">{b.id}</td>
                    <td className="px-4">
                      <div className="font-semibold text-primary">{b.customerName}</div>
                      <div className="text-[10px] text-muted">{city?.name}</div>
                    </td>
                    <td className="px-4 font-medium text-primary">
                      {holderLabel}
                    </td>
                    <td className="px-4 text-right font-mono font-bold text-primary">
                      {formatEuro(totalCash)}
                    </td>
                    <td className="px-4 text-center">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        b.cashHandoverStatus === 'Submitted to Company' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {b.cashHandoverStatus === 'Submitted to Company' ? 'Submitted' : 'With Custodian'}
                      </span>
                    </td>
                    <td className="px-4 text-center">
                      <div className="flex gap-2 justify-center">
                        {b.cashHandoverStatus === 'Unsubmitted' && (
                          <button
                            onClick={() => handleMarkSubmitted(b)}
                            className="bg-bg hover:bg-accent/10 hover:text-accent border border-border text-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded cursor-pointer btn-pressable"
                            id={`btn-submit-cash-${b.id}`}
                          >
                            Mark Submitted
                          </button>
                        )}
                        <button
                          onClick={() => handleVerifyHandover(b)}
                          className="bg-accent hover:bg-accent/90 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded cursor-pointer shadow-xs btn-pressable"
                          id={`btn-verify-cash-${b.id}`}
                        >
                          Verify & Confirm Deposit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {pendingHandovers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted">
                    No pending cash handovers in the queue. All cash collections are verified on-book!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
