import React, { useState, useMemo } from 'react';
import { Booking, City, Provider, Carrier, RateMatrixEntry, SettlementStatus } from '../types';
import { Award, Truck, Check, RefreshCw, Layers, DollarSign } from 'lucide-react';

interface SettlementsViewProps {
  bookings: Booking[];
  cities: City[];
  providers: Provider[];
  carriers: Carrier[];
  rateMatrix: RateMatrixEntry[];
  onUpdateBooking: (updated: Booking) => void;
}

export const SettlementsView: React.FC<SettlementsViewProps> = ({
  bookings,
  cities,
  providers,
  carriers,
  rateMatrix,
  onUpdateBooking
}) => {
  // Navigation inside Settlements: 'providers' vs 'carriers'
  const [activeSubTab, setActiveSubTab] = useState<'providers' | 'carriers'>('providers');
  
  // Selected filter inside active sub-tab
  const [selectedProviderId, setSelectedProviderId] = useState<string>('ALL');
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>('ALL');

  // Compute transport cost
  const getBookingTransportCost = (booking: Booking): number => {
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

  // Provider Billings aggregation
  const providerBillings = useMemo(() => {
    // Generate data rows for bookings where selected provider is involved
    const rows: {
      bookingId: string;
      date: string;
      customerName: string;
      cityName: string;
      baseFee: number;
      commissionRate: number;
      commissionAmount: number;
      roleLabel: 'Lead' | 'Assistant';
      status: SettlementStatus;
      bookingRef: Booking;
    }[] = [];

    bookings.forEach(b => {
      // Is provider 1?
      if (b.provider1Id === selectedProviderId || selectedProviderId === 'ALL') {
        const p1 = providers.find(p => p.id === b.provider1Id);
        if (p1 && (selectedProviderId === 'ALL' || p1.id === selectedProviderId)) {
          const commAmt = (b.serviceBaseFee * p1.defaultCommissionRate) / 100;
          rows.push({
            bookingId: b.id,
            date: b.date,
            customerName: b.customerName,
            cityName: cities.find(c => c.id === b.cityId)?.name || 'Unknown',
            baseFee: b.serviceBaseFee,
            commissionRate: p1.defaultCommissionRate,
            commissionAmount: commAmt,
            roleLabel: 'Lead',
            status: b.provider1SettlementStatus,
            bookingRef: b
          });
        }
      }

      // Is provider 2?
      if (b.provider2Id && (b.provider2Id === selectedProviderId || selectedProviderId === 'ALL')) {
        const p2 = providers.find(p => p.id === b.provider2Id);
        if (p2 && (selectedProviderId === 'ALL' || p2.id === selectedProviderId)) {
          const commAmt = (b.serviceBaseFee * p2.defaultCommissionRate) / 100;
          rows.push({
            bookingId: b.id,
            date: b.date,
            customerName: b.customerName,
            cityName: cities.find(c => c.id === b.cityId)?.name || 'Unknown',
            baseFee: b.serviceBaseFee,
            commissionRate: p2.defaultCommissionRate,
            commissionAmount: commAmt,
            roleLabel: 'Assistant',
            status: b.provider2SettlementStatus,
            bookingRef: b
          });
        }
      }
    });

    const totalUnsettled = rows.filter(r => r.status === 'Unsettled').reduce((sum, r) => sum + r.commissionAmount, 0);
    const totalSettled = rows.filter(r => r.status === 'Settled').reduce((sum, r) => sum + r.commissionAmount, 0);

    return { rows, totalUnsettled, totalSettled };
  }, [bookings, selectedProviderId, providers, cities]);

  // Carrier Billings aggregation
  const carrierBillings = useMemo(() => {
    const rows: {
      bookingId: string;
      date: string;
      customerName: string;
      cityName: string;
      transitHours: number;
      customPrice: number | null;
      rateMatrixPrice: number;
      finalPrice: number;
      status: SettlementStatus;
      bookingRef: Booking;
    }[] = [];

    bookings.forEach(b => {
      if (b.carrierId === selectedCarrierId || selectedCarrierId === 'ALL') {
        const transCost = getBookingTransportCost(b);
        const city = cities.find(c => c.id === b.cityId);
        
        // Lookup standard rate
        let range: '0-4h' | '4-8h' | '8-12h' | '12-24h' = '0-4h';
        const hours = b.transportDurationHours;
        if (hours <= 4) range = '0-4h';
        else if (hours <= 8) range = '4-8h';
        else if (hours <= 12) range = '8-12h';
        else range = '12-24h';

        const matrixId = `${b.carrierId}_${b.cityId}_${range}`;
        const entry = rateMatrix.find(r => r.id === matrixId);
        const matrixPrice = entry ? entry.price : 0;

        rows.push({
          bookingId: b.id,
          date: b.date,
          customerName: b.customerName,
          cityName: city?.name || 'Unknown',
          transitHours: b.transportDurationHours,
          customPrice: b.transportCustomPrice,
          rateMatrixPrice: matrixPrice,
          finalPrice: transCost,
          status: b.carrierSettlementStatus,
          bookingRef: b
        });
      }
    });

    const totalUnsettled = rows.filter(r => r.status === 'Unsettled').reduce((sum, r) => sum + r.finalPrice, 0);
    const totalSettled = rows.filter(r => r.status === 'Settled').reduce((sum, r) => sum + r.finalPrice, 0);

    return { rows, totalUnsettled, totalSettled };
  }, [bookings, selectedCarrierId, rateMatrix, cities]);

  // Handle toggling settlement
  const handleToggleProviderSettlement = (row: typeof providerBillings.rows[0]) => {
    const isP1 = row.bookingRef.provider1Id === row.bookingRef.provider1Id && row.roleLabel === 'Lead';
    const updated: Booking = { ...row.bookingRef };
    
    if (isP1) {
      updated.provider1SettlementStatus = row.status === 'Settled' ? 'Unsettled' : 'Settled';
    } else {
      updated.provider2SettlementStatus = row.status === 'Settled' ? 'Unsettled' : 'Settled';
    }
    onUpdateBooking(updated);
  };

  const handleToggleCarrierSettlement = (row: typeof carrierBillings.rows[0]) => {
    const updated: Booking = {
      ...row.bookingRef,
      carrierSettlementStatus: row.status === 'Settled' ? 'Unsettled' : 'Settled'
    };
    onUpdateBooking(updated);
  };

  const formatEuro = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-up" id="partner-settlements-view">
      
      {/* 1. View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary tracking-tight">
            Partner Settlement Desk
          </h1>
          <p className="text-xs text-muted font-body mt-1">
            Audit outstanding payouts, review transport rate overrides, and verify commission settlement states.
          </p>
        </div>

        {/* Sub-Tab toggler */}
        <div className="flex bg-primary/4 p-1 rounded-lg" id="settlements-sub-nav">
          <button
            onClick={() => setActiveSubTab('providers')}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-md transition-all cursor-pointer ${
              activeSubTab === 'providers' ? 'bg-surface text-primary shadow-sm' : 'text-primary/50 hover:text-primary'
            }`}
          >
            <Award size={14} />
            Service Guides
          </button>
          <button
            onClick={() => setActiveSubTab('carriers')}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-md transition-all cursor-pointer ${
              activeSubTab === 'carriers' ? 'bg-surface text-primary shadow-sm' : 'text-primary/50 hover:text-primary'
            }`}
          >
            <Truck size={14} />
            Transit Carriers
          </button>
        </div>
      </div>

      {/* 2. dynamic filter and financial totals row */}
      {activeSubTab === 'providers' ? (
        // PROVIDERS BILLINGS
        <div className="space-y-6" id="providers-settlement-workspace">
          
          {/* Quick Filter Bar + Totals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-4 bg-surface rounded-lg shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted font-bold font-body uppercase">Select Guide:</span>
              <select
                className="text-xs p-2 bg-bg border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent text-primary font-medium"
                value={selectedProviderId}
                onChange={e => setSelectedProviderId(e.target.value)}
              >
                <option value="ALL">All Guides (Consolidated)</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
              </select>
            </div>
            
            <div className="flex justify-between items-center px-4 py-1 bg-amber-50 rounded border-l-2 border-amber-500">
              <span className="text-[11px] text-amber-800 font-bold uppercase tracking-wide">Pending Payouts:</span>
              <span className="text-lg font-heading font-bold text-amber-950 font-mono">{formatEuro(providerBillings.totalUnsettled)}</span>
            </div>

            <div className="flex justify-between items-center px-4 py-1 bg-emerald-50 rounded border-l-2 border-emerald-500">
              <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wide">Paid Settlements:</span>
              <span className="text-lg font-heading font-bold text-emerald-950 font-mono">{formatEuro(providerBillings.totalSettled)}</span>
            </div>
          </div>

          {/* Grid table */}
          <div className="bg-surface rounded-lg shadow-md overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left text-xs" id="provider-settlements-table">
                <thead>
                  <tr className="bg-primary/4 border-b border-border h-10 font-bold text-primary uppercase tracking-wider text-[11px]">
                    <th className="px-4 w-16">ID</th>
                    <th className="px-4">Date</th>
                    <th className="px-4">Client</th>
                    <th className="px-4">City</th>
                    <th className="px-4">Role Assigned</th>
                    <th className="px-4 text-right">Service Base Fee</th>
                    <th className="px-4 text-center">Commission</th>
                    <th className="px-4 text-right">Commission Due</th>
                    <th className="px-4 text-center w-36">Status</th>
                    <th className="px-4 text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {providerBillings.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-bg/50 transition-colors h-11" id={`p-settle-row-${row.bookingId}`}>
                      <td className="px-4 font-mono font-bold text-primary">{row.bookingId}</td>
                      <td className="px-4 text-muted font-mono">{row.date}</td>
                      <td className="px-4 font-semibold text-primary">{row.customerName}</td>
                      <td className="px-4">{row.cityName}</td>
                      <td className="px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          row.roleLabel === 'Lead' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                        }`}>
                          {row.roleLabel}
                        </span>
                      </td>
                      <td className="px-4 text-right font-mono">{formatEuro(row.baseFee)}</td>
                      <td className="px-4 text-center font-semibold text-primary">{row.commissionRate}%</td>
                      <td className="px-4 text-right font-mono font-bold text-primary">{formatEuro(row.commissionAmount)}</td>
                      <td className="px-4 text-center">
                        <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          row.status === 'Settled' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 text-center">
                        <button
                          onClick={() => handleToggleProviderSettlement(row)}
                          className={`text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded cursor-pointer transition-all ${
                            row.status === 'Settled' 
                              ? 'bg-bg text-primary hover:bg-primary/5 border border-border'
                              : 'bg-accent text-white hover:bg-accent/90'
                          }`}
                          id={`btn-settle-prov-${row.bookingId}-${idx}`}
                        >
                          {row.status === 'Settled' ? 'Revert Pay' : 'Pay Partner'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {providerBillings.rows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-muted">
                        No active booking records for this guide filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        // CARRIERS BILLINGS
        <div className="space-y-6" id="carriers-settlement-workspace">
          
          {/* Quick Filter Bar + Totals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-4 bg-surface rounded-lg shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted font-bold font-body uppercase">Select Carrier:</span>
              <select
                className="text-xs p-2 bg-bg border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent text-primary font-medium"
                value={selectedCarrierId}
                onChange={e => setSelectedCarrierId(e.target.value)}
              >
                <option value="ALL">All Carriers (Consolidated)</option>
                {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="flex justify-between items-center px-4 py-1 bg-amber-50 rounded border-l-2 border-amber-500">
              <span className="text-[11px] text-amber-800 font-bold uppercase tracking-wide">Outstanding Transit Fees:</span>
              <span className="text-lg font-heading font-bold text-amber-950 font-mono">{formatEuro(carrierBillings.totalUnsettled)}</span>
            </div>

            <div className="flex justify-between items-center px-4 py-1 bg-emerald-50 rounded border-l-2 border-emerald-500">
              <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wide">Settled Transit Fees:</span>
              <span className="text-lg font-heading font-bold text-emerald-950 font-mono">{formatEuro(carrierBillings.totalSettled)}</span>
            </div>
          </div>

          {/* Grid table */}
          <div className="bg-surface rounded-lg shadow-md overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left text-xs" id="carrier-settlements-table">
                <thead>
                  <tr className="bg-primary/4 border-b border-border h-10 font-bold text-primary uppercase tracking-wider text-[11px]">
                    <th className="px-4 w-16">ID</th>
                    <th className="px-4">Date</th>
                    <th className="px-4">Client</th>
                    <th className="px-4">Hub City</th>
                    <th className="px-4 text-center">Transit Hours</th>
                    <th className="px-4 text-right">Standard Rate Matrix Price</th>
                    <th className="px-4 text-right">Custom Manual Price</th>
                    <th className="px-4 text-right">Final Payout Owed</th>
                    <th className="px-4 text-center w-36">Status</th>
                    <th className="px-4 text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {carrierBillings.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-bg/50 transition-colors h-11" id={`c-settle-row-${row.bookingId}`}>
                      <td className="px-4 font-mono font-bold text-primary">{row.bookingId}</td>
                      <td className="px-4 text-muted font-mono">{row.date}</td>
                      <td className="px-4 font-semibold text-primary">{row.customerName}</td>
                      <td className="px-4">{row.cityName}</td>
                      <td className="px-4 text-center font-mono font-semibold text-primary">{row.transitHours}h</td>
                      <td className="px-4 text-right font-mono text-muted">{formatEuro(row.rateMatrixPrice)}</td>
                      <td className="px-4 text-right font-mono">
                        {row.customPrice !== null ? (
                          <span className="text-accent font-semibold">{formatEuro(row.customPrice)}</span>
                        ) : (
                          <span className="text-muted italic">Auto-calculated</span>
                        )}
                      </td>
                      <td className="px-4 text-right font-mono font-bold text-primary">{formatEuro(row.finalPrice)}</td>
                      <td className="px-4 text-center">
                        <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          row.status === 'Settled' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 text-center">
                        <button
                          onClick={() => handleToggleCarrierSettlement(row)}
                          className={`text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded cursor-pointer transition-all ${
                            row.status === 'Settled' 
                              ? 'bg-bg text-primary hover:bg-primary/5 border border-border'
                              : 'bg-accent text-white hover:bg-accent/90'
                          }`}
                          id={`btn-settle-carrier-${row.bookingId}-${idx}`}
                        >
                          {row.status === 'Settled' ? 'Revert Pay' : 'Pay Carrier'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {carrierBillings.rows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-muted">
                        No active booking transit records for this carrier.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
