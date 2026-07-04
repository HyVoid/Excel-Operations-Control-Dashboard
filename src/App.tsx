import React, { useState, useEffect, useRef } from 'react';
import {
  Booking,
  City,
  Provider,
  Carrier,
  Location,
  RateMatrixEntry,
  AppSettings,
  INITIAL_CITIES,
  INITIAL_PROVIDERS,
  INITIAL_CARRIERS,
  INITIAL_LOCATIONS,
  INITIAL_RATE_MATRIX,
  INITIAL_BOOKINGS,
  INITIAL_SETTINGS
} from './types';
import { DashboardView } from './components/DashboardView';
import { MasterLedgerView } from './components/MasterLedgerView';
import { CashControlView } from './components/CashControlView';
import { SettlementsView } from './components/SettlementsView';
import { SettingsView } from './components/SettingsView';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  TrendingUp, 
  FileSpreadsheet, 
  Wallet, 
  Handshake, 
  SlidersHorizontal,
  CloudLightning
} from 'lucide-react';

type TabType = 'dashboard' | 'ledger' | 'cash' | 'settlements' | 'settings';

export default function App() {
  // 1. Core State Hooks
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [rateMatrix, setRateMatrix] = useState<RateMatrixEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Last Saved status state
  const [lastSaved, setLastSaved] = useState<string>('');
  
  // File input ref for backup import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. Initialization effect (load from local storage if existing)
  useEffect(() => {
    try {
      const storedBookings = localStorage.getItem('xl_bookings');
      const storedCities = localStorage.getItem('xl_cities');
      const storedProviders = localStorage.getItem('xl_providers');
      const storedCarriers = localStorage.getItem('xl_carriers');
      const storedLocations = localStorage.getItem('xl_locations');
      const storedRateMatrix = localStorage.getItem('xl_rateMatrix');
      const storedSettings = localStorage.getItem('xl_settings');
      const storedLastSaved = localStorage.getItem('xl_lastSaved');

      if (storedBookings) setBookings(JSON.parse(storedBookings));
      else setBookings(INITIAL_BOOKINGS);

      if (storedCities) setCities(JSON.parse(storedCities));
      else setCities(INITIAL_CITIES);

      if (storedProviders) setProviders(JSON.parse(storedProviders));
      else setProviders(INITIAL_PROVIDERS);

      if (storedCarriers) setCarriers(JSON.parse(storedCarriers));
      else setCarriers(INITIAL_CARRIERS);

      if (storedLocations) setLocations(JSON.parse(storedLocations));
      else setLocations(INITIAL_LOCATIONS);

      if (storedRateMatrix) setRateMatrix(JSON.parse(storedRateMatrix));
      else setRateMatrix(INITIAL_RATE_MATRIX);

      if (storedSettings) setSettings(JSON.parse(storedSettings));
      else setSettings(INITIAL_SETTINGS);

      if (storedLastSaved) setLastSaved(storedLastSaved);
      else setLastSaved(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Error reading from local storage, fallback to seed data:", e);
      loadSeedData();
    }
  }, []);

  // 3. Auto-Save effect when states update
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    try {
      localStorage.setItem('xl_bookings', JSON.stringify(bookings));
      localStorage.setItem('xl_cities', JSON.stringify(cities));
      localStorage.setItem('xl_providers', JSON.stringify(providers));
      localStorage.setItem('xl_carriers', JSON.stringify(carriers));
      localStorage.setItem('xl_locations', JSON.stringify(locations));
      localStorage.setItem('xl_rateMatrix', JSON.stringify(rateMatrix));
      localStorage.setItem('xl_settings', JSON.stringify(settings));
      
      const timeStr = new Date().toLocaleTimeString();
      localStorage.setItem('xl_lastSaved', timeStr);
      setLastSaved(timeStr);
    } catch (e) {
      console.error("Error saving to local storage:", e);
    }
  }, [bookings, cities, providers, carriers, locations, rateMatrix, settings]);

  // Load Seed Data
  const loadSeedData = () => {
    setBookings(INITIAL_BOOKINGS);
    setCities(INITIAL_CITIES);
    setProviders(INITIAL_PROVIDERS);
    setCarriers(INITIAL_CARRIERS);
    setLocations(INITIAL_LOCATIONS);
    setRateMatrix(INITIAL_RATE_MATRIX);
    setSettings(INITIAL_SETTINGS);
    
    const timeStr = new Date().toLocaleTimeString();
    localStorage.setItem('xl_lastSaved', timeStr);
    setLastSaved(timeStr);
  };

  // 4. Export Backup
  const handleExportBackup = () => {
    const backupObj = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      bookings,
      cities,
      providers,
      carriers,
      locations,
      rateMatrix,
      settings
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `xl_control_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 5. Import Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Basic schema verification
        if (json.bookings && json.cities && json.providers && json.carriers && json.locations && json.rateMatrix && json.settings) {
          setBookings(json.bookings);
          setCities(json.cities);
          setProviders(json.providers);
          setCarriers(json.carriers);
          setLocations(json.locations);
          setRateMatrix(json.rateMatrix);
          setSettings(json.settings);
          alert("Backup database imported and loaded successfully!");
        } else {
          alert("Invalid backup file format. Missing core datasets.");
        }
      } catch (err) {
        console.error(err);
        alert("Error parsing backup JSON file. Make sure it is a valid backup.");
      }
    };
    reader.readAsText(file);
    // Reset file input value
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 6. Reset Data
  const handleResetData = () => {
    if (confirm("Reset Workbook to initial seed data? All custom entries and rates will be overwritten.")) {
      loadSeedData();
    }
  };

  return (
    <div className="min-h-screen bg-bg text-body-text flex flex-col font-body">
      
      {/* 56px sticky top Horizontal Navigation bar */}
      <header className="sticky top-0 z-50 h-14 bg-surface border-b border-border shadow-nav flex items-center justify-between px-10" id="global-navbar">
        {/* Brand identity logo */}
        <div className="flex items-center gap-3">
          <Database size={18} className="text-primary" />
          <span className="font-heading font-bold text-lg text-primary tracking-tight">
            {settings.companyName}
          </span>
        </div>

        {/* Tab switcher buttons */}
        <nav className="flex items-center h-full space-x-6 text-xs font-semibold uppercase tracking-wider" id="navbar-tab-switchers">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 h-full border-b-2 px-1 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-primary/65 hover:text-primary'
            }`}
          >
            <TrendingUp size={13} />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-1.5 h-full border-b-2 px-1 transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-primary/65 hover:text-primary'
            }`}
          >
            <FileSpreadsheet size={13} />
            Master Ledger
          </button>

          <button
            onClick={() => setActiveTab('cash')}
            className={`flex items-center gap-1.5 h-full border-b-2 px-1 transition-all cursor-pointer ${
              activeTab === 'cash'
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-primary/65 hover:text-primary'
            }`}
          >
            <Wallet size={13} />
            Cash Flow
          </button>

          <button
            onClick={() => setActiveTab('settlements')}
            className={`flex items-center gap-1.5 h-full border-b-2 px-1 transition-all cursor-pointer ${
              activeTab === 'settlements'
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-primary/65 hover:text-primary'
            }`}
          >
            <Handshake size={13} />
            Settlement Desk
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 h-full border-b-2 px-1 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-primary/65 hover:text-primary'
            }`}
          >
            <SlidersHorizontal size={13} />
            Master Data
          </button>
        </nav>

        {/* Action Controls and Sync Info (Last Saved, Backup, Export, Import) */}
        <div className="flex items-center gap-4 text-[11px]" id="navbar-action-controls">
          {/* Last Saved (SaaS visual necessity) */}
          <div className="hidden lg:flex items-center gap-1 text-muted font-medium">
            <CloudLightning size={12} className="text-emerald-500 animate-pulse" />
            <span>Last saved: <span className="font-mono text-primary font-bold" id="saved-timestamp-text">{lastSaved || 'Just now'}</span></span>
          </div>

          <div className="h-4 w-[1px] bg-border hidden lg:block" />

          {/* Backup & utility controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1 bg-primary/4 hover:bg-primary/8 text-primary font-bold px-2.5 py-1.5 rounded cursor-pointer transition-colors"
              title="Export backup as JSON"
              id="btn-export-backup"
            >
              <Download size={11} />
              Export Backup
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 bg-primary/4 hover:bg-primary/8 text-primary font-bold px-2.5 py-1.5 rounded cursor-pointer transition-colors"
              title="Import database from JSON backup"
              id="btn-import-backup"
            >
              <Upload size={11} />
              Import
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImportBackup}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={handleResetData}
              className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1.5 rounded cursor-pointer transition-colors"
              title="Wipe database and restore initial seed data"
              id="btn-reset-data"
            >
              <RotateCcw size={11} />
              Reset Data
            </button>
          </div>
        </div>
      </header>

      {/* Main SaaS Content Area (centered, max width 1400px, 40px left/right padding) */}
      <main className="w-full max-w-[1400px] mx-auto px-10 py-10 flex-1 flex flex-col justify-start">
        
        {/* Render Active View Tab with fadeUp entry animation */}
        <div className="w-full animate-fade-up" key={activeTab}>
          {activeTab === 'dashboard' && (
            <DashboardView 
              bookings={bookings}
              cities={cities}
              providers={providers}
              carriers={carriers}
              rateMatrix={rateMatrix}
            />
          )}

          {activeTab === 'ledger' && (
            <MasterLedgerView 
              bookings={bookings}
              cities={cities}
              providers={providers}
              carriers={carriers}
              locations={locations}
              rateMatrix={rateMatrix}
              onAddBooking={(b) => setBookings(prev => [b, ...prev])}
              onUpdateBooking={(b) => setBookings(prev => prev.map(item => item.id === b.id ? b : item))}
              onDeleteBooking={(id) => setBookings(prev => prev.filter(item => item.id !== id))}
            />
          )}

          {activeTab === 'cash' && (
            <CashControlView 
              bookings={bookings}
              cities={cities}
              providers={providers}
              carriers={carriers}
              rateMatrix={rateMatrix}
              onUpdateBooking={(b) => setBookings(prev => prev.map(item => item.id === b.id ? b : item))}
            />
          )}

          {activeTab === 'settlements' && (
            <SettlementsView 
              bookings={bookings}
              cities={cities}
              providers={providers}
              carriers={carriers}
              rateMatrix={rateMatrix}
              onUpdateBooking={(b) => setBookings(prev => prev.map(item => item.id === b.id ? b : item))}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              settings={settings}
              cities={cities}
              providers={providers}
              carriers={carriers}
              locations={locations}
              rateMatrix={rateMatrix}
              onUpdateSettings={setSettings}
              onUpdateCities={setCities}
              onUpdateProviders={setProviders}
              onUpdateCarriers={setCarriers}
              onUpdateLocations={setLocations}
              onUpdateRateMatrix={setRateMatrix}
            />
          )}
        </div>

      </main>

      {/* Footer Branding */}
      <footer className="py-6 border-t border-border text-center text-[11px] text-muted font-body">
        <p>© 2026 {settings.companyName} Operational Workspace. All calculations run strictly client-side.</p>
      </footer>

    </div>
  );
}
