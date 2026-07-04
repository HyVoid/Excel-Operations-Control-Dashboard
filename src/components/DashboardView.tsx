import React, { useMemo } from 'react';
import { Booking, City, Provider, Carrier, RateMatrixEntry } from '../types';
import { TrendingUp, DollarSign, Wallet, ShieldAlert, Award, Truck } from 'lucide-react';

interface DashboardViewProps {
  bookings: Booking[];
  cities: City[];
  providers: Provider[];
  carriers: Carrier[];
  rateMatrix: RateMatrixEntry[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bookings,
  cities,
  providers,
  carriers,
  rateMatrix
}) => {
  // 1. Calculate rate for a booking using Rate Matrix or custom price
  const getBookingTransportCost = (booking: Booking): number => {
    if (booking.transportCustomPrice !== null) {
      return booking.transportCustomPrice;
    }
    // Rate Matrix lookup
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

  const dashboardData = useMemo(() => {
    let totalRevenue = 0;
    let totalProviderCost = 0;
    let totalTransportCost = 0;
    let totalProfit = 0;

    let unsettledCarrierAmount = 0;
    let unsettledProviderAmount = 0;

    let totalCashHeldByAdmin = 0;
    let totalCashHeldByPartners = 0; // Risk cash (not yet with Company Admin or unsubmitted)

    const cityStats: { [cityId: string]: { name: string; revenue: number; profit: number; count: number } } = {};
    cities.forEach(c => {
      cityStats[c.id] = { name: c.name, revenue: 0, profit: 0, count: 0 };
    });

    bookings.forEach(b => {
      const transCost = getBookingTransportCost(b);
      const bookingRevenue = b.serviceBaseFee + b.extraServiceFees + transCost;

      // Provider 1 cost
      const p1 = providers.find(p => p.id === b.provider1Id);
      const commission1 = p1 ? (b.serviceBaseFee * p1.defaultCommissionRate) / 100 : 0;
      
      // Provider 2 cost (if any)
      const p2 = b.provider2Id ? providers.find(p => p.id === b.provider2Id) : null;
      const commission2 = p2 ? (b.serviceBaseFee * p2.defaultCommissionRate) / 100 : 0;
      
      const providerCost = commission1 + commission2;
      const profit = bookingRevenue - providerCost - transCost;

      totalRevenue += bookingRevenue;
      totalProviderCost += providerCost;
      totalTransportCost += transCost;
      totalProfit += profit;

      // Settlements
      if (b.carrierSettlementStatus === 'Unsettled') {
        unsettledCarrierAmount += transCost;
      }
      if (b.provider1SettlementStatus === 'Unsettled') {
        unsettledProviderAmount += commission1;
      }
      if (b.provider2SettlementStatus === 'Unsettled' && commission2 > 0) {
        unsettledProviderAmount += commission2;
      }

      // Cash Responsibility
      if (b.customerPaymentStatus === 'Paid (Cash)') {
        if (b.cashHolder === 'Company Admin' && b.cashHandoverStatus === 'Verified') {
          totalCashHeldByAdmin += bookingRevenue;
        } else {
          totalCashHeldByPartners += bookingRevenue;
        }
      } else if (b.customerPaymentStatus === 'Unpaid') {
        totalCashHeldByPartners += bookingRevenue; // Accounts Receivable (risk)
      } else {
        // Bank transfer goes straight to admin bank
        totalCashHeldByAdmin += bookingRevenue;
      }

      // City analytics
      if (cityStats[b.cityId]) {
        cityStats[b.cityId].revenue += bookingRevenue;
        cityStats[b.cityId].profit += profit;
        cityStats[b.cityId].count += 1;
      }
    });

    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const cashRiskRatio = totalRevenue > 0 ? (totalCashHeldByPartners / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCosts: totalProviderCost + totalTransportCost,
      totalProfit,
      averageMargin,
      totalLiabilities: unsettledCarrierAmount + unsettledProviderAmount,
      totalCashHeldByAdmin,
      totalCashHeldByPartners,
      cashRiskRatio,
      cityStats: Object.values(cityStats).sort((a, b) => b.revenue - a.revenue)
    };
  }, [bookings, cities, providers, carriers, rateMatrix]);

  // Generate clean inline data bars
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  // Recommendations and logic insights (Apple style left-accent board)
  const insights = useMemo(() => {
    const list: { title: string; desc: string; isWarning: boolean }[] = [];
    if (dashboardData.cashRiskRatio > 35) {
      list.push({
        title: "High Cash Exposure Risk Detected",
        desc: `Currently, ${formatCurrency(dashboardData.totalCashHeldByPartners)} (${dashboardData.cashRiskRatio.toFixed(1)}% of total revenue) is held outside of Company accounts. Implement immediate cash audits on outstanding handovers.`,
        isWarning: true
      });
    } else {
      list.push({
        title: "Cash Position Stable",
        desc: `Cash on board or verified makes up over 65% of total bookings. Handover workflows are operating within normal tolerances.`,
        isWarning: false
      });
    }

    if (dashboardData.averageMargin < 30) {
      list.push({
        title: "Margin Warning",
        desc: `Average gross margin is at ${dashboardData.averageMargin.toFixed(1)}%, which is below the strategic target of 35%. Examine high transportation costs or provider commisson rates.`,
        isWarning: true
      });
    } else {
      list.push({
        title: "Healthy Operational Margin",
        desc: `Average margin of ${dashboardData.averageMargin.toFixed(1)}% indicates strong booking pricing and efficient transport routing.`,
        isWarning: false
      });
    }

    // Best City
    const topCity = dashboardData.cityStats[0];
    if (topCity && topCity.revenue > 0) {
      list.push({
        title: `Strategic Focus: ${topCity.name} Hub`,
        desc: `${topCity.name} represents your top city, generating ${formatCurrency(topCity.revenue)} (${((topCity.revenue / (dashboardData.totalRevenue || 1)) * 100).toFixed(0)}% of revenue) with a margin of ${topCity.revenue > 0 ? ((topCity.profit / topCity.revenue) * 100).toFixed(0) : 0}%.`,
        isWarning: false
      });
    }

    return list;
  }, [dashboardData]);

  // Max revenue for scaling SVG charts
  const maxCityRevenue = useMemo(() => {
    return Math.max(...dashboardData.cityStats.map(c => c.revenue), 1000);
  }, [dashboardData.cityStats]);

  return (
    <div className="space-y-8 animate-fade-up" id="dashboard-tab-view">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary tracking-tight" id="dashboard-title">
            Executive Control Cockpit
          </h1>
          <p className="text-xs text-muted font-body mt-1">
            Real-time business intelligence computed over operational bookings.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-muted">
            REPORTING CYCLE: CURRENT MONTH
          </span>
        </div>
      </div>

      {/* 2. KPI Cards Row (EB Garamond for values, negative tracking, no border shadows) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="dashboard-kpis">
        
        {/* KPI 1: Gross Revenue */}
        <div className="interactive-card p-6 flex flex-col justify-between h-36 bg-surface" id="kpi-revenue">
          <div className="flex justify-between items-center text-muted">
            <span className="text-xs font-semibold tracking-wider uppercase font-body">Gross Revenue</span>
            <DollarSign size={16} className="text-accent" />
          </div>
          <div>
            <div className="text-3xl font-heading font-bold tracking-[-0.03em] text-primary">
              {formatCurrency(dashboardData.totalRevenue)}
            </div>
            <span className="text-xs text-muted mt-1 inline-block">
              Total customer billable service & transit
            </span>
          </div>
        </div>

        {/* KPI 2: gross profit */}
        <div className="interactive-card p-6 flex flex-col justify-between h-36 bg-surface" id="kpi-profit">
          <div className="flex justify-between items-center text-muted">
            <span className="text-xs font-semibold tracking-wider uppercase font-body">Gross Profit</span>
            <TrendingUp size={16} className="text-accent" />
          </div>
          <div>
            <div className="text-3xl font-heading font-bold tracking-[-0.03em] text-primary">
              {formatCurrency(dashboardData.totalProfit)}
            </div>
            <span className="text-xs text-muted mt-1 inline-block">
              Margin: <span className="text-accent font-semibold">{dashboardData.averageMargin.toFixed(1)}%</span>
            </span>
          </div>
        </div>

        {/* KPI 3: Cash Exposure Risk */}
        <div className={`interactive-card p-6 flex flex-col justify-between h-36 bg-surface ${dashboardData.cashRiskRatio > 35 ? 'ring-1 ring-red-100' : ''}`} id="kpi-cash-risk">
          <div className="flex justify-between items-center text-muted">
            <span className="text-xs font-semibold tracking-wider uppercase font-body">Cash Exposure</span>
            <ShieldAlert size={16} className={dashboardData.cashRiskRatio > 35 ? 'text-red-500' : 'text-accent'} />
          </div>
          <div>
            <div className={`text-3xl font-heading font-bold tracking-[-0.03em] ${dashboardData.cashRiskRatio > 35 ? 'text-red-600' : 'text-primary'}`}>
              {formatCurrency(dashboardData.totalCashHeldByPartners)}
            </div>
            <span className="text-xs text-muted mt-1 inline-block">
              Risk Ratio: <span className={dashboardData.cashRiskRatio > 35 ? 'text-red-600 font-semibold' : 'text-accent font-semibold'}>{dashboardData.cashRiskRatio.toFixed(1)}%</span>
            </span>
          </div>
        </div>

        {/* KPI 4: Outstanding Liabilities */}
        <div className="interactive-card p-6 flex flex-col justify-between h-36 bg-surface" id="kpi-liabilities">
          <div className="flex justify-between items-center text-muted">
            <span className="text-xs font-semibold tracking-wider uppercase font-body">Outstanding Liabilities</span>
            <Wallet size={16} className="text-accent" />
          </div>
          <div>
            <div className="text-3xl font-heading font-bold tracking-[-0.03em] text-primary">
              {formatCurrency(dashboardData.totalLiabilities)}
            </div>
            <span className="text-xs text-muted mt-1 inline-block">
              Unsettled carrier & provider commissions
            </span>
          </div>
        </div>

      </div>

      {/* 3. Bento Grid - Left: City Analytics, Right: Insight Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="dashboard-bento">
        
        {/* City Performance Tracker (3/5 columns) */}
        <div className="lg:col-span-3 bg-surface p-6 rounded-lg shadow-md flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award size={18} className="text-primary" />
              <h2 className="text-lg font-heading font-bold text-primary tracking-tight">
                Hub Performance Rankings
              </h2>
            </div>
            <p className="text-xs text-muted mb-6">
              Profitability and booking distribution by operating city.
            </p>

            <div className="space-y-5">
              {dashboardData.cityStats.map(city => {
                const percentage = totalRevenuePercent(city.revenue);
                const marginPercent = city.revenue > 0 ? (city.profit / city.revenue) * 100 : 0;
                return (
                  <div key={city.name} className="space-y-1.5" id={`city-stat-${city.name.toLowerCase()}`}>
                    <div className="flex justify-between text-xs font-body">
                      <span className="font-semibold text-primary">{city.name} ({city.count} bookings)</span>
                      <span className="font-mono text-muted">
                        Revenue: <span className="text-primary font-semibold">{formatCurrency(city.revenue)}</span>
                        {" "}|{" "}
                        Margin: <span className="text-accent font-semibold">{marginPercent.toFixed(0)}%</span>
                      </span>
                    </div>
                    {/* Progress Bar (inline data bar as requested) */}
                    <div className="w-full bg-primary/10 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-accent h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {dashboardData.cityStats.length === 0 && (
                <div className="text-center py-10 text-muted">No operating hubs configured. Add cities in settings.</div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-border mt-6 flex justify-between items-center text-xs text-muted">
            <span>Formula-linked dynamically</span>
            <span className="font-mono">USD/EUR exchange matched</span>
          </div>
        </div>

        {/* Actionable Insights & Warnings (2/5 columns) */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-lg shadow-md flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert size={18} className="text-primary" />
              <h2 className="text-lg font-heading font-bold text-primary tracking-tight">
                Executive Insights
              </h2>
            </div>
            <p className="text-xs text-muted mb-6">
              AI-driven operations critique & cash reconciliation risk alerts.
            </p>

            <div className="space-y-4">
              {insights.map((insight, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-md transition-all duration-200 border-l-3 ${
                    insight.isWarning 
                      ? 'bg-red-50/40 border-red-500 text-red-950' 
                      : 'bg-accent/4 border-accent text-primary'
                  }`}
                  id={`insight-item-${idx}`}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 font-body">
                    {insight.isWarning && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />}
                    {!insight.isWarning && <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />}
                    {insight.title}
                  </h4>
                  <p className="text-xs opacity-90 leading-normal font-body">
                    {insight.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 text-xs text-muted font-body text-right mt-6">
            Refreshes on any transactional ledger update.
          </div>
        </div>

      </div>

      {/* 4. Financial breakdown mini visualizer */}
      <div className="bg-surface p-6 rounded-lg shadow-md" id="dashboard-breakdown">
        <h2 className="text-lg font-heading font-bold text-primary tracking-tight mb-4">
          Corporate Budget Allocation
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs" id="budget-breakdown-details">
          
          <div className="p-4 bg-primary/4 rounded-md border-l-2 border-primary">
            <span className="text-muted block font-body uppercase font-bold text-[10px] tracking-wider mb-1">Customer Revenue Inflow</span>
            <span className="text-xl font-heading font-bold text-primary">{formatCurrency(dashboardData.totalRevenue)}</span>
            <div className="mt-2 text-muted text-[11px]">
              Gross booking charges, including client transportation fees.
            </div>
          </div>

          <div className="p-4 bg-accent/4 rounded-md border-l-2 border-accent">
            <span className="text-muted block font-body uppercase font-bold text-[10px] tracking-wider mb-1">Total Operating Cost</span>
            <span className="text-xl font-heading font-bold text-primary">{formatCurrency(dashboardData.totalCosts)}</span>
            <div className="mt-2 text-muted text-[11px]">
              Provider service share + Transport matrix liabilities ({dashboardData.totalRevenue > 0 ? ((dashboardData.totalCosts / dashboardData.totalRevenue) * 100).toFixed(0) : 0}% of inflow).
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-md border-l-2 border-emerald-500">
            <span className="text-muted block font-body uppercase font-bold text-[10px] tracking-wider mb-1">Company Net Retained Profit</span>
            <span className="text-xl font-heading font-bold text-emerald-700">{formatCurrency(dashboardData.totalProfit)}</span>
            <div className="mt-2 text-muted text-[11px]">
              Net margins retained at corporate level ({dashboardData.averageMargin.toFixed(1)}% margin).
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  function totalRevenuePercent(rev: number) {
    if (dashboardData.totalRevenue === 0) return 0;
    return (rev / dashboardData.totalRevenue) * 100;
  }
};
