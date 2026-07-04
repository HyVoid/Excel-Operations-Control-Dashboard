import React, { useState } from 'react';
import { AppSettings, City, Provider, Carrier, Location, RateMatrixEntry, DURATION_RANGES, FXRate } from '../types';
import { Settings, Globe, MapPin, Truck, Users, TableProperties, Plus, Trash2, Check, Sparkles } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  cities: City[];
  providers: Provider[];
  carriers: Carrier[];
  locations: Location[];
  rateMatrix: RateMatrixEntry[];
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateCities: (cities: City[]) => void;
  onUpdateProviders: (providers: Provider[]) => void;
  onUpdateCarriers: (carriers: Carrier[]) => void;
  onUpdateLocations: (locations: Location[]) => void;
  onUpdateRateMatrix: (matrix: RateMatrixEntry[]) => void;
}

type SubSettingSection = 'general' | 'rate-matrix' | 'partners' | 'geography';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  cities,
  providers,
  carriers,
  locations,
  rateMatrix,
  onUpdateSettings,
  onUpdateCities,
  onUpdateProviders,
  onUpdateCarriers,
  onUpdateLocations,
  onUpdateRateMatrix
}) => {
  const [activeSec, setActiveSec] = useState<SubSettingSection>('rate-matrix');

  // --- 1. GENERAL & FX STATES ---
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [taxRate, setTaxRate] = useState(settings.taxRatePercent);
  const [fxRates, setFxRates] = useState<FXRate[]>(settings.fxRates);

  const saveGeneralSettings = () => {
    onUpdateSettings({
      companyName,
      baseCurrency: settings.baseCurrency,
      taxRatePercent: taxRate,
      fxRates
    });
    alert("General configurations saved successfully!");
  };

  const handleFxRateChange = (idx: number, rate: number) => {
    const updated = [...fxRates];
    updated[idx] = { ...updated[idx], rate };
    setFxRates(updated);
  };

  // --- 2. RATE MATRIX INTERACTIVE SPREADSHEET MATRIX ---
  // Rows: combination of carrierId and cityId
  // Columns: '0-4h', '4-8h', '8-12h', '12-24h'
  const matrixRows = React.useMemo(() => {
    const rows: { carrier: Carrier; city: City }[] = [];
    carriers.forEach(carrier => {
      cities.forEach(city => {
        rows.push({ carrier, city });
      });
    });
    return rows;
  }, [carriers, cities]);

  const handleMatrixPriceChange = (carrierId: string, cityId: string, range: '0-4h' | '4-8h' | '8-12h' | '12-24h', value: number) => {
    const entryId = `${carrierId}_${cityId}_${range}`;
    const updatedMatrix = [...rateMatrix];
    const index = updatedMatrix.findIndex(item => item.id === entryId);

    if (index >= 0) {
      updatedMatrix[index] = { ...updatedMatrix[index], price: value };
    } else {
      updatedMatrix.push({
        id: entryId,
        carrierId,
        cityId,
        durationRange: range,
        price: value
      });
    }
    onUpdateRateMatrix(updatedMatrix);
  };

  const getMatrixPrice = (carrierId: string, cityId: string, range: '0-4h' | '4-8h' | '8-12h' | '12-24h'): number => {
    const entryId = `${carrierId}_${cityId}_${range}`;
    const entry = rateMatrix.find(item => item.id === entryId);
    return entry ? entry.price : 0;
  };

  // --- 3. CRUD STATES FOR PARTNERS (Providers & Carriers) ---
  const [newProvName, setNewProvName] = useState('');
  const [newProvPhone, setNewProvPhone] = useState('');
  const [newProvRole, setNewProvRole] = useState('Guide');
  const [newProvRate, setNewProvRate] = useState(40);

  const [newCarrierName, setNewCarrierName] = useState('');
  const [newCarrierContact, setNewCarrierContact] = useState('');
  const [newCarrierVehicle, setNewCarrierVehicle] = useState('Van');

  const addProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvName) return;
    const nextId = `P${String(providers.length + 1).padStart(3, '0')}`;
    const updated = [...providers, {
      id: nextId,
      name: newProvName,
      phone: newProvPhone,
      role: newProvRole,
      defaultCommissionRate: newProvRate
    }];
    onUpdateProviders(updated);
    setNewProvName('');
    setNewProvPhone('');
    setNewProvRate(40);
  };

  const deleteProvider = (id: string) => {
    if (confirm("Are you sure you want to delete this guide provider?")) {
      onUpdateProviders(providers.filter(p => p.id !== id));
    }
  };

  const addCarrier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCarrierName) return;
    const nextId = `T${String(carriers.length + 1).padStart(3, '0')}`;
    const updated = [...carriers, {
      id: nextId,
      name: newCarrierName,
      contact: newCarrierContact,
      vehicleType: newCarrierVehicle
    }];
    onUpdateCarriers(updated);
    setNewCarrierName('');
    setNewCarrierContact('');
    setNewCarrierVehicle('Van');
  };

  const deleteCarrier = (id: string) => {
    if (confirm("Are you sure you want to delete this carrier transport?")) {
      onUpdateCarriers(carriers.filter(c => c.id !== id));
    }
  };

  // --- 4. CRUD STATES FOR GEOGRAPHY (Cities & Locations) ---
  const [newCityName, setNewCityName] = useState('');
  const [newCityRegion, setNewCityRegion] = useState('');

  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocCityId, setNewLocCityId] = useState(cities[0]?.id || '');

  const addCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName) return;
    const nextId = `C${String(cities.length + 1).padStart(3, '0')}`;
    const updated = [...cities, {
      id: nextId,
      name: newCityName,
      region: newCityRegion
    }];
    onUpdateCities(updated);
    setNewCityName('');
    setNewCityRegion('');
    if (updated.length === 1) {
      setNewLocCityId(updated[0].id);
    }
  };

  const deleteCity = (id: string) => {
    if (confirm("Delete this city? Warning: This removes its rate matrix mapping.")) {
      onUpdateCities(cities.filter(c => c.id !== id));
    }
  };

  const addLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocCityId) return;
    const nextId = `L${String(locations.length + 1).padStart(3, '0')}`;
    const updated = [...locations, {
      id: nextId,
      name: newLocName,
      address: newLocAddress,
      cityId: newLocCityId
    }];
    onUpdateLocations(updated);
    setNewLocName('');
    setNewLocAddress('');
  };

  const deleteLocation = (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      onUpdateLocations(locations.filter(l => l.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-fade-up" id="settings-view-panel">
      
      {/* 1. Header & Side tabs layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary tracking-tight">
            System Data & Matrix Configuration
          </h1>
          <p className="text-xs text-muted font-body mt-1">
            Maintain transport rate indexes, coordinate lookup cities, manage guide margins, and configure local tax guidelines.
          </p>
        </div>

        {/* Sidebar categories tabs */}
        <div className="flex flex-wrap bg-primary/4 p-1 rounded-lg" id="settings-sub-categories">
          <button
            onClick={() => setActiveSec('rate-matrix')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSec === 'rate-matrix' ? 'bg-surface text-primary shadow-sm' : 'text-primary/50 hover:text-primary'
            }`}
          >
            <TableProperties size={13} />
            Transport Matrix
          </button>
          <button
            onClick={() => setActiveSec('partners')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSec === 'partners' ? 'bg-surface text-primary shadow-sm' : 'text-primary/50 hover:text-primary'
            }`}
          >
            <Users size={13} />
            Partners & Guides
          </button>
          <button
            onClick={() => setActiveSec('geography')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSec === 'geography' ? 'bg-surface text-primary shadow-sm' : 'text-primary/50 hover:text-primary'
            }`}
          >
            <MapPin size={13} />
            Hub Geography
          </button>
          <button
            onClick={() => setActiveSec('general')}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSec === 'general' ? 'bg-surface text-primary shadow-sm' : 'text-primary/50 hover:text-primary'
            }`}
          >
            <Settings size={13} />
            General & FX
          </button>
        </div>
      </div>

      {/* 2. Sub-Sections Rendered inside clean containers */}

      {/* --- A. TRANSPORTATION RATE MATRIX GRID EDITOR --- */}
      {activeSec === 'rate-matrix' && (
        <div className="space-y-6 animate-fade-up" id="settings-rate-matrix-section">
          <div className="bg-surface p-6 rounded-lg shadow-md border-t-2 border-accent">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
              <div>
                <h3 className="text-lg font-heading font-bold text-primary tracking-tight">
                  Transportation Rates Matrix Lookup
                </h3>
                <p className="text-xs text-muted font-body mt-0.5">
                  Type rates directly into cells (yellow indicates editable). Any booking referencing these nodes calculates costs instantly.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-primary/4 text-primary px-3 py-1 rounded">EUR Matrix Engine</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse text-left text-xs" id="interactive-rate-matrix">
                <thead>
                  <tr className="bg-primary/4 border-b border-border h-10 uppercase font-bold text-primary text-[10px] tracking-wider">
                    <th className="px-4 py-2 font-semibold">Carrier Company</th>
                    <th className="px-4 py-2 font-semibold">Operating Hub (City)</th>
                    {DURATION_RANGES.map(d => (
                      <th key={d.value} className="px-4 py-2 text-right font-semibold w-36">{d.label} (€)</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-body">
                  {matrixRows.map(({ carrier, city }, idx) => (
                    <tr key={idx} className="hover:bg-primary/2 transition-all h-10">
                      <td className="px-4 font-bold text-primary">{carrier.name}</td>
                      <td className="px-4 text-muted font-medium">{city.name}</td>
                      {DURATION_RANGES.map(range => {
                        const currentVal = getMatrixPrice(carrier.id, city.id, range.value);
                        return (
                          <td key={range.value} className="px-3">
                            <input 
                              type="number" 
                              className="w-full text-right p-1 bg-[#FFFDE7] text-primary font-mono font-bold text-xs border border-transparent rounded focus:border-accent focus:outline-none"
                              value={currentVal || ''}
                              onChange={e => handleMatrixPriceChange(carrier.id, city.id, range.value, Number(e.target.value))}
                              placeholder="0"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {matrixRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted">
                        Please configure at least one Carrier and one Operating City to generate the price matrix rows.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- B. PARTNERS & GUIDES CRUD (Service Guides & Carriers) --- */}
      {activeSec === 'partners' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-up" id="settings-partners-section">
          
          {/* Guides CRUD Card */}
          <div className="bg-surface p-6 rounded-lg shadow-md flex flex-col justify-between min-h-[500px]">
            <div>
              <h3 className="text-lg font-heading font-bold text-primary tracking-tight mb-4 border-b border-border pb-3">
                Field Guide Directory
              </h3>

              {/* Table */}
              <div className="max-h-80 overflow-y-auto mb-6">
                <table className="w-full text-left text-xs" id="settings-providers-crud-table">
                  <thead>
                    <tr className="border-b border-border h-8 font-bold text-primary uppercase">
                      <th className="py-2">ID</th>
                      <th className="py-2">Guide Name</th>
                      <th className="py-2">Service Role</th>
                      <th className="py-2 text-right">Commission</th>
                      <th className="py-2 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {providers.map(p => (
                      <tr key={p.id} className="h-9 hover:bg-bg/50">
                        <td className="font-mono text-[10px] text-muted">{p.id}</td>
                        <td className="font-semibold text-primary">{p.name}</td>
                        <td className="text-muted">{p.role}</td>
                        <td className="text-right font-mono font-bold text-primary">{p.defaultCommissionRate}%</td>
                        <td className="text-center">
                          <button
                            onClick={() => deleteProvider(p.id)}
                            className="text-red-500 hover:text-red-600 p-1 cursor-pointer"
                            title="Remove guide"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={addProvider} className="p-4 bg-primary/4 rounded-md border border-border grid grid-cols-2 gap-3">
              <span className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-primary font-body flex items-center gap-1">
                <Plus size={12} />
                Register New Field Guide
              </span>
              <input 
                type="text" 
                required
                className="text-xs p-2 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                placeholder="Name"
                value={newProvName}
                onChange={e => setNewProvName(e.target.value)}
              />
              <input 
                type="text" 
                className="text-xs p-2 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                placeholder="Phone (optional)"
                value={newProvPhone}
                onChange={e => setNewProvPhone(e.target.value)}
              />
              <input 
                type="text" 
                className="text-xs p-2 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                placeholder="Role (e.g. Lead Guide)"
                value={newProvRole}
                onChange={e => setNewProvRole(e.target.value)}
              />
              <div className="flex items-center gap-1.5">
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  className="text-xs p-2 w-16 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none font-mono font-bold text-center"
                  value={newProvRate}
                  onChange={e => setNewProvRate(Number(e.target.value))}
                />
                <span className="text-[10px] text-muted font-body uppercase font-bold">% Commission</span>
              </div>
              <button
                type="submit"
                className="col-span-2 bg-primary hover:bg-primary/95 text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded shadow-xs btn-pressable cursor-pointer"
              >
                Add Partner to Directory
              </button>
            </form>
          </div>

          {/* Carriers CRUD Card */}
          <div className="bg-surface p-6 rounded-lg shadow-md flex flex-col justify-between min-h-[500px]">
            <div>
              <h3 className="text-lg font-heading font-bold text-primary tracking-tight mb-4 border-b border-border pb-3">
                Transit Fleet Carriers
              </h3>

              {/* Table */}
              <div className="max-h-80 overflow-y-auto mb-6">
                <table className="w-full text-left text-xs" id="settings-carriers-crud-table">
                  <thead>
                    <tr className="border-b border-border h-8 font-bold text-primary uppercase">
                      <th className="py-2">ID</th>
                      <th className="py-2">Carrier Brand</th>
                      <th className="py-2">Dispatch Contact</th>
                      <th className="py-2">Vehicle Specification</th>
                      <th className="py-2 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {carriers.map(c => (
                      <tr key={c.id} className="h-9 hover:bg-bg/50">
                        <td className="font-mono text-[10px] text-muted">{c.id}</td>
                        <td className="font-semibold text-primary">{c.name}</td>
                        <td className="text-muted truncate max-w-[120px]">{c.contact}</td>
                        <td className="text-muted font-medium">{c.vehicleType}</td>
                        <td className="text-center">
                          <button
                            onClick={() => deleteCarrier(c.id)}
                            className="text-red-500 hover:text-red-600 p-1 cursor-pointer"
                            title="Remove carrier"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={addCarrier} className="p-4 bg-primary/4 rounded-md border border-border grid grid-cols-2 gap-3">
              <span className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-primary font-body flex items-center gap-1">
                <Plus size={12} />
                Register New Carrier Team
              </span>
              <input 
                type="text" 
                required
                className="text-xs p-2 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                placeholder="Carrier Brand Name"
                value={newCarrierName}
                onChange={e => setNewCarrierName(e.target.value)}
              />
              <input 
                type="text" 
                className="text-xs p-2 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                placeholder="Contact Details"
                value={newCarrierContact}
                onChange={e => setNewCarrierContact(e.target.value)}
              />
              <input 
                type="text" 
                className="col-span-2 text-xs p-2 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                placeholder="Vehicle Specifications (e.g. Mercedes Sprinter)"
                value={newCarrierVehicle}
                onChange={e => setNewCarrierVehicle(e.target.value)}
              />
              <button
                type="submit"
                className="col-span-2 bg-primary hover:bg-primary/95 text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded shadow-xs btn-pressable cursor-pointer"
              >
                Add Carrier to Fleet
              </button>
            </form>
          </div>

        </div>
      )}

      {/* --- C. GEOGRAPHY & NODES CRUD (Cities & Locations Address DB) --- */}
      {activeSec === 'geography' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-up" id="settings-geography-section">
          
          {/* Cities Card */}
          <div className="bg-surface p-6 rounded-lg shadow-md flex flex-col justify-between min-h-[500px]">
            <div>
              <h3 className="text-lg font-heading font-bold text-primary tracking-tight mb-4 border-b border-border pb-3">
                Operating Cities (Hubs)
              </h3>

              <div className="max-h-80 overflow-y-auto mb-6">
                <table className="w-full text-left text-xs" id="settings-cities-crud-table">
                  <thead>
                    <tr className="border-b border-border h-8 font-bold text-primary uppercase">
                      <th className="py-2 w-16">ID</th>
                      <th className="py-2">Hub City</th>
                      <th className="py-2">Regional Province</th>
                      <th className="py-2 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cities.map(c => (
                      <tr key={c.id} className="h-9 hover:bg-bg/50">
                        <td className="font-mono text-[10px] text-muted">{c.id}</td>
                        <td className="font-semibold text-primary">{c.name}</td>
                        <td className="text-muted">{c.region}</td>
                        <td className="text-center">
                          <button
                            onClick={() => deleteCity(c.id)}
                            className="text-red-500 hover:text-red-600 p-1 cursor-pointer"
                            title="Remove city"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={addCity} className="p-4 bg-primary/4 rounded-md border border-border grid grid-cols-2 gap-3">
              <span className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-primary font-body flex items-center gap-1">
                <Plus size={12} />
                Register New Operating City
              </span>
              <input 
                type="text" 
                required
                className="text-xs p-2 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                placeholder="Hub City Name"
                value={newCityName}
                onChange={e => setNewCityName(e.target.value)}
              />
              <input 
                type="text" 
                className="text-xs p-2 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                placeholder="Region (e.g. Tuscany)"
                value={newCityRegion}
                onChange={e => setNewCityRegion(e.target.value)}
              />
              <button
                type="submit"
                className="col-span-2 bg-primary hover:bg-primary/95 text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded shadow-xs btn-pressable cursor-pointer"
              >
                Register City Hub
              </button>
            </form>
          </div>

          {/* Locations Card */}
          <div className="bg-surface p-6 rounded-lg shadow-md flex flex-col justify-between min-h-[500px]">
            <div>
              <h3 className="text-lg font-heading font-bold text-primary tracking-tight mb-4 border-b border-border pb-3">
                Address Lookup Node Library
              </h3>

              <div className="max-h-80 overflow-y-auto mb-6">
                <table className="w-full text-left text-xs" id="settings-locations-crud-table">
                  <thead>
                    <tr className="border-b border-border h-8 font-bold text-primary uppercase">
                      <th className="py-2 w-16">ID</th>
                      <th className="py-2">Node Name</th>
                      <th className="py-2">City</th>
                      <th className="py-2 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {locations.map(l => {
                      const city = cities.find(c => c.id === l.cityId);
                      return (
                        <tr key={l.id} className="h-9 hover:bg-bg/50">
                          <td className="font-mono text-[10px] text-muted">{l.id}</td>
                          <td className="font-semibold text-primary">
                            <div>{l.name}</div>
                            <div className="text-[10px] text-muted truncate max-w-[200px]">{l.address}</div>
                          </td>
                          <td className="text-muted">{city?.name || 'Unknown'}</td>
                          <td className="text-center">
                            <button
                              onClick={() => deleteLocation(l.id)}
                              className="text-red-500 hover:text-red-600 p-1 cursor-pointer"
                              title="Remove node"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={addLocation} className="p-4 bg-primary/4 rounded-md border border-border grid grid-cols-2 gap-3">
              <span className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-primary font-body flex items-center gap-1">
                <Plus size={12} />
                Register New Node Address
              </span>
              <input 
                type="text" 
                required
                className="text-xs p-2 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                placeholder="Address Node Name"
                value={newLocName}
                onChange={e => setNewLocName(e.target.value)}
              />
              <select
                className="text-xs p-2 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                value={newLocCityId}
                onChange={e => setNewLocCityId(e.target.value)}
              >
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input 
                type="text" 
                className="col-span-2 text-xs p-2 bg-[#FFFDE7] text-primary border border-border rounded focus:outline-none"
                placeholder="Full Street Address"
                value={newLocAddress}
                onChange={e => setNewLocAddress(e.target.value)}
              />
              <button
                type="submit"
                className="col-span-2 bg-primary hover:bg-primary/95 text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded shadow-xs btn-pressable cursor-pointer"
              >
                Register Address Node
              </button>
            </form>
          </div>

        </div>
      )}

      {/* --- D. GENERAL & FX MULTIPLIER CONFIG --- */}
      {activeSec === 'general' && (
        <div className="space-y-6 animate-fade-up" id="settings-general-section">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* General Settings Box */}
            <div className="bg-surface p-6 rounded-lg shadow-md flex flex-col justify-between border-t-2 border-primary">
              <div>
                <h3 className="text-lg font-heading font-bold text-primary tracking-tight mb-1">
                  Corporate Configurations
                </h3>
                <p className="text-xs text-muted mb-6">Set base parameters that dictate legal structures and financial metrics.</p>

                <div className="space-y-4 text-xs font-body">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Company Brand Name</label>
                    <input 
                      type="text" 
                      className="w-full text-xs p-2.5 bg-[#FFFDE7] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">VAT / Tax Rate (%)</label>
                    <input 
                      type="number" 
                      className="w-full text-xs p-2.5 bg-[#FFFDE7] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent font-mono font-bold"
                      value={taxRate}
                      onChange={e => setTaxRate(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-primary font-body">Base Operating Currency</label>
                    <input 
                      type="text" 
                      disabled
                      className="w-full text-xs p-2.5 bg-primary/4 border border-border rounded-md text-primary/60 font-mono font-bold"
                      value={`${settings.baseCurrency} (Euro Area Standard)`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-border">
                <button
                  onClick={saveGeneralSettings}
                  className="w-full bg-accent hover:bg-accent/90 text-white text-xs font-bold uppercase tracking-wider py-3 rounded shadow-sm btn-pressable cursor-pointer"
                >
                  Apply Core Configurations
                </button>
              </div>
            </div>

            {/* Currency Multipliers Box */}
            <div className="bg-surface p-6 rounded-lg shadow-md border-t-2 border-accent">
              <h3 className="text-lg font-heading font-bold text-primary tracking-tight mb-1">
                Global FX Exchange Multipliers
              </h3>
              <p className="text-xs text-muted mb-6">Modify currency values relative to 1 base EUR. Feeds real-time pricing indicators.</p>

              <div className="space-y-4" id="currency-fx-controls">
                {fxRates.map((fx, idx) => (
                  <div key={fx.code} className="flex justify-between items-center p-3 bg-bg rounded border border-border">
                    <div>
                      <span className="font-bold text-primary text-xs">{fx.code}</span>
                      <span className="text-[10px] text-muted block">{fx.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">1 EUR =</span>
                      <input 
                        type="number" 
                        step="0.001"
                        className="text-xs p-2 w-24 bg-[#FFFDE7] font-mono font-bold text-right border border-border rounded focus:outline-none"
                        value={fx.rate}
                        onChange={e => handleFxRateChange(idx, Number(e.target.value))}
                      />
                      <span className="text-xs font-mono font-bold text-primary">{fx.code}</span>
                    </div>
                  </div>
                ))}

                <div className="p-4 bg-accent/4 rounded-md border-l-2 border-accent text-xs">
                  <span className="font-bold text-primary block mb-1">Spreadsheet Calculation Notice</span>
                  <p className="text-muted leading-relaxed">
                    Internal calculation engines run exclusively in base EUR to prevent roundoff distortions. Multipliers are applied as translation layers on reporting displays.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
