import React, { useState, useMemo } from 'react';
import { Booking, City, Provider, Carrier, RateMatrixEntry, Location, PaymentStatus, CashHolder, HandoverStatus, SettlementStatus } from '../types';
import { Plus, Search, Filter, Edit, Trash2, Check, X, FileText, ChevronDown, Sparkles } from 'lucide-react';

interface MasterLedgerViewProps {
  bookings: Booking[];
  cities: City[];
  providers: Provider[];
  carriers: Carrier[];
  locations: Location[];
  rateMatrix: RateMatrixEntry[];
  onAddBooking: (booking: Booking) => void;
  onUpdateBooking: (updated: Booking) => void;
  onDeleteBooking: (id: string) => void;
}

export const MasterLedgerView: React.FC<MasterLedgerViewProps> = ({
  bookings,
  cities,
  providers,
  carriers,
  locations,
  rateMatrix,
  onAddBooking,
  onUpdateBooking,
  onDeleteBooking
}) => {
  // Search and Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('ALL');
  const [selectedCarrierId, setSelectedCarrierId] = useState('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('ALL');
  
  // Adding Booking form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBooking, setNewBooking] = useState<Partial<Booking>>({
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    cityId: cities[0]?.id || '',
    pickupLocationId: '',
    dropoffLocationId: '',
    provider1Id: providers[0]?.id || '',
    provider2Id: null,
    serviceBaseFee: 0,
    extraServiceFees: 0,
    carrierId: carriers[0]?.id || '',
    transportDurationHours: 1,
    transportCustomPrice: null,
    customerPaymentStatus: 'Unpaid',
    cashHolder: 'Customer',
    cashHandoverStatus: 'Unsubmitted',
    provider1SettlementStatus: 'Unsettled',
    provider2SettlementStatus: 'Unsettled',
    carrierSettlementStatus: 'Unsettled'
  });

  // Inline editing row ID state
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editingBookingData, setEditingBookingData] = useState<Booking | null>(null);

  // Filtered locations based on selected city for add form
  const filteredLocationsForAdd = useMemo(() => {
    return locations.filter(loc => loc.cityId === newBooking.cityId);
  }, [locations, newBooking.cityId]);

  // Set default locations when city changes in Add Form
  const handleCityChangeInAdd = (cityId: string) => {
    const cityLocs = locations.filter(loc => loc.cityId === cityId);
    setNewBooking(prev => ({
      ...prev,
      cityId,
      pickupLocationId: cityLocs[0]?.id || '',
      dropoffLocationId: cityLocs[1]?.id || cityLocs[0]?.id || ''
    }));
  };

  // 1. Calculate transport price dynamically
  const calculateTransportPrice = (booking: Booking | Partial<Booking>): number => {
    if (booking.transportCustomPrice !== undefined && booking.transportCustomPrice !== null) {
      return Number(booking.transportCustomPrice);
    }
    if (!booking.carrierId || !booking.cityId || booking.transportDurationHours === undefined) {
      return 0;
    }

    const hours = Number(booking.transportDurationHours);
    let range: '0-4h' | '4-8h' | '8-12h' | '12-24h' = '0-4h';
    if (hours <= 4) range = '0-4h';
    else if (hours <= 8) range = '4-8h';
    else if (hours <= 12) range = '8-12h';
    else range = '12-24h';

    const matrixId = `${booking.carrierId}_${booking.cityId}_${range}`;
    const entry = rateMatrix.find(r => r.id === matrixId);
    return entry ? entry.price : 0;
  };

  // Handle saving new booking
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.customerName) {
      alert("Please provide customer name.");
      return;
    }

    // Determine an incremental Booking ID
    const nextNum = bookings.length > 0
      ? Math.max(...bookings.map(b => parseInt(b.id.substring(1)) || 0)) + 1
      : 1;
    const nextId = `B${String(nextNum).padStart(3, '0')}`;

    const completeBooking: Booking = {
      id: nextId,
      date: newBooking.date || new Date().toISOString().split('T')[0],
      customerName: newBooking.customerName || 'Anonymous Client',
      cityId: newBooking.cityId || cities[0]?.id || '',
      pickupLocationId: newBooking.pickupLocationId || filteredLocationsForAdd[0]?.id || '',
      dropoffLocationId: newBooking.dropoffLocationId || filteredLocationsForAdd[1]?.id || filteredLocationsForAdd[0]?.id || '',
      provider1Id: newBooking.provider1Id || providers[0]?.id || '',
      provider2Id: newBooking.provider2Id || null,
      serviceBaseFee: Number(newBooking.serviceBaseFee) || 0,
      extraServiceFees: Number(newBooking.extraServiceFees) || 0,
      carrierId: newBooking.carrierId || carriers[0]?.id || '',
      transportDurationHours: Number(newBooking.transportDurationHours) || 1,
      transportCustomPrice: newBooking.transportCustomPrice === null ? null : Number(newBooking.transportCustomPrice),
      customerPaymentStatus: newBooking.customerPaymentStatus || 'Unpaid',
      cashHolder: newBooking.cashHolder || 'Customer',
      cashHandoverStatus: newBooking.cashHandoverStatus || 'Unsubmitted',
      provider1SettlementStatus: newBooking.provider1SettlementStatus || 'Unsettled',
      provider2SettlementStatus: newBooking.provider2SettlementStatus || 'Unsettled',
      carrierSettlementStatus: newBooking.carrierSettlementStatus || 'Unsettled'
    };

    onAddBooking(completeBooking);
    setShowAddForm(false);
    
    // Reset Add state
    setNewBooking({
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      cityId: cities[0]?.id || '',
      pickupLocationId: '',
      dropoffLocationId: '',
      provider1Id: providers[0]?.id || '',
      provider2Id: null,
      serviceBaseFee: 0,
      extraServiceFees: 0,
      carrierId: carriers[0]?.id || '',
      transportDurationHours: 1,
      transportCustomPrice: null,
      customerPaymentStatus: 'Unpaid',
      cashHolder: 'Customer',
      cashHandoverStatus: 'Unsubmitted',
      provider1SettlementStatus: 'Unsettled',
      provider2SettlementStatus: 'Unsettled',
      carrierSettlementStatus: 'Unsettled'
    });
  };

  // Inline editing handlers
  const startInlineEdit = (booking: Booking) => {
    setEditingBookingId(booking.id);
    setEditingBookingData({ ...booking });
  };

  const cancelInlineEdit = () => {
    setEditingBookingId(null);
    setEditingBookingData(null);
  };

  const saveInlineEdit = () => {
    if (editingBookingData) {
      onUpdateBooking(editingBookingData);
      setEditingBookingId(null);
      setEditingBookingData(null);
    }
  };

  const handleInlineChange = (field: keyof Booking, value: any) => {
    if (!editingBookingData) return;

    const updated = { ...editingBookingData, [field]: value };

    // Automatic Cascade Rules
    // 1. If payment status turns Unpaid, cashHolder must become Customer
    if (field === 'customerPaymentStatus' && value === 'Unpaid') {
      updated.cashHolder = 'Customer';
      updated.cashHandoverStatus = 'Unsubmitted';
    }
    // 2. If payment status turns Paid (Bank Transfer), cashHolder must become Company Admin and status Verified
    if (field === 'customerPaymentStatus' && value === 'Paid (Bank Transfer)') {
      updated.cashHolder = 'Company Admin';
      updated.cashHandoverStatus = 'Verified';
    }
    // 3. If cash holder is marked Company Admin, the handover is submitted/verified
    if (field === 'cashHolder' && value === 'Company Admin' && updated.cashHandoverStatus === 'Unsubmitted') {
      updated.cashHandoverStatus = 'Verified';
    }

    setEditingBookingData(updated);
  };

  // Filtered Bookings for representation
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = selectedCityId === 'ALL' || b.cityId === selectedCityId;
      const matchesCarrier = selectedCarrierId === 'ALL' || b.carrierId === selectedCarrierId;
      const matchesPayment = selectedPaymentStatus === 'ALL' || b.customerPaymentStatus === selectedPaymentStatus;

      return matchesSearch && matchesCity && matchesCarrier && matchesPayment;
    });
  }, [bookings, searchTerm, selectedCityId, selectedCarrierId, selectedPaymentStatus]);

  // Calculations for specific columns
  const getBookingDetails = (b: Booking) => {
    const city = cities.find(c => c.id === b.cityId);
    const pickup = locations.find(l => l.id === b.pickupLocationId);
    const dropoff = locations.find(l => l.id === b.dropoffLocationId);
    const carrier = carriers.find(c => c.id === b.carrierId);
    const p1 = providers.find(p => p.id === b.provider1Id);
    const p2 = b.provider2Id ? providers.find(p => p.id === b.provider2Id) : null;

    const transCost = calculateTransportPrice(b);
    const grossRevenue = b.serviceBaseFee + b.extraServiceFees + transCost;

    const commission1 = p1 ? (b.serviceBaseFee * p1.defaultCommissionRate) / 100 : 0;
    const commission2 = p2 ? (b.serviceBaseFee * p2.defaultCommissionRate) / 100 : 0;
    const totalProviderCost = commission1 + commission2;

    const profit = grossRevenue - totalProviderCost - transCost;
    const margin = grossRevenue > 0 ? (profit / grossRevenue) * 100 : 0;

    return {
      cityName: city?.name || 'Unknown',
      pickupName: pickup?.name || 'Unknown Address',
      dropoffName: dropoff?.name || 'Unknown Address',
      carrierName: carrier?.name || 'Unknown Carrier',
      p1Name: p1?.name || 'None',
      p2Name: p2?.name || '-',
      transCost,
      grossRevenue,
      commission1,
      commission2,
      totalProviderCost,
      profit,
      margin
    };
  };

  const formatEuro = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-8 animate-fade-up" id="monthly-master-view">
      
      {/* 1. Header & Quick Toolbars */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary tracking-tight">
            Monthly Operational Ledger
          </h1>
          <p className="text-xs text-muted font-body mt-1">
            Reconcile daily booking records, automate rate lookup matrices, and track cash positions.
          </p>
        </div>
        
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            // Pre-fill default locations
            if (cities[0]) handleCityChangeInAdd(cities[0].id);
          }}
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white text-xs font-semibold tracking-wide uppercase px-4 py-2.5 rounded-md shadow-sm btn-pressable"
          id="btn-add-booking"
        >
          {showAddForm ? <X size={15} /> : <Plus size={15} />}
          {showAddForm ? 'Close Entry Form' : 'New Order Booking'}
        </button>
      </div>

      {/* 2. Interactive Add Booking Panel */}
      {showAddForm && (
        <form onSubmit={handleCreateBooking} className="p-6 bg-surface rounded-lg shadow-md border-t-3 border-accent grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-up" id="add-booking-form">
          <div className="md:col-span-3 flex items-center justify-between border-b border-border pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 font-body">
              <Sparkles size={14} className="text-accent" />
              New Operational Booking Form
            </span>
            <span className="text-[11px] text-muted">Formula results auto-calculate instantly</span>
          </div>

          {/* Customer & Date */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Customer Name</label>
            <input 
              type="text" 
              required
              className="w-full text-xs p-2.5 bg-[#FFFDE7] text-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={newBooking.customerName || ''}
              onChange={e => setNewBooking(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="e.g. AeroTech Systems"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Booking Date</label>
            <input 
              type="date" 
              required
              className="w-full text-xs p-2.5 bg-[#FFFDE7] text-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={newBooking.date || ''}
              onChange={e => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Operating City</label>
            <select
              className="w-full text-xs p-2.5 bg-[#FFFDE7] text-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={newBooking.cityId || ''}
              onChange={e => handleCityChangeInAdd(e.target.value)}
            >
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Locations */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Pickup Node</label>
            <select
              className="w-full text-xs p-2.5 bg-[#FFFDE7] text-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={newBooking.pickupLocationId || ''}
              onChange={e => setNewBooking(prev => ({ ...prev, pickupLocationId: e.target.value }))}
            >
              {filteredLocationsForAdd.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              {filteredLocationsForAdd.length === 0 && <option value="">No city locations configured</option>}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Dropoff Node</label>
            <select
              className="w-full text-xs p-2.5 bg-[#FFFDE7] text-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={newBooking.dropoffLocationId || ''}
              onChange={e => setNewBooking(prev => ({ ...prev, dropoffLocationId: e.target.value }))}
            >
              {filteredLocationsForAdd.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              {filteredLocationsForAdd.length === 0 && <option value="">No city locations configured</option>}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Lead Provider (1)</label>
            <select
              className="w-full text-xs p-2.5 bg-[#FFFDE7] text-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={newBooking.provider1Id || ''}
              onChange={e => setNewBooking(prev => ({ ...prev, provider1Id: e.target.value }))}
            >
              {providers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.defaultCommissionRate}%)</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Assistant Provider (2) - Optional</label>
            <select
              className="w-full text-xs p-2.5 bg-[#FFFDE7] text-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={newBooking.provider2Id || ''}
              onChange={e => setNewBooking(prev => ({ ...prev, provider2Id: e.target.value ? e.target.value : null }))}
            >
              <option value="">None (Single provider)</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.defaultCommissionRate}%)</option>)}
            </select>
          </div>

          {/* Service Fees */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Service Base Fee (€)</label>
            <input 
              type="number" 
              className="w-full text-xs p-2.5 bg-[#FFFDE7] text-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={newBooking.serviceBaseFee}
              min="0"
              onChange={e => setNewBooking(prev => ({ ...prev, serviceBaseFee: Number(e.target.value) }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Extra Service Fee (€)</label>
            <input 
              type="number" 
              className="w-full text-xs p-2.5 bg-[#FFFDE7] text-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={newBooking.extraServiceFees}
              min="0"
              onChange={e => setNewBooking(prev => ({ ...prev, extraServiceFees: Number(e.target.value) }))}
            />
          </div>

          {/* Transport Details */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Transport Carrier</label>
            <select
              className="w-full text-xs p-2.5 bg-[#FFFDE7] text-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={newBooking.carrierId || ''}
              onChange={e => setNewBooking(prev => ({ ...prev, carrierId: e.target.value }))}
            >
              {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Transit Duration (Hours)</label>
            <input 
              type="number" 
              min="1"
              className="w-full text-xs p-2.5 bg-[#FFFDE7] text-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={newBooking.transportDurationHours}
              onChange={e => setNewBooking(prev => ({ ...prev, transportDurationHours: Number(e.target.value) }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Transport Override Price (€)</label>
            <input 
              type="text" 
              placeholder="Blank uses Matrix auto-rate"
              className="w-full text-xs p-2.5 bg-[#FFFDE7] text-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={newBooking.transportCustomPrice === null ? '' : newBooking.transportCustomPrice}
              onChange={e => {
                const val = e.target.value === '' ? null : Number(e.target.value);
                setNewBooking(prev => ({ ...prev, transportCustomPrice: val }));
              }}
            />
          </div>

          {/* Financial calculations preview before submitting */}
          <div className="md:col-span-3 p-4 bg-primary/4 rounded-md flex justify-between items-center text-xs text-primary font-mono border-t border-b border-primary/10">
            <div>
              <span>Calculated Transport Cost: </span>
              <span className="font-bold">{formatEuro(calculateTransportPrice(newBooking))}</span>
            </div>
            <div>
              <span>Calculated Total Revenue: </span>
              <span className="font-bold">
                {formatEuro(
                  (Number(newBooking.serviceBaseFee) || 0) + 
                  (Number(newBooking.extraServiceFees) || 0) + 
                  calculateTransportPrice(newBooking)
                )}
              </span>
            </div>
          </div>

          {/* Financial status */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Payment Status</label>
            <select
              className="w-full text-xs p-2.5 bg-[#FFFDE7] text-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={newBooking.customerPaymentStatus || 'Unpaid'}
              onChange={e => {
                const status = e.target.value as PaymentStatus;
                let holder: CashHolder = 'Customer';
                let handover: HandoverStatus = 'Unsubmitted';
                if (status === 'Paid (Cash)') {
                  holder = 'Provider 1';
                } else if (status === 'Paid (Bank Transfer)') {
                  holder = 'Company Admin';
                  handover = 'Verified';
                }
                setNewBooking(prev => ({ 
                  ...prev, 
                  customerPaymentStatus: status,
                  cashHolder: holder,
                  cashHandoverStatus: handover
                }));
              }}
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Paid (Cash)">Paid (Cash)</option>
              <option value="Paid (Bank Transfer)">Paid (Bank Transfer)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Current Cash Holder</label>
            <select
              disabled={newBooking.customerPaymentStatus === 'Unpaid' || newBooking.customerPaymentStatus === 'Paid (Bank Transfer)'}
              className="w-full text-xs p-2.5 bg-[#FFFDE7] disabled:bg-primary/5 text-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              value={newBooking.cashHolder || 'Customer'}
              onChange={e => {
                const val = e.target.value as CashHolder;
                setNewBooking(prev => ({ 
                  ...prev, 
                  cashHolder: val,
                  cashHandoverStatus: val === 'Company Admin' ? 'Verified' : 'Unsubmitted'
                }));
              }}
            >
              <option value="Customer">Customer</option>
              <option value="Carrier">Carrier (Driver)</option>
              <option value="Provider 1">Lead Provider (1)</option>
              <option value="Provider 2">Assistant Provider (2)</option>
              <option value="Company Admin">Company Admin</option>
            </select>
          </div>

          <div className="space-y-1.5 flex items-end">
            <button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-white text-xs font-bold uppercase py-3 rounded-md shadow-sm tracking-wider btn-pressable"
            >
              Verify & Save Booking
            </button>
          </div>
        </form>
      )}

      {/* 3. Operational Search & Filters Toolbar */}
      <div className="p-4 bg-surface rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between border border-border" id="ledger-filters-bar">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
            <Search size={15} />
          </span>
          <input 
            type="text" 
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-bg border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent text-primary placeholder-muted"
            placeholder="Search bookings or clients..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto" id="filters-dropdowns">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Filter size={13} />
            <span>Hub Filter:</span>
          </div>
          <select
            className="text-xs p-2 bg-bg border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent text-primary"
            value={selectedCityId}
            onChange={e => setSelectedCityId(e.target.value)}
          >
            <option value="ALL">All Cities</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            className="text-xs p-2 bg-bg border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent text-primary"
            value={selectedCarrierId}
            onChange={e => setSelectedCarrierId(e.target.value)}
          >
            <option value="ALL">All Carriers</option>
            {carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            className="text-xs p-2 bg-bg border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent text-primary"
            value={selectedPaymentStatus}
            onChange={e => setSelectedPaymentStatus(e.target.value)}
          >
            <option value="ALL">All Payments</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Paid (Cash)">Paid (Cash)</option>
            <option value="Paid (Bank Transfer)">Paid (Bank Transfer)</option>
          </select>
        </div>
      </div>

      {/* 4. Primary Spreadsheet Grid */}
      <div className="bg-surface rounded-lg shadow-md overflow-hidden border border-border" id="ledger-grid-container">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left border-collapse" id="ledger-data-table">
            <thead>
              <tr className="bg-primary/4 border-b-2 border-primary/10 h-11 text-xs font-bold text-primary uppercase tracking-[0.06em]">
                <th className="px-4 text-center w-16 font-semibold">ID</th>
                <th className="px-4 w-28 font-semibold">Date</th>
                <th className="px-4 font-semibold">Customer / Client</th>
                <th className="px-4 w-32 font-semibold">City Routing</th>
                <th className="px-4 w-40 font-semibold">Allocated Partners</th>
                <th className="px-3 text-right w-24 font-semibold">Base Fee</th>
                <th className="px-3 text-right w-24 font-semibold">Transit Fee</th>
                <th className="px-3 text-right w-24 font-semibold">Total Revenue</th>
                <th className="px-3 text-right w-24 font-semibold">Company Profit</th>
                <th className="px-4 text-center w-32 font-semibold">Payment / Cash Holder</th>
                <th className="px-4 text-center w-24 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBookings.map(b => {
                const d = getBookingDetails(b);
                const isEditing = editingBookingId === b.id;

                if (isEditing && editingBookingData) {
                  const filteredLocationsForEdit = locations.filter(loc => loc.cityId === editingBookingData.cityId);
                  const lookupPrice = calculateTransportPrice(editingBookingData);

                  return (
                    <tr key={b.id} className="bg-amber-50/30 font-body text-xs" id={`booking-row-edit-${b.id}`}>
                      {/* Readonly ID */}
                      <td className="px-4 text-center font-mono font-bold text-primary">{b.id}</td>
                      
                      {/* Date */}
                      <td className="px-2">
                        <input 
                          type="date" 
                          className="w-full text-xs p-1.5 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                          value={editingBookingData.date}
                          onChange={e => handleInlineChange('date', e.target.value)}
                        />
                      </td>

                      {/* Customer Name */}
                      <td className="px-2">
                        <input 
                          type="text" 
                          className="w-full text-xs p-1.5 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none font-medium"
                          value={editingBookingData.customerName}
                          onChange={e => handleInlineChange('customerName', e.target.value)}
                        />
                      </td>

                      {/* Routing */}
                      <td className="px-2 py-2 space-y-1">
                        <select
                          className="w-full text-[11px] p-1 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                          value={editingBookingData.cityId}
                          onChange={e => {
                            const newCity = e.target.value;
                            const cityLocs = locations.filter(loc => loc.cityId === newCity);
                            setEditingBookingData(prev => prev ? {
                              ...prev,
                              cityId: newCity,
                              pickupLocationId: cityLocs[0]?.id || '',
                              dropoffLocationId: cityLocs[1]?.id || cityLocs[0]?.id || ''
                            } : null);
                          }}
                        >
                          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select
                          className="w-full text-[11px] p-1 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                          value={editingBookingData.pickupLocationId}
                          onChange={e => handleInlineChange('pickupLocationId', e.target.value)}
                        >
                          {filteredLocationsForEdit.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <select
                          className="w-full text-[11px] p-1 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                          value={editingBookingData.dropoffLocationId}
                          onChange={e => handleInlineChange('dropoffLocationId', e.target.value)}
                        >
                          {filteredLocationsForEdit.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </td>

                      {/* Partners */}
                      <td className="px-2 py-2 space-y-1">
                        <select
                          className="w-full text-[11px] p-1 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                          value={editingBookingData.provider1Id}
                          onChange={e => handleInlineChange('provider1Id', e.target.value)}
                        >
                          {providers.map(p => <option key={p.id} value={p.id}>P1: {p.name}</option>)}
                        </select>
                        <select
                          className="w-full text-[11px] p-1 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                          value={editingBookingData.provider2Id || ''}
                          onChange={e => handleInlineChange('provider2Id', e.target.value ? e.target.value : null)}
                        >
                          <option value="">No Assistant (P2)</option>
                          {providers.map(p => <option key={p.id} value={p.id}>P2: {p.name}</option>)}
                        </select>
                        <select
                          className="w-full text-[11px] p-1 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                          value={editingBookingData.carrierId}
                          onChange={e => handleInlineChange('carrierId', e.target.value)}
                        >
                          {carriers.map(c => <option key={c.id} value={c.id}>T: {c.name}</option>)}
                        </select>
                      </td>

                      {/* Base Fee input */}
                      <td className="px-2">
                        <input 
                          type="number" 
                          className="w-full text-right text-xs p-1.5 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                          value={editingBookingData.serviceBaseFee}
                          onChange={e => handleInlineChange('serviceBaseFee', Number(e.target.value))}
                        />
                        <div className="text-[10px] text-muted text-right mt-1">+ Extra:</div>
                        <input 
                          type="number" 
                          className="w-full text-right text-xs p-1.5 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none mt-0.5"
                          value={editingBookingData.extraServiceFees}
                          onChange={e => handleInlineChange('extraServiceFees', Number(e.target.value))}
                        />
                      </td>

                      {/* Transit Fee calculations / override */}
                      <td className="px-2 py-2 space-y-1">
                        <div className="text-right font-mono text-[11px] font-bold">Auto: {formatEuro(lookupPrice)}</div>
                        <div className="text-[10px] text-muted text-right">Hours:</div>
                        <input 
                          type="number" 
                          className="w-full text-right text-xs p-1 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                          value={editingBookingData.transportDurationHours}
                          onChange={e => handleInlineChange('transportDurationHours', Number(e.target.value))}
                        />
                        <div className="text-[10px] text-muted text-right">Override:</div>
                        <input 
                          type="text" 
                          placeholder="Auto"
                          className="w-full text-right text-xs p-1 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                          value={editingBookingData.transportCustomPrice === null ? '' : editingBookingData.transportCustomPrice}
                          onChange={e => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            handleInlineChange('transportCustomPrice', val);
                          }}
                        />
                      </td>

                      {/* Readonly Calculated Column: Total Revenue */}
                      <td className="px-3 text-right font-mono font-bold text-primary">
                        {formatEuro(editingBookingData.serviceBaseFee + editingBookingData.extraServiceFees + lookupPrice)}
                      </td>

                      {/* Readonly Calculated Column: Profit */}
                      <td className="px-3 text-right font-mono font-bold text-accent">
                        {/* Instant profit visualization */}
                        {(() => {
                          const p1 = providers.find(p => p.id === editingBookingData.provider1Id);
                          const comm1 = p1 ? (editingBookingData.serviceBaseFee * p1.defaultCommissionRate) / 100 : 0;
                          const p2 = editingBookingData.provider2Id ? providers.find(p => p.id === editingBookingData.provider2Id) : null;
                          const comm2 = p2 ? (editingBookingData.serviceBaseFee * p2.defaultCommissionRate) / 100 : 0;
                          const rev = editingBookingData.serviceBaseFee + editingBookingData.extraServiceFees + lookupPrice;
                          const prof = rev - comm1 - comm2 - lookupPrice;
                          return formatEuro(prof);
                        })()}
                      </td>

                      {/* Status select fields */}
                      <td className="px-2 py-2 space-y-1">
                        <select
                          className="w-full text-[11px] p-1 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                          value={editingBookingData.customerPaymentStatus}
                          onChange={e => {
                            const status = e.target.value as PaymentStatus;
                            let holder: CashHolder = editingBookingData.cashHolder;
                            let handover: HandoverStatus = editingBookingData.cashHandoverStatus;
                            if (status === 'Unpaid') {
                              holder = 'Customer';
                              handover = 'Unsubmitted';
                            } else if (status === 'Paid (Cash)' && holder === 'Customer') {
                              holder = 'Provider 1';
                            } else if (status === 'Paid (Bank Transfer)') {
                              holder = 'Company Admin';
                              handover = 'Verified';
                            }
                            setEditingBookingData(prev => prev ? {
                              ...prev,
                              customerPaymentStatus: status,
                              cashHolder: holder,
                              cashHandoverStatus: handover
                            } : null);
                          }}
                        >
                          <option value="Unpaid">Unpaid</option>
                          <option value="Paid (Cash)">Paid (Cash)</option>
                          <option value="Paid (Bank Transfer)">Paid (Bank Transfer)</option>
                        </select>

                        <select
                          disabled={editingBookingData.customerPaymentStatus !== 'Paid (Cash)'}
                          className="w-full text-[11px] p-1 bg-[#FFFDE7] disabled:bg-primary/5 text-primary border border-border rounded focus:outline-none"
                          value={editingBookingData.cashHolder}
                          onChange={e => {
                            const val = e.target.value as CashHolder;
                            setEditingBookingData(prev => prev ? {
                              ...prev,
                              cashHolder: val,
                              cashHandoverStatus: val === 'Company Admin' ? 'Verified' : 'Unsubmitted'
                            } : null);
                          }}
                        >
                          <option value="Customer">Customer</option>
                          <option value="Carrier">Carrier (Driver)</option>
                          <option value="Provider 1">Provider 1</option>
                          <option value="Provider 2">Provider 2</option>
                          <option value="Company Admin">Company Admin</option>
                        </select>
                      </td>

                      {/* Inline Actions */}
                      <td className="px-4 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button
                            onClick={saveInlineEdit}
                            className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded cursor-pointer"
                            title="Apply and verify changes"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={cancelInlineEdit}
                            className="p-1 bg-red-500 hover:bg-red-600 text-white rounded cursor-pointer"
                            title="Cancel editing"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={b.id} className="hover:bg-primary/2 font-body text-xs transition-colors duration-150" id={`booking-row-${b.id}`}>
                    {/* Booking ID */}
                    <td className="px-4 py-3 text-center font-mono font-semibold text-primary">{b.id}</td>
                    
                    {/* Date */}
                    <td className="px-4 font-mono text-muted">{b.date}</td>

                    {/* Customer */}
                    <td className="px-4">
                      <div className="font-semibold text-primary">{b.customerName}</div>
                      <div className="text-[10px] text-muted font-mono">Formula Linked: Active</div>
                    </td>

                    {/* Routing */}
                    <td className="px-4 text-primary">
                      <div className="font-semibold text-primary">{d.cityName}</div>
                      <div className="text-[10px] text-muted truncate max-w-[150px]">
                        {d.pickupName} → {d.dropoffName}
                      </div>
                    </td>

                    {/* Allocated Partners */}
                    <td className="px-4 space-y-0.5 text-[11px] text-primary">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold bg-primary/10 text-primary px-1 rounded font-body">P1</span>
                        <span>{d.p1Name} ({b.provider1SettlementStatus === 'Settled' ? '✓' : '✗'})</span>
                      </div>
                      {b.provider2Id && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold bg-primary/10 text-primary px-1 rounded font-body">P2</span>
                          <span>{d.p2Name} ({b.provider2SettlementStatus === 'Settled' ? '✓' : '✗'})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-bold bg-accent/10 text-accent px-1 rounded font-body">TR</span>
                        <span className="text-muted">{d.carrierName} ({b.carrierSettlementStatus === 'Settled' ? '✓' : '✗'})</span>
                      </div>
                    </td>

                    {/* Service Fee */}
                    <td className="px-3 text-right font-mono text-primary font-semibold">
                      {formatEuro(b.serviceBaseFee)}
                      {b.extraServiceFees > 0 && (
                        <div className="text-[10px] text-muted">+{formatEuro(b.extraServiceFees)} extra</div>
                      )}
                    </td>

                    {/* Transit Fee calculated */}
                    <td className="px-3 text-right font-mono text-primary">
                      {formatEuro(d.transCost)}
                      <div className="text-[10px] text-muted">
                        {b.transportCustomPrice !== null ? 'Override' : `${b.transportDurationHours}h Matrix`}
                      </div>
                    </td>

                    {/* Total Revenue */}
                    <td className="px-3 text-right font-mono font-bold text-primary">
                      {formatEuro(d.grossRevenue)}
                    </td>

                    {/* Calculated Company profit with visual data bar */}
                    <td className="px-3 text-right font-mono">
                      <div className="font-bold text-primary">{formatEuro(d.profit)}</div>
                      <div className="text-[10px] text-accent font-semibold">{d.margin.toFixed(0)}% margin</div>
                      
                      {/* Inline Data bar for profitability relative to revenue */}
                      <div className="w-16 ml-auto bg-accent/10 h-1 rounded overflow-hidden mt-1">
                        <div 
                          className="bg-accent h-full rounded" 
                          style={{ width: `${Math.max(d.margin, 0)}%` }} 
                        />
                      </div>
                    </td>

                    {/* Payment status badge + current holder */}
                    <td className="px-4 text-center space-y-1">
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        b.customerPaymentStatus === 'Paid (Bank Transfer)' ? 'bg-emerald-100 text-emerald-800' :
                        b.customerPaymentStatus === 'Paid (Cash)' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {b.customerPaymentStatus}
                      </span>
                      {b.customerPaymentStatus !== 'Unpaid' && (
                        <div className="text-[10px] font-mono text-muted">
                          Holder: <span className="text-primary font-bold">{b.cashHolder}</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => startInlineEdit(b)}
                          className="p-1 text-primary hover:bg-primary/5 rounded transition-colors cursor-pointer"
                          title="Inline edit row"
                          id={`btn-edit-row-${b.id}`}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete booking ${b.id}? This cannot be undone.`)) {
                              onDeleteBooking(b.id);
                            }
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Delete booking"
                          id={`btn-delete-row-${b.id}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-muted font-body">
                    No active booking entries match your filters. Try selecting "All Cities" or creating a new booking record.
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
