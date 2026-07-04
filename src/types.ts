export interface City {
  id: string;
  name: string;
  region: string;
}

export interface Provider {
  id: string;
  name: string;
  phone: string;
  role: string;
  defaultCommissionRate: number; // in percentage, e.g. 40
}

export interface Carrier {
  id: string;
  name: string;
  contact: string;
  vehicleType: string;
}

export interface RateMatrixEntry {
  id: string; // carrierId_cityId_durationRange
  carrierId: string;
  cityId: string;
  durationRange: '0-4h' | '4-8h' | '8-12h' | '12-24h';
  price: number;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  cityId: string;
}

export type PaymentStatus = 'Unpaid' | 'Paid (Cash)' | 'Paid (Bank Transfer)';
export type CashHolder = 'Customer' | 'Carrier' | 'Provider 1' | 'Provider 2' | 'Company Admin';
export type HandoverStatus = 'Unsubmitted' | 'Submitted to Company' | 'Verified';
export type SettlementStatus = 'Unsettled' | 'Settled';

export interface Booking {
  id: string; // Booking ID: B001, B002 etc
  date: string; // YYYY-MM-DD
  customerName: string;
  cityId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  provider1Id: string;
  provider2Id: string | null;
  serviceBaseFee: number;
  extraServiceFees: number;
  carrierId: string;
  transportDurationHours: number;
  transportCustomPrice: number | null; // Null means use Rate Matrix lookup
  customerPaymentStatus: PaymentStatus;
  cashHolder: CashHolder;
  cashHandoverStatus: HandoverStatus;
  provider1SettlementStatus: SettlementStatus;
  provider2SettlementStatus: SettlementStatus;
  carrierSettlementStatus: SettlementStatus;
}

export interface FXRate {
  code: string;
  rate: number; // 1 Base (e.g. EUR) = X Local
  description: string;
}

export interface AppSettings {
  companyName: string;
  baseCurrency: string;
  taxRatePercent: number;
  fxRates: FXRate[];
}

// Pre-defined values for Duration Ranges
export const DURATION_RANGES = [
  { value: '0-4h', label: '0-4 Hours' },
  { value: '4-8h', label: '4-8 Hours' },
  { value: '8-12h', label: '8-12 Hours' },
  { value: '12-24h', label: '12-24 Hours' }
] as const;

// Helper to determine duration bracket
export function getDurationBracket(hours: number): '0-4h' | '4-8h' | '8-12h' | '12-24h' {
  if (hours <= 4) return '0-4h';
  if (hours <= 8) return '4-8h';
  if (hours <= 12) return '8-12h';
  return '12-24h';
}

// Initial Seed Data
export const INITIAL_CITIES: City[] = [
  { id: 'C001', name: 'Rome', region: 'Lazio' },
  { id: 'C002', name: 'Milan', region: 'Lombardy' },
  { id: 'C003', name: 'Venice', region: 'Veneto' },
  { id: 'C004', name: 'Florence', region: 'Tuscany' }
];

export const INITIAL_PROVIDERS: Provider[] = [
  { id: 'P001', name: 'Marco Rossi', phone: '+39 333 112233', role: 'Lead Guide', defaultCommissionRate: 40 },
  { id: 'P002', name: 'Sofia Bianchi', phone: '+39 333 445566', role: 'Assistant Coordinator', defaultCommissionRate: 45 },
  { id: 'P003', name: 'Alessandro Verdi', phone: '+39 333 778899', role: 'Vocalist & Host', defaultCommissionRate: 40 }
];

export const INITIAL_CARRIERS: Carrier[] = [
  { id: 'T001', name: 'FastCargo', contact: 'Luca +39 340 123456', vehicleType: 'Luxury Van' },
  { id: 'T002', name: 'EcoShuttle', contact: 'Elena +39 340 987654', vehicleType: 'Tesla Model X' }
];

export const INITIAL_LOCATIONS: Location[] = [
  { id: 'L001', name: 'Fiumicino Airport (FCO)', address: 'Rome Airport, Terminal 3', cityId: 'C001' },
  { id: 'L002', name: 'Termini Central Station', address: 'Piazza dei Cinquecento, Rome', cityId: 'C001' },
  { id: 'L003', name: 'Duomo Square Hotel', address: 'Piazza del Duomo, Milan', cityId: 'C002' },
  { id: 'L004', name: 'Grand Canal Dock', address: 'Piazzale Roma, Venice', cityId: 'C003' },
  { id: 'L005', name: 'Santa Maria Novella Station', address: 'Piazza della Stazione, Florence', cityId: 'C004' }
];

export const INITIAL_RATE_MATRIX: RateMatrixEntry[] = [
  // FastCargo (T001) rates
  { id: 'T001_C001_0-4h', carrierId: 'T001', cityId: 'C001', durationRange: '0-4h', price: 150 },
  { id: 'T001_C001_4-8h', carrierId: 'T001', cityId: 'C001', durationRange: '4-8h', price: 280 },
  { id: 'T001_C001_8-12h', carrierId: 'T001', cityId: 'C001', durationRange: '8-12h', price: 400 },
  { id: 'T001_C001_12-24h', carrierId: 'T001', cityId: 'C001', durationRange: '12-24h', price: 600 },

  { id: 'T001_C002_0-4h', carrierId: 'T001', cityId: 'C002', durationRange: '0-4h', price: 180 },
  { id: 'T001_C002_4-8h', carrierId: 'T001', cityId: 'C002', durationRange: '4-8h', price: 320 },
  { id: 'T001_C002_8-12h', carrierId: 'T001', cityId: 'C002', durationRange: '8-12h', price: 450 },
  { id: 'T001_C002_12-24h', carrierId: 'T001', cityId: 'C002', durationRange: '12-24h', price: 700 },

  { id: 'T001_C003_0-4h', carrierId: 'T001', cityId: 'C003', durationRange: '0-4h', price: 200 },
  { id: 'T001_C003_4-8h', carrierId: 'T001', cityId: 'C003', durationRange: '4-8h', price: 360 },
  { id: 'T001_C003_8-12h', carrierId: 'T001', cityId: 'C003', durationRange: '8-12h', price: 500 },
  { id: 'T001_C003_12-24h', carrierId: 'T001', cityId: 'C003', durationRange: '12-24h', price: 800 },

  { id: 'T001_C004_0-4h', carrierId: 'T001', cityId: 'C004', durationRange: '0-4h', price: 160 },
  { id: 'T001_C004_4-8h', carrierId: 'T001', cityId: 'C004', durationRange: '4-8h', price: 300 },
  { id: 'T001_C004_8-12h', carrierId: 'T001', cityId: 'C004', durationRange: '8-12h', price: 420 },
  { id: 'T001_C004_12-24h', carrierId: 'T001', cityId: 'C004', durationRange: '12-24h', price: 650 },

  // EcoShuttle (T002) rates
  { id: 'T002_C001_0-4h', carrierId: 'T002', cityId: 'C001', durationRange: '0-4h', price: 120 },
  { id: 'T002_C001_4-8h', carrierId: 'T002', cityId: 'C001', durationRange: '4-8h', price: 220 },
  { id: 'T002_C001_8-12h', carrierId: 'T002', cityId: 'C001', durationRange: '8-12h', price: 350 },
  { id: 'T002_C001_12-24h', carrierId: 'T002', cityId: 'C001', durationRange: '12-24h', price: 500 },

  { id: 'T002_C002_0-4h', carrierId: 'T002', cityId: 'C002', durationRange: '0-4h', price: 140 },
  { id: 'T002_C002_4-8h', carrierId: 'T002', cityId: 'C002', durationRange: '4-8h', price: 250 },
  { id: 'T002_C002_8-12h', carrierId: 'T002', cityId: 'C002', durationRange: '8-12h', price: 380 },
  { id: 'T002_C002_12-24h', carrierId: 'T002', cityId: 'C002', durationRange: '12-24h', price: 550 }
];

export const INITIAL_SETTINGS: AppSettings = {
  companyName: "Nexus Elite Operations",
  baseCurrency: "EUR",
  taxRatePercent: 22,
  fxRates: [
    { code: "USD", rate: 1.09, description: "US Dollar" },
    { code: "GBP", rate: 0.84, description: "British Pound" },
    { code: "CHF", rate: 0.96, description: "Swiss Franc" }
  ]
};

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'B001',
    date: '2026-07-01',
    customerName: 'AeroTech Systems Inc.',
    cityId: 'C001', // Rome
    pickupLocationId: 'L001', // Fiumicino Airport
    dropoffLocationId: 'L002', // Termini Station
    provider1Id: 'P001', // Marco Rossi
    provider2Id: 'P002', // Sofia Bianchi (dual support)
    serviceBaseFee: 850,
    extraServiceFees: 150,
    carrierId: 'T001', // FastCargo
    transportDurationHours: 3, // -> Bracket 0-4h -> Rate: Rome, FastCargo, 0-4h = $150
    transportCustomPrice: null, // automatic lookup
    customerPaymentStatus: 'Paid (Cash)',
    cashHolder: 'Provider 1', // Marco Rossi holds it
    cashHandoverStatus: 'Unsubmitted', // Not yet given to company
    provider1SettlementStatus: 'Unsettled',
    provider2SettlementStatus: 'Unsettled',
    carrierSettlementStatus: 'Unsettled'
  },
  {
    id: 'B002',
    date: '2026-07-02',
    customerName: 'Milano Fashion Week Group',
    cityId: 'C002', // Milan
    pickupLocationId: 'L003', // Duomo Square Hotel
    dropoffLocationId: 'L003', // Local tour
    provider1Id: 'P002', // Sofia Bianchi
    provider2Id: null,
    serviceBaseFee: 1200,
    extraServiceFees: 300,
    carrierId: 'T002', // EcoShuttle
    transportDurationHours: 6, // -> Bracket 4-8h -> Rate: Milan, EcoShuttle, 4-8h = $250
    transportCustomPrice: null,
    customerPaymentStatus: 'Paid (Cash)',
    cashHolder: 'Company Admin', // Money already on-board
    cashHandoverStatus: 'Verified',
    provider1SettlementStatus: 'Settled',
    provider2SettlementStatus: 'Unsettled',
    carrierSettlementStatus: 'Settled'
  },
  {
    id: 'B003',
    date: '2026-07-02',
    customerName: 'Venice Canal Film Crew',
    cityId: 'C003', // Venice
    pickupLocationId: 'L004', // Grand Canal Dock
    dropoffLocationId: 'L004',
    provider1Id: 'P003', // Alessandro Verdi
    provider2Id: null,
    serviceBaseFee: 1800,
    extraServiceFees: 450,
    carrierId: 'T001', // FastCargo
    transportDurationHours: 14, // -> Bracket 12-24h -> Rate: Venice, FastCargo, 12-24h = $800
    transportCustomPrice: 750, // Manual Override!
    customerPaymentStatus: 'Paid (Bank Transfer)',
    cashHolder: 'Company Admin',
    cashHandoverStatus: 'Verified',
    provider1SettlementStatus: 'Unsettled',
    provider2SettlementStatus: 'Unsettled',
    carrierSettlementStatus: 'Unsettled'
  },
  {
    id: 'B004',
    date: '2026-07-03',
    customerName: 'Tuscany Estates Corp',
    cityId: 'C004', // Florence
    pickupLocationId: 'L005', // SMN Station
    dropoffLocationId: 'L005',
    provider1Id: 'P001', // Marco Rossi
    provider2Id: null,
    serviceBaseFee: 650,
    extraServiceFees: 50,
    carrierId: 'T001', // FastCargo
    transportDurationHours: 5, // -> Bracket 4-8h -> Rate: Florence, FastCargo, 4-8h = $300
    transportCustomPrice: null,
    customerPaymentStatus: 'Unpaid',
    cashHolder: 'Customer',
    cashHandoverStatus: 'Unsubmitted',
    provider1SettlementStatus: 'Unsettled',
    provider2SettlementStatus: 'Unsettled',
    carrierSettlementStatus: 'Unsettled'
  },
  {
    id: 'B005',
    date: '2026-07-03',
    customerName: 'Roma Historical Tours',
    cityId: 'C001', // Rome
    pickupLocationId: 'L002', // Termini Station
    dropoffLocationId: 'L001', // Fiumicino Airport
    provider1Id: 'P003', // Alessandro Verdi
    provider2Id: null,
    serviceBaseFee: 400,
    extraServiceFees: 0,
    carrierId: 'T002', // EcoShuttle
    transportDurationHours: 2, // -> Bracket 0-4h -> Rate: Rome, EcoShuttle, 0-4h = $120
    transportCustomPrice: null,
    customerPaymentStatus: 'Paid (Cash)',
    cashHolder: 'Carrier', // Driver holds cash
    cashHandoverStatus: 'Submitted to Company', // Submitted, but not yet verified by Company Admin
    provider1SettlementStatus: 'Unsettled',
    provider2SettlementStatus: 'Unsettled',
    carrierSettlementStatus: 'Unsettled'
  }
];
