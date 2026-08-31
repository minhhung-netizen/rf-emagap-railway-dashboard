const els = {
  total: document.querySelector("#totalSignals"),
  buy: document.querySelector("#buySignals"),
  sell: document.querySelector("#sellSignals"),
  tickers: document.querySelector("#tickerCount"),
  metricTotalLabel: document.querySelector("#metricTotalLabel"),
  metricBuyLabel: document.querySelector("#metricBuyLabel"),
  metricSellLabel: document.querySelector("#metricSellLabel"),
  metricTickerLabel: document.querySelector("#metricTickerLabel"),
  syncStatus: document.querySelector("#syncStatus"),
  recentTradeBanner: document.querySelector("#recentTradeBanner"),
  recentTradeBannerTrack: document.querySelector("#recentTradeBannerTrack"),
  recentTradeBannerToggle: document.querySelector("#recentTradeBannerToggle"),
  avgLossBanner: document.querySelector("#avgLossBanner"),
  avgLossBannerTrack: document.querySelector("#avgLossBannerTrack"),
  avgGainBanner: document.querySelector("#avgGainBanner"),
  avgGainBannerTrack: document.querySelector("#avgGainBannerTrack"),
  riskTotalExposure: document.querySelector("#riskTotalExposure"),
  riskWeightedPl: document.querySelector("#riskWeightedPl"),
  riskTopTicker: document.querySelector("#riskTopTicker"),
  riskStressMinus5: document.querySelector("#riskStressMinus5"),
  riskStrategyBreakdown: document.querySelector("#riskStrategyBreakdown"),
  riskAlertList: document.querySelector("#riskAlertList"),
  userAttentionPanel: document.querySelector("#userAttentionPanel"),
  userAttentionList: document.querySelector("#userAttentionList"),
  table: document.querySelector("#signalsTable"),
  signalCards: document.querySelector("#signalCards"),
  openPositionsTable: document.querySelector("#openPositionsTable"),
  openPositionCards: document.querySelector("#openPositionCards"),
  closedTradesTable: document.querySelector("#closedTradesTable"),
  invalidSignalsTable: document.querySelector("#invalidSignalsTable"),
  performanceTable: document.querySelector("#performanceTable"),
  manualPortfolioTable: document.querySelector("#manualPortfolioTable"),
  manualDailyPerformanceTable: document.querySelector("#manualDailyPerformanceTable"),
  manualPositionForm: document.querySelector("#manualPositionForm"),
  manualTicker: document.querySelector("#manualTicker"),
  manualWeight: document.querySelector("#manualWeight"),
  manualEntryPrice: document.querySelector("#manualEntryPrice"),
  manualCurrentPrice: document.querySelector("#manualCurrentPrice"),
  manualQuantity: document.querySelector("#manualQuantity"),
  manualEntryDate: document.querySelector("#manualEntryDate"),
  manualNote: document.querySelector("#manualNote"),
  manualPortfolioReturn: document.querySelector("#manualPortfolioReturn"),
  manualRecordDailyPerformance: document.querySelector("#manualRecordDailyPerformance"),
  manualDailyPerformanceStatus: document.querySelector("#manualDailyPerformanceStatus"),
  manualTotalWeight: document.querySelector("#manualTotalWeight"),
  manualOpenCount: document.querySelector("#manualOpenCount"),
  manualClosedCount: document.querySelector("#manualClosedCount"),
  manualRefreshPrices: document.querySelector("#manualRefreshPrices"),
  closedTradesFilter: document.querySelector("#closedTradesFilter"),
  closedTradesFilterLabel: document.querySelector("#closedTradesFilterLabel"),
  clearClosedTradesFilter: document.querySelector("#clearClosedTradesFilter"),
  watchlistInput: document.querySelector("#watchlistInput"),
  watchlistOnly: document.querySelector("#watchlistOnly"),
  addTickerToWatchlist: document.querySelector("#addTickerToWatchlist"),
  timelineTitle: document.querySelector("#timelineTitle"),
  tickerTimeline: document.querySelector("#tickerTimeline"),
  openPositionRefreshPrices: document.querySelector("#openPositionRefreshPrices"),
  openPositionsTotalReturn: document.querySelector("#openPositionsTotalReturn"),
  openPositionTickerFilter: document.querySelector("#openPositionTickerFilter"),
  openPositionStrategyFilter: document.querySelector("#openPositionStrategyFilter"),
  openPositionConfirmFilter: document.querySelector("#openPositionConfirmFilter"),
  openPositionSort: document.querySelector("#openPositionSort"),
  performanceTickerFilter: document.querySelector("#performanceTickerFilter"),
  performanceStrategyFilter: document.querySelector("#performanceStrategyFilter"),
  performanceSort: document.querySelector("#performanceSort"),
  performanceClosedTradesTable: document.querySelector("#performanceClosedTradesTable"),
  backtestStatsForm: document.querySelector("#backtestStatsForm"),
  backtestTicker: document.querySelector("#backtestTicker"),
  backtestStrategy: document.querySelector("#backtestStrategy"),
  backtestStrategyFilter: document.querySelector("#backtestStrategyFilter"),
  backtestTickerSearch: document.querySelector("#backtestTickerSearch"),
  backtestClosedTrades: document.querySelector("#backtestClosedTrades"),
  backtestNegativeTrades: document.querySelector("#backtestNegativeTrades"),
  backtestMaxLoss: document.querySelector("#backtestMaxLoss"),
  backtestMinLoss: document.querySelector("#backtestMinLoss"),
  backtestAvgLoss: document.querySelector("#backtestAvgLoss"),
  backtestMaxGain: document.querySelector("#backtestMaxGain"),
  backtestAvgGain: document.querySelector("#backtestAvgGain"),
  backtestTp1Hits: document.querySelector("#backtestTp1Hits"),
  backtestTp2Hits: document.querySelector("#backtestTp2Hits"),
  backtestTp3Hits: document.querySelector("#backtestTp3Hits"),
  backtestNote: document.querySelector("#backtestNote"),
  backtestStatsTable: document.querySelector("#backtestStatsTable"),
  positionInsightModal: document.querySelector("#positionInsightModal"),
  positionInsightTitle: document.querySelector("#positionInsightTitle"),
  positionInsightSubtitle: document.querySelector("#positionInsightSubtitle"),
  positionInsightBody: document.querySelector("#positionInsightBody"),
  positionInsightClose: document.querySelector("#positionInsightClose"),
  positionInsightCloseBottom: document.querySelector("#positionInsightCloseBottom"),
  positionInsightChart: document.querySelector("#positionInsightChart"),
  kellyForm: document.querySelector("#kellyForm"),
  kellyTicker: document.querySelector("#kellyTicker"),
  kellyStrategy: document.querySelector("#kellyStrategy"),
  kellyWinRate: document.querySelector("#kellyWinRate"),
  kellyWinningTrades: document.querySelector("#kellyWinningTrades"),
  kellyTotalTrades: document.querySelector("#kellyTotalTrades"),
  kellyProfitFactor: document.querySelector("#kellyProfitFactor"),
  kellyMaxDrawdown: document.querySelector("#kellyMaxDrawdown"),
  kellyTargetDrawdown: document.querySelector("#kellyTargetDrawdown"),
  kellyFraction: document.querySelector("#kellyFraction"),
  kellyMaxAllocation: document.querySelector("#kellyMaxAllocation"),
  saveKellyEntry: document.querySelector("#saveKellyEntry"),
  kellyRecommendedAllocation: document.querySelector("#kellyRecommendedAllocation"),
  kellyFullKelly: document.querySelector("#kellyFullKelly"),
  kellyHalfKelly: document.querySelector("#kellyHalfKelly"),
  kellyQuarterKelly: document.querySelector("#kellyQuarterKelly"),
  kellyWinLossRatio: document.querySelector("#kellyWinLossRatio"),
  kellyEdge: document.querySelector("#kellyEdge"),
  kellyDrawdownFactor: document.querySelector("#kellyDrawdownFactor"),
  kellyNote: document.querySelector("#kellyNote"),
  kellyStrategyFilter: document.querySelector("#kellyStrategyFilter"),
  kellySearch: document.querySelector("#kellySearch"),
  kellySavedTable: document.querySelector("#kellySavedTable"),
  dcaSizingForm: document.querySelector("#dcaSizingForm"),
  dcaSizingTicker: document.querySelector("#dcaSizingTicker"),
  dcaSizingStrategy: document.querySelector("#dcaSizingStrategy"),
  dcaInitialCapital: document.querySelector("#dcaInitialCapital"),
  dcaAllocationPct: document.querySelector("#dcaAllocationPct"),
  dcaEntryPrice: document.querySelector("#dcaEntryPrice"),
  dcaDistanceMode: document.querySelector("#dcaDistanceMode"),
  dcaPriceStepModeLabel: document.querySelector("#dcaPriceStepModeLabel"),
  dcaPriceStepMode: document.querySelector("#dcaPriceStepMode"),
  dcaFixedPriceStepLabel: document.querySelector("#dcaFixedPriceStepLabel"),
  dcaFixedPriceStep: document.querySelector("#dcaFixedPriceStep"),
  dcaCount: document.querySelector("#dcaCount"),
  dcaPreset: document.querySelector("#dcaPreset"),
  dcaMaxLossPct: document.querySelector("#dcaMaxLossPct"),
  dcaRiskLimitPct: document.querySelector("#dcaRiskLimitPct"),
  dcaLotSize: document.querySelector("#dcaLotSize"),
  dcaPriceStep: document.querySelector("#dcaPriceStep"),
  dcaTotalShares: document.querySelector("#dcaTotalShares"),
  dcaAllocatedCapital: document.querySelector("#dcaAllocatedCapital"),
  dcaUsedCapital: document.querySelector("#dcaUsedCapital"),
  dcaAveragePrice: document.querySelector("#dcaAveragePrice"),
  dcaRiskPrice: document.querySelector("#dcaRiskPrice"),
  dcaTargetPrice: document.querySelector("#dcaTargetPrice"),
  dcaProjectedLoss: document.querySelector("#dcaProjectedLoss"),
  dcaActualProjectedLoss: document.querySelector("#dcaActualProjectedLoss"),
  dcaProjectedProfit: document.querySelector("#dcaProjectedProfit"),
  dcaRiskBudget: document.querySelector("#dcaRiskBudget"),
  dcaCashLeft: document.querySelector("#dcaCashLeft"),
  dcaRiskAlert: document.querySelector("#dcaRiskAlert"),
  dcaSizingNote: document.querySelector("#dcaSizingNote"),
  dcaSuggestionNote: document.querySelector("#dcaSuggestionNote"),
  dcaLevelsTable: document.querySelector("#dcaLevelsTable"),
  applyDcaHalfSuggestion: document.querySelector("#applyDcaHalfSuggestion"),
  applyDcaSuggestion: document.querySelector("#applyDcaSuggestion"),
  saveDcaPlan: document.querySelector("#saveDcaPlan"),
  cancelDcaPlanEdit: document.querySelector("#cancelDcaPlanEdit"),
  dcaPlansTable: document.querySelector("#dcaPlansTable"),
  dcaPlanModal: document.querySelector("#dcaPlanModal"),
  dcaPlanTitle: document.querySelector("#dcaPlanTitle"),
  dcaPlanSubtitle: document.querySelector("#dcaPlanSubtitle"),
  dcaPlanBody: document.querySelector("#dcaPlanBody"),
  dcaPlanClose: document.querySelector("#dcaPlanClose"),
  dcaPlanCloseBottom: document.querySelector("#dcaPlanCloseBottom"),
  portfolioBacktestStatus: document.querySelector("#portfolioBacktestStatus"),
  portfolioBacktestCagr: document.querySelector("#portfolioBacktestCagr"),
  portfolioBacktestMdd: document.querySelector("#portfolioBacktestMdd"),
  portfolioBacktestSharpe: document.querySelector("#portfolioBacktestSharpe"),
  portfolioBacktestExposure: document.querySelector("#portfolioBacktestExposure"),
  portfolioBacktestMeta: document.querySelector("#portfolioBacktestMeta"),
  portfolioBacktestComparison: document.querySelector("#portfolioBacktestComparison"),
  portfolioBacktestGuardrails: document.querySelector("#portfolioBacktestGuardrails"),
  portfolioBacktestLimitations: document.querySelector("#portfolioBacktestLimitations"),
  languageSelect: document.querySelector("#languageSelect"),
  themeToggle: document.querySelector("#themeToggle"),
  tabButtons: document.querySelectorAll("[data-tab-target]"),
  tabPanels: document.querySelectorAll("[data-tab-panel]"),
  refresh: document.querySelector("#refreshButton"),
  chartTitle: document.querySelector("#chartTitle"),
  lastUpdated: document.querySelector("#lastUpdated"),
  chart: document.querySelector("#priceChart"),
  chartEmpty: document.querySelector("#priceChartEmpty"),
  equityCanvas: document.querySelector("#equityChart"),
  manualEquityCanvas: document.querySelector("#manualEquityChart"),
  dividendEventForm: document.querySelector("#dividendEventForm"),
  dividendTicker: document.querySelector("#dividendTicker"),
  dividendExDate: document.querySelector("#dividendExDate"),
  dividendCashAmount: document.querySelector("#dividendCashAmount"),
  dividendStockRatio: document.querySelector("#dividendStockRatio"),
  dividendIssueRatio: document.querySelector("#dividendIssueRatio"),
  dividendIssuePrice: document.querySelector("#dividendIssuePrice"),
  dividendNote: document.querySelector("#dividendNote"),
  dividendEventsTable: document.querySelector("#dividendEventsTable"),
  exDateAlerts: document.querySelector("#exDateAlerts"),
  derivativeOpenCount: document.querySelector("#derivativeOpenCount"),
  derivativeOpenPnl: document.querySelector("#derivativeOpenPnl"),
  derivativeClosedCount: document.querySelector("#derivativeClosedCount"),
  derivativeRealizedPnl: document.querySelector("#derivativeRealizedPnl"),
  derivativeInitialCapital: document.querySelector("#derivativeInitialCapital"),
  derivativeCurrentEquity: document.querySelector("#derivativeCurrentEquity"),
  derivativeMaxDrawdown: document.querySelector("#derivativeMaxDrawdown"),
  derivativeMaxDrawdownPct: document.querySelector("#derivativeMaxDrawdownPct"),
  derivativeTotalPnl: document.querySelector("#derivativeTotalPnl"),
  derivativeTotalReturn: document.querySelector("#derivativeTotalReturn"),
  derivativeWinningTrades: document.querySelector("#derivativeWinningTrades"),
  derivativeProfitFactor: document.querySelector("#derivativeProfitFactor"),
  derivativeEquityCanvas: document.querySelector("#derivativeEquityChart"),
  derivativeCapitalForm: document.querySelector("#derivativeCapitalForm"),
  derivativeCapitalInput: document.querySelector("#derivativeCapitalInput"),
  derivativeOpenPositionsTable: document.querySelector("#derivativeOpenPositionsTable"),
  derivativeClosedTradesTable: document.querySelector("#derivativeClosedTradesTable"),
  derivativeEventsTable: document.querySelector("#derivativeEventsTable"),
  loginScreen: document.querySelector("#loginScreen"),
  loginForm: document.querySelector("#loginForm"),
  loginUsername: document.querySelector("#loginUsername"),
  loginPassword: document.querySelector("#loginPassword"),
  loginError: document.querySelector("#loginError"),
  currentUser: document.querySelector("#currentUser"),
  accountMenu: document.querySelector("#accountMenu"),
  logoutButton: document.querySelector("#logoutButton"),
  userCreateForm: document.querySelector("#userCreateForm"),
  newUsername: document.querySelector("#newUsername"),
  newPassword: document.querySelector("#newPassword"),
  newUserRole: document.querySelector("#newUserRole"),
  newUserFeatures: document.querySelector("#newUserFeatures"),
  newUserStrategies: document.querySelector("#newUserStrategies"),
  usersTable: document.querySelector("#usersTable"),
};

const FALLBACK_SIGNAL_WEIGHT_PCT = 5;
const NUMBER_FORMAT_LOCALE = "en-US";
const KELLY_STORAGE_KEY = "dashboardKellyInputs";
const KELLY_LIST_STORAGE_KEY = "dashboardKellyEntries";
const DCA_RISK_LIMIT_STORAGE_KEY = "dashboardDcaRiskLimitPct";
const DEFAULT_DCA_RISK_LIMIT_PCT = 1.5;
const DEFAULT_KELLY_INPUTS = {
  ticker: "",
  strategy: "",
  winRate: 50.64,
  winningTrades: 79,
  totalTrades: 156,
  profitFactor: 2.269,
  maxDrawdown: 3.63,
  targetDrawdown: 10,
  fraction: 50,
  maxAllocation: 20,
};
const DEFAULT_DCA_LEVELS = [
  { distancePct: 0, multiplier: 1 },
  { distancePct: 5, multiplier: 1 },
  { distancePct: 10, multiplier: 1.5 },
  { distancePct: 15, multiplier: 2 },
  { distancePct: 20, multiplier: 2.5 },
];
const DCA_PRESETS = {
  conservative: {
    multipliers: [1, 1, 1.2, 1.5, 1.8],
  },
  balanced: {
    multipliers: [1, 1, 1.5, 2, 2.5],
  },
  aggressive: {
    multipliers: [1, 1.5, 2, 2.5, 3],
  },
};
const STRATEGY_DISPLAY_ALIASES = {
  stxanhdo: "ST",
  "mordern stock ema": "MSE",
  "modern stock ema": "MSE",
};
let dcaInitialCapitalSaveTimer = null;
const FEATURE_LABELS = {
  overview: "Tổng quan",
  positions: "Vị thế",
  derivatives: "Phái sinh VN30",
  manualPortfolio: "Danh mục tay",
  performance: "Hiệu suất",
  portfolioMonitor: "RF + EMA Monitor",
  kelly: "Kelly",
  dcaSizing: "Phân bổ DCA",
  dividends: "Cổ tức",
  logs: "Nhật ký",
};

const translations = {
  en: {
    webhookLabel: "Signal Dashboard",
    refresh: "Refresh",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    watchlistOnly: "Watchlist only",
    addToWatchlist: "Add to watchlist",
    tickerTimeline: "Ticker Timeline",
    clearFilter: "Clear",
    filteredTrades: "Showing trades for",
    tabOverview: "Overview",
    tabPositions: "Positions",
    tabDerivatives: "VN30 Derivatives",
    tabManualPortfolio: "Manual Portfolio",
    tabPerformance: "Performance",
    tabDividends: "Dividends",
    tabLogs: "Logs",
    total: "Total",
    buy: "Buy",
    sell: "Sell",
    tickers: "Tickers",
    priceHistory: "Price History",
    noTickerSelected: "No ticker selected",
    waitingWebhook: "Waiting for webhook",
    realtimeFeed: "Realtime Feed",
    signals: "Signals",
    time: "Time",
    ticker: "Ticker",
    side: "Side",
    price: "Price",
    timeframe: "Timeframe",
    strategy: "Strategy",
    action: "Action",
    strategyPerformance: "Strategy Performance",
    buyToSellResults: "Buy to Sell Results",
    closed: "Closed",
    open: "Open",
    winRate: "Win Rate",
    realized: "Realized",
    realizedPl: "Realized P/L",
    openPl: "Open P/L",
    current: "Current",
    currentPl: "Current P/L",
    openUnrealizedPl: "Unrealized P/L",
    allocationWeight: "Weight",
    portfolioPl: "P/L",
    confirm: "Signal",
    confirmAll: "All signal states",
    confirmedOnly: "Has other signal",
    unconfirmedOnly: "No other signal",
    confirmedStatus: "Has other signal",
    unconfirmedStatus: "No other signal",
    noConfirmations: "No other signal",
    confirmBuyTitle: "Other signal received",
    dailyPerformance: "Daily Performance",
    savedDailyPerformance: "Saved Daily Performance",
    date: "Date",
    equityValue: "Equity",
    savedAt: "Saved At",
    noDailyPerformance: "No saved daily performance",
    deleteDailyPerformanceConfirm: "Delete this saved daily performance record?",
    deleteDailyPerformanceFailed: "Could not delete saved daily performance",
    confirmationStats: "Signal Stats",
    confirmVsNoConfirm: "Other Signal vs None",
    avgReturn: "Avg Return",
    totalReturn: "Total Return",
    exportBackup: "Export / Backup",
    downloadData: "Download Data",
    exportSignals: "Signals CSV",
    exportManualPortfolio: "Manual CSV",
    exportDailyPerformance: "Daily CSV",
    exportDividends: "Dividends CSV",
    exportDerivatives: "Derivatives CSV",
    backupDatabase: "Backup DB",
    dividendCalendar: "Dividend Calendar",
    dividendRules: "Ex-rights Adjustments",
    dividend: "Dividend",
    exDate: "Ex-date",
    cashDividend: "Cash",
    stockDividend: "Stock %",
    additionalIssue: "Issue %",
    issuePrice: "Issue Price",
    addDividendEvent: "Add event",
    noDividendEvents: "No dividend events",
    noDividends: "No dividend events",
    upcomingDividend: "Upcoming",
    appliedDividend: "Adjusted",
    dividendDeleteConfirm: "Delete this dividend event?",
    dividendSaveFailed: "Could not save dividend event",
    dividendDeleteFailed: "Could not delete dividend event",
    exDateToday: "Ex-date today",
    exDateTodayShort: "Ex-rights today",
    exDateAlertMessage: "Ex-rights date today for open positions",
    openPositions: "Open Positions",
    currentHoldings: "Current Holdings",
    entryPrice: "Entry",
    currentPrice: "Current Price",
    returnPct: "Return",
    holdingDays: "Days Held",
    entryTime: "Entry Time",
    entryDate: "Entry Date",
    exitPrice: "Exit",
    exitTime: "Exit Time",
    holdTime: "Hold Time",
    closedTrades: "Closed Trades",
    tradeHistory: "Trade History",
    manualEntry: "Manual Entry",
    addHolding: "Add Holding",
    addPosition: "Add",
    manualPortfolio: "Manual Portfolio",
    portfolioDetail: "Portfolio Detail",
    manualEquityCurve: "Manual Equity Curve",
    portfolioGrowth: "Portfolio Growth",
    recordDailyPerformance: "Save EOD",
    dailyPerformanceEmpty: "No saved daily performance yet",
    dailyPerformanceStatus: "Saved days",
    dailyPerformanceLatest: "Latest",
    totalWeight: "Weight",
    weight: "Weight",
    quantity: "Quantity",
    status: "Status",
    note: "Note",
    save: "Save",
    close: "Close",
    closedStatus: "Closed",
    openStatus: "Open",
    noManualPositions: "No manual positions yet",
    refreshPrices: "Refresh prices",
    refreshPricesFailed: "Could not refresh market prices",
    closeManualConfirm: "Close this manual position?",
    closeManualPricePrompt: "Enter close price",
    closeManualInvalidPrice: "Close price must be greater than 0",
    deleteManualConfirm: "Delete this manual position?",
    manualSaveFailed: "Could not save manual position",
    manualCloseFailed: "Could not close manual position",
    manualDeleteFailed: "Could not delete manual position",
    equityCurve: "Equity Curve",
    closedTradeGrowth: "Closed Trade Growth",
    invalidSignalLog: "Invalid Signal Log",
    ignoredAlerts: "Ignored Alerts",
    reason: "Reason",
    sortCurrentDesc: "Current desc",
    sortCurrentAsc: "Current asc",
    sortRealizedDesc: "Realized desc",
    sortRealizedAsc: "Realized asc",
    sortWinDesc: "Win rate desc",
    sortReturnDesc: "Return desc",
    sortReturnAsc: "Return asc",
    sortCurrentPriceDesc: "Current price desc",
    sortCurrentPriceAsc: "Current price asc",
    sortEntryNewest: "Entry newest",
    sortEntryOldest: "Entry oldest",
    sortTickerAsc: "Ticker A-Z",
    sortStrategyAsc: "Strategy A-Z",
    noTrades: "No completed or open trades yet",
    noOpenPositions: "No open positions",
    noClosedTrades: "No closed trades yet",
    noInvalidSignals: "No invalid signals",
    duplicateWebhook: "Duplicate webhook",
    sellWithoutOpenBuy: "Sell without open buy",
    missingBuyPrice: "Missing buy price",
    missingSellPrice: "Missing sell price",
    positionAlreadyOpen: "Position already open",
    baseStrategyNotOpen: "Base strategy is not open",
    noSignals: "No signals yet",
    noTimeline: "No timeline for this ticker",
    noHistory: "No price history available",
    delete: "Delete",
    deleteTitle: "Delete signal",
    deleteConfirm: "Delete this signal?",
    deleteFailed: "Could not delete signal",
    reopenPosition: "Reopen",
    reopenPositionTitle: "Reopen position",
    reopenPositionConfirm: "Delete the closing sell signal and reopen this position?",
    reopenPositionFailed: "Could not reopen position",
    performanceTickerPlaceholder: "Ticker",
    performanceStrategyPlaceholder: "Strategy",
    openPositionTickerPlaceholder: "Ticker",
    openPositionStrategyPlaceholder: "Strategy",
    vn30Derivatives: "VN30 Derivatives",
    derivativeOpenPositions: "Open Positions",
    derivativeOpenPnl: "Open P/L",
    derivativeClosedTrades: "Closed Trades",
    derivativeRealizedPnl: "Realized P/L",
    derivativeInitialCapital: "Initial Capital",
    derivativeCurrentEquity: "Current Equity",
    derivativeMaxDrawdown: "Maximum Equity Drawdown",
    derivativeMaxDrawdownPct: "Maximum Equity Drawdown %",
    derivativeTotalPnl: "Total P/L",
    derivativeTotalReturn: "Total Return",
    derivativeWinningTrades: "Winning Trades",
    derivativeProfitFactor: "Profit Factor",
    derivativePerformance: "Derivative Performance",
    derivativeEquityCurve: "Equity and Maximum Drawdown",
    derivativeCapitalPlaceholder: "Initial capital (VND)",
    saveCapital: "Save capital",
    derivativeCapitalSaveFailed: "Could not save derivative capital",
    derivativeCurrentPositions: "Current Long / Short Positions",
    derivativeTradeHistory: "Derivative Trade History",
    derivativeEvents: "Derivative Events",
    derivativeWebhookHistory: "Webhook Event History",
    averagePrice: "Average Price",
    contracts: "Contracts",
    layers: "Layers",
    pnlPoints: "P/L Points",
    pnlVnd: "P/L VND",
    noDerivativePositions: "No open derivative positions",
    noDerivativeTrades: "No closed derivative trades",
    noDerivativeEvents: "No derivative events",
    deleteDerivativeConfirm: "Delete this derivative event?",
    deleteDerivativeFailed: "Could not delete derivative event",
  },
  vi: {
    webhookLabel: "Bảng tín hiệu",
    refresh: "Làm mới",
    darkMode: "Chế độ tối",
    lightMode: "Chế độ sáng",
    watchlistOnly: "Chỉ watchlist",
    addToWatchlist: "Thêm vào watchlist",
    tickerTimeline: "Timeline mã",
    clearFilter: "Xóa lọc",
    filteredTrades: "Đang xem giao dịch của",
    tabOverview: "Tổng quan",
    tabPositions: "Vị thế",
    tabManualPortfolio: "Danh mục tay",
    tabPerformance: "Hiệu suất",
    tabLogs: "Nhật ký",
    total: "Tổng",
    buy: "Mua",
    sell: "Bán",
    tickers: "Mã CP",
    priceHistory: "Lịch sử giá",
    noTickerSelected: "Chưa chọn mã",
    waitingWebhook: "Đang chờ webhook",
    realtimeFeed: "Tín hiệu realtime",
    signals: "Tín hiệu",
    time: "Thời gian",
    ticker: "Mã",
    side: "Chiều",
    price: "Giá",
    timeframe: "Khung TG",
    strategy: "Chiến lược",
    action: "Thao tác",
    strategyPerformance: "Hiệu suất chiến lược",
    buyToSellResults: "Kết quả Mua đến Bán",
    closed: "Đã đóng",
    open: "Đang mở",
    winRate: "Tỷ lệ thắng",
    realized: "Đã chốt",
    realizedPl: "Lãi/lỗ đã chốt",
    openPl: "Lãi/lỗ mở",
    current: "Hiện tại",
    currentPl: "Lãi/lỗ hiện tại",
    openUnrealizedPl: "Lãi/lỗ tạm tính",
    allocationWeight: "Tỷ trọng",
    portfolioPl: "Lãi/lỗ",
    confirmAll: "Tất cả xác nhận",
    confirmedOnly: "Đã xác nhận",
    unconfirmedOnly: "Chưa xác nhận",
    confirmedStatus: "Đã xác nhận",
    unconfirmedStatus: "Chưa xác nhận",
    noConfirmations: "Chưa có xác nhận",
    dailyPerformance: "Hiệu suất ngày",
    savedDailyPerformance: "Hiệu suất ngày đã lưu",
    date: "Ngày",
    equityValue: "Vốn",
    savedAt: "Lúc lưu",
    noDailyPerformance: "Chưa có hiệu suất ngày đã lưu",
    confirmationStats: "Thống kê xác nhận",
    confirmVsNoConfirm: "Có xác nhận vs chưa xác nhận",
    avgReturn: "Lãi/lỗ TB",
    totalReturn: "Tổng lãi/lỗ",
    exportBackup: "Xuất / Sao lưu",
    downloadData: "Tải dữ liệu",
    exportSignals: "Tín hiệu CSV",
    exportManualPortfolio: "Danh mục CSV",
    exportDailyPerformance: "Hiệu suất ngày CSV",
    backupDatabase: "Sao lưu DB",
    baseStrategyNotOpen: "Chiến lược gốc chưa mở",
    webhookLabel: "Bảng tín hiệu",
    refresh: "Làm mới",
    darkMode: "Chế độ tối",
    lightMode: "Chế độ sáng",
    watchlistOnly: "Chỉ watchlist",
    addToWatchlist: "Thêm watchlist",
    tickerTimeline: "Timeline mã",
    clearFilter: "Xóa lọc",
    filteredTrades: "Đang xem giao dịch của",
    tabOverview: "Tổng quan",
    tabPositions: "Vị thế",
    tabManualPortfolio: "Danh mục tay",
    tabPerformance: "Hiệu suất",
    tabLogs: "Nhật ký",
    total: "Tổng",
    buy: "Mua",
    sell: "Bán",
    tickers: "Mã CP",
    priceHistory: "Lịch sử giá",
    noTickerSelected: "Chưa chọn mã",
    waitingWebhook: "Đang chờ webhook",
    realtimeFeed: "Tín hiệu realtime",
    signals: "Tín hiệu",
    time: "Thời gian",
    ticker: "Mã",
    side: "Chiều",
    price: "Giá",
    timeframe: "Khung TG",
    strategy: "Chiến lược",
    strategyPerformance: "Hiệu suất chiến lược",
    buyToSellResults: "Kết quả Mua đến Bán",
    closed: "Đã đóng",
    open: "Đang mở",
    winRate: "Tỷ lệ thắng",
    realized: "Đã chốt",
    openPl: "Lãi/lỗ mở",
    current: "Hiện tại",
    openUnrealizedPl: "Lãi/lỗ tạm tính",
    openPositions: "Vị thế đang mở",
    currentHoldings: "Danh mục hiện tại",
    entryPrice: "Giá vào",
    currentPrice: "Giá hiện tại",
    returnPct: "Lãi/lỗ",
    holdingDays: "Số ngày giữ",
    entryTime: "Thời gian vào",
    entryDate: "Ngày vào",
    exitPrice: "Giá bán",
    exitTime: "Thời gian bán",
    holdTime: "Thời gian giữ",
    closedTrades: "Lệnh đã đóng",
    tradeHistory: "Lịch sử giao dịch",
    manualEntry: "Nhập tay",
    addHolding: "Thêm mã nắm giữ",
    addPosition: "Thêm",
    manualPortfolio: "Danh mục tay",
    portfolioDetail: "Chi tiết danh mục",
    manualEquityCurve: "Đường vốn danh mục tay",
    portfolioGrowth: "Tăng trưởng danh mục",
    recordDailyPerformance: "Lưu cuối ngày",
    dailyPerformanceEmpty: "Chưa có hiệu suất ngày đã lưu",
    dailyPerformanceStatus: "Số ngày đã lưu",
    dailyPerformanceLatest: "Gần nhất",
    totalWeight: "Tỷ trọng",
    weight: "Tỷ trọng",
    quantity: "Số lượng",
    status: "Trạng thái",
    note: "Ghi chú",
    save: "Lưu",
    close: "Đóng",
    closedStatus: "Đã đóng",
    openStatus: "Đang mở",
    noManualPositions: "Chưa có danh mục tay",
    refreshPrices: "Cập nhật giá",
    refreshPricesFailed: "Không thể cập nhật giá thị trường",
    closeManualConfirm: "Đóng vị thế tay này?",
    closeManualPricePrompt: "Nhập giá đóng",
    closeManualInvalidPrice: "Giá đóng phải lớn hơn 0",
    deleteManualConfirm: "Xóa vị thế tay này?",
    manualSaveFailed: "Không thể lưu vị thế tay",
    manualCloseFailed: "Không thể đóng vị thế tay",
    manualDeleteFailed: "Không thể xóa vị thế tay",
    equityCurve: "Đường vốn",
    closedTradeGrowth: "Tăng trưởng lệnh đã đóng",
    invalidSignalLog: "Log tín hiệu lỗi",
    ignoredAlerts: "Cảnh báo bị bỏ qua",
    reason: "Lý do",
    sortCurrentDesc: "Hiện tại giảm dần",
    sortCurrentAsc: "Hiện tại tăng dần",
    sortRealizedDesc: "Đã chốt giảm dần",
    sortRealizedAsc: "Đã chốt tăng dần",
    sortWinDesc: "Tỷ lệ thắng giảm dần",
    sortReturnDesc: "Lãi/lỗ giảm dần",
    sortReturnAsc: "Lãi/lỗ tăng dần",
    sortCurrentPriceDesc: "Giá hiện tại giảm dần",
    sortCurrentPriceAsc: "Giá hiện tại tăng dần",
    sortEntryNewest: "Ngày vào mới nhất",
    sortEntryOldest: "Ngày vào cũ nhất",
    sortTickerAsc: "Mã A-Z",
    sortStrategyAsc: "Chiến lược A-Z",
    noTrades: "Chưa có lệnh đã đóng hoặc đang mở",
    noOpenPositions: "Không có vị thế đang mở",
    noClosedTrades: "Chưa có lệnh đã đóng",
    noInvalidSignals: "Không có tín hiệu lỗi",
    duplicateWebhook: "Webhook trùng",
    sellWithoutOpenBuy: "Bán khi chưa có mua",
    missingBuyPrice: "Thiếu giá mua",
    missingSellPrice: "Thiếu giá bán",
    positionAlreadyOpen: "Vị thế đã mở",
    noSignals: "Chưa có tín hiệu",
    noTimeline: "Chưa có timeline cho mã này",
    noHistory: "Chưa có lịch sử giá",
    delete: "Xóa",
    deleteTitle: "Xóa tín hiệu",
    deleteConfirm: "Xóa tín hiệu này?",
    deleteFailed: "Không thể xóa tín hiệu",
    reopenPosition: "Mở lại",
    reopenPositionTitle: "Mở lại vị thế",
    reopenPositionConfirm: "Xóa tín hiệu Sell đã đóng lệnh và đưa vị thế này trở lại đang nắm?",
    reopenPositionFailed: "Không thể mở lại vị thế",
    performanceTickerPlaceholder: "Mã",
    performanceStrategyPlaceholder: "Chiến lược",
    openPositionTickerPlaceholder: "Mã",
    openPositionStrategyPlaceholder: "Chiến lược",
  },
};

Object.assign(translations.vi, {
  webhookLabel: "Bảng tín hiệu",
  refresh: "Làm mới",
  darkMode: "Chế độ tối",
  lightMode: "Chế độ sáng",
  watchlistOnly: "Chỉ watchlist",
  addToWatchlist: "Thêm vào watchlist",
  tickerTimeline: "Timeline mã",
  clearFilter: "Xóa lọc",
  filteredTrades: "Đang xem giao dịch của",
  tabOverview: "Tổng quan",
  tabPositions: "Vị thế",
  tabManualPortfolio: "Danh mục tay",
  tabPerformance: "Hiệu suất",
  tabDividends: "Cổ tức",
  tabLogs: "Nhật ký",
  total: "Tổng",
  buy: "Mua",
  sell: "Bán",
  tickers: "Mã CP",
  priceHistory: "Lịch sử giá",
  noTickerSelected: "Chưa chọn mã",
  waitingWebhook: "Đang chờ webhook",
  realtimeFeed: "Tín hiệu realtime",
  signals: "Tín hiệu",
  time: "Thời gian",
  ticker: "Mã",
  side: "Chiều",
  price: "Giá",
  timeframe: "Khung TG",
  strategy: "Chiến lược",
  strategyPerformance: "Hiệu suất chiến lược",
  buyToSellResults: "Kết quả Mua đến Bán",
  closed: "Đã đóng",
  open: "Đang mở",
  winRate: "Tỷ lệ thắng",
  realized: "Đã chốt",
  realizedPl: "Lãi/lỗ đã chốt",
  openPl: "Lãi/lỗ mở",
  current: "Hiện tại",
  currentPl: "Lãi/lỗ hiện tại",
  openUnrealizedPl: "Lãi/lỗ tạm tính",
  allocationWeight: "Tỷ trọng",
  portfolioPl: "Lãi/lỗ",
  confirm: "Tín hiệu",
  confirmAll: "Tất cả trạng thái tín hiệu",
  confirmedOnly: "Có tín hiệu khác",
  unconfirmedOnly: "Chưa có tín hiệu khác",
  confirmedStatus: "Có tín hiệu khác",
  unconfirmedStatus: "Chưa có tín hiệu khác",
  noConfirmations: "Chưa có tín hiệu khác",
  confirmBuyTitle: "Đã có tín hiệu khác",
  dailyPerformance: "Hiệu suất ngày",
  savedDailyPerformance: "Hiệu suất ngày đã lưu",
  date: "Ngày",
  equityValue: "Vốn",
  savedAt: "Lúc lưu",
  noDailyPerformance: "Chưa có hiệu suất ngày đã lưu",
  deleteDailyPerformanceConfirm: "Xóa bản ghi hiệu suất ngày này?",
  deleteDailyPerformanceFailed: "Không thể xóa hiệu suất ngày đã lưu",
  confirmationStats: "Thống kê tín hiệu",
  confirmVsNoConfirm: "Có tín hiệu khác vs chưa có",
  avgReturn: "Lãi/lỗ TB",
  totalReturn: "Tổng lãi/lỗ",
  exportBackup: "Xuất / Sao lưu",
  downloadData: "Tải dữ liệu",
  exportSignals: "Tín hiệu CSV",
  exportManualPortfolio: "Danh mục CSV",
  exportDailyPerformance: "Hiệu suất ngày CSV",
  exportDividends: "Cổ tức CSV",
  backupDatabase: "Sao lưu DB",
  dividendCalendar: "Lịch cổ tức",
  dividendRules: "Điều chỉnh ngày GDKHQ",
  dividend: "Cổ tức",
  exDate: "Ngày GDKHQ",
  cashDividend: "Tiền mặt",
  stockDividend: "Cổ phiếu %",
  additionalIssue: "Phát hành thêm %",
  issuePrice: "Giá phát hành",
  addDividendEvent: "Thêm sự kiện",
  noDividendEvents: "Chưa có lịch cổ tức",
  noDividends: "Không có cổ tức",
  upcomingDividend: "Sắp tới",
  appliedDividend: "Đã điều chỉnh",
  dividendDeleteConfirm: "Xóa sự kiện cổ tức này?",
  dividendSaveFailed: "Không thể lưu sự kiện cổ tức",
  dividendDeleteFailed: "Không thể xóa sự kiện cổ tức",
  exDateToday: "Hôm nay là ngày GDKHQ",
  exDateTodayShort: "GDKHQ hôm nay",
  exDateAlertMessage: "Cảnh báo ngày giao dịch không hưởng quyền cho vị thế đang mở",
  baseStrategyNotOpen: "Chiến lược gốc chưa mở",
  openPositions: "Vị thế đang mở",
  currentHoldings: "Danh mục hiện tại",
  entryPrice: "Giá vào",
  currentPrice: "Giá hiện tại",
  returnPct: "Lãi/lỗ",
  holdingDays: "Số ngày giữ",
  entryTime: "Thời gian vào",
  entryDate: "Ngày vào",
  exitPrice: "Giá bán",
  exitTime: "Thời gian bán",
  holdTime: "Thời gian giữ",
  closedTrades: "Lệnh đã đóng",
  tradeHistory: "Lịch sử giao dịch",
  manualEntry: "Nhập tay",
  addHolding: "Thêm mã nắm giữ",
  addPosition: "Thêm",
  manualPortfolio: "Danh mục tay",
  portfolioDetail: "Chi tiết danh mục",
  manualEquityCurve: "Đường vốn danh mục tay",
  portfolioGrowth: "Tăng trưởng danh mục",
  recordDailyPerformance: "Lưu cuối ngày",
  dailyPerformanceEmpty: "Chưa có hiệu suất ngày đã lưu",
  dailyPerformanceStatus: "Số ngày đã lưu",
  dailyPerformanceLatest: "Gần nhất",
  totalWeight: "Tỷ trọng",
  weight: "Tỷ trọng",
  quantity: "Số lượng",
  status: "Trạng thái",
  note: "Ghi chú",
  save: "Lưu",
  close: "Đóng",
  closedStatus: "Đã đóng",
  openStatus: "Đang mở",
  noManualPositions: "Chưa có danh mục tay",
  refreshPrices: "Cập nhật giá",
  refreshPricesFailed: "Không thể cập nhật giá thị trường",
  closeManualConfirm: "Đóng vị thế tay này?",
  closeManualPricePrompt: "Nhập giá đóng",
  closeManualInvalidPrice: "Giá đóng phải lớn hơn 0",
  deleteManualConfirm: "Xóa vị thế tay này?",
  manualSaveFailed: "Không thể lưu vị thế tay",
  manualCloseFailed: "Không thể đóng vị thế tay",
  manualDeleteFailed: "Không thể xóa vị thế tay",
  equityCurve: "Đường vốn",
  closedTradeGrowth: "Tăng trưởng lệnh đã đóng",
  invalidSignalLog: "Log tín hiệu lỗi",
  ignoredAlerts: "Cảnh báo bị bỏ qua",
  reason: "Lý do",
  sortCurrentDesc: "Hiện tại giảm dần",
  sortCurrentAsc: "Hiện tại tăng dần",
  sortRealizedDesc: "Đã chốt giảm dần",
  sortRealizedAsc: "Đã chốt tăng dần",
  sortWinDesc: "Tỷ lệ thắng giảm dần",
  sortReturnDesc: "Lãi/lỗ giảm dần",
  sortReturnAsc: "Lãi/lỗ tăng dần",
  sortCurrentPriceDesc: "Giá hiện tại giảm dần",
  sortCurrentPriceAsc: "Giá hiện tại tăng dần",
  sortEntryNewest: "Ngày vào mới nhất",
  sortEntryOldest: "Ngày vào cũ nhất",
  sortTickerAsc: "Mã A-Z",
  sortStrategyAsc: "Chiến lược A-Z",
  noTrades: "Chưa có lệnh đã đóng hoặc đang mở",
  noOpenPositions: "Không có vị thế đang mở",
  noClosedTrades: "Chưa có lệnh đã đóng",
  noInvalidSignals: "Không có tín hiệu lỗi",
  duplicateWebhook: "Webhook trùng",
  sellWithoutOpenBuy: "Bán khi chưa có mua",
  missingBuyPrice: "Thiếu giá mua",
  missingSellPrice: "Thiếu giá bán",
  positionAlreadyOpen: "Vị thế đã mở",
  noSignals: "Chưa có tín hiệu",
  noTimeline: "Chưa có timeline cho mã này",
  noHistory: "Chưa có lịch sử giá",
  delete: "Xóa",
  deleteTitle: "Xóa tín hiệu",
  deleteConfirm: "Xóa tín hiệu này?",
  deleteFailed: "Không thể xóa tín hiệu",
  performanceTickerPlaceholder: "Mã",
  performanceStrategyPlaceholder: "Chiến lược",
  openPositionTickerPlaceholder: "Mã",
  openPositionStrategyPlaceholder: "Chiến lược",
  tabDerivatives: "Phái sinh VN30",
  exportDerivatives: "Phái sinh CSV",
  vn30Derivatives: "Phái sinh VN30",
  derivativeOpenPositions: "Vị thế đang mở",
  derivativeOpenPnl: "Lãi/lỗ tạm tính",
  derivativeClosedTrades: "Lệnh đã đóng",
  derivativeRealizedPnl: "Lãi/lỗ đã chốt",
  derivativeInitialCapital: "Vốn ban đầu",
  derivativeCurrentEquity: "Vốn hiện tại",
  derivativeMaxDrawdown: "Mức giảm vốn chủ sở hữu lớn nhất",
  derivativeMaxDrawdownPct: "Mức giảm vốn chủ sở hữu lớn nhất %",
  derivativeTotalPnl: "Tổng lãi/lỗ",
  derivativeTotalReturn: "Tỷ suất tổng",
  derivativeWinningTrades: "Giao dịch lãi",
  derivativeProfitFactor: "Hệ số lợi nhuận",
  derivativePerformance: "Hiệu suất phái sinh",
  derivativeEquityCurve: "Vốn chủ sở hữu và mức sụt giảm tối đa",
  derivativeCapitalPlaceholder: "Vốn ban đầu (VND)",
  saveCapital: "Lưu vốn",
  derivativeCapitalSaveFailed: "Không thể lưu vốn phái sinh",
  derivativeCurrentPositions: "Vị thế Long / Short hiện tại",
  derivativeTradeHistory: "Lịch sử giao dịch phái sinh",
  derivativeEvents: "Sự kiện phái sinh",
  derivativeWebhookHistory: "Lịch sử webhook phái sinh",
  averagePrice: "Giá vốn",
  contracts: "Hợp đồng",
  layers: "Số lớp",
  pnlPoints: "Lãi/lỗ điểm",
  pnlVnd: "Lãi/lỗ VND",
  noDerivativePositions: "Không có vị thế phái sinh đang mở",
  noDerivativeTrades: "Chưa có lệnh phái sinh đã đóng",
  noDerivativeEvents: "Chưa có sự kiện phái sinh",
  deleteDerivativeConfirm: "Xóa sự kiện phái sinh này?",
  deleteDerivativeFailed: "Không thể xóa sự kiện phái sinh",
});

Object.assign(translations.en, {
  language: "Language",
  syncing: "Syncing...",
  syncedJustNow: "Updated just now",
  userOpenPositions: "Open positions",
  userOpenPl: "Estimated P/L",
  userTodaySignals: "Signals today",
  userAlerts: "Needs attention",
  attention: "Needs attention",
  positionAlerts: "Positions and signals to monitor",
  noAttention: "No positions currently need attention",
  alertLoss: "Return is below -5%",
  alertSignal: "Another signal was received",
  alertDividend: "Upcoming ex-rights date",
  entryShort: "Entry",
  currentShort: "Current",
  daysShort: "Held",
});

Object.assign(translations.vi, {
  language: "Ngôn ngữ",
  syncing: "Đang đồng bộ...",
  syncedJustNow: "Vừa cập nhật",
  userOpenPositions: "Vị thế đang mở",
  userOpenPl: "Lãi/lỗ tạm tính",
  userTodaySignals: "Tín hiệu hôm nay",
  userAlerts: "Cần chú ý",
  attention: "Cần chú ý",
  positionAlerts: "Vị thế và tín hiệu cần theo dõi",
  noAttention: "Hiện không có vị thế cần chú ý",
  alertLoss: "Lãi/lỗ đang dưới -5%",
  alertSignal: "Đã nhận tín hiệu khác",
  alertDividend: "Sắp đến ngày GDKHQ",
  entryShort: "Giá vào",
  currentShort: "Hiện tại",
  daysShort: "Đã giữ",
});

Object.assign(translations.en, {
  recentTradeBanner: "Recent trade alerts",
  avgLossBanner: "Average loss alerts",
  avgGainBanner: "Average gain alerts",
  recentOpened: "New buys",
  recentClosed: "New closes",
  hideBanner: "Hide",
  showBanner: "Show",
  riskOverview: "Risk Overview",
  portfolioRisk: "Portfolio Risk",
  totalExposure: "Total exposure",
  weightedOpenPl: "Weighted open P/L",
  topTickerExposure: "Top ticker exposure",
  stressMinus5: "Stress -5%",
  strategyExposure: "Strategy exposure",
  alertCenter: "Alert Center",
  riskAlerts: "Risk Alerts",
  noRiskAlerts: "No active risk alerts",
  exposureAboveLimit: "Total exposure is above 100%",
  concentrationAlert: "Ticker concentration is high",
  strategyConcentrationAlert: "Strategy concentration is high",
  webhookIssueAlert: "Webhook warnings need review",
  dividendRiskAlert: "Upcoming ex-rights event",
  lossRiskAlert: "Open position is below risk threshold",
  avgLossTouchAlert: "Touched strategy average loss",
  avgGainTouchAlert: "Touched strategy average gain",
  avgLossSignal: "Touched avg loss",
  avgGainSignal: "Touched avg gain",
  avgLossShort: "Avg loss",
  avgGainShort: "Avg gain",
  maxLossShort: "Max loss",
  maxGainShort: "Max gain",
  newSellAlert: "Recently closed position",
  kellyUsage: "Usage",
  activePositions: "Active positions",
});

Object.assign(translations.vi, {
  recentTradeBanner: "Cảnh báo giao dịch mới",
  avgLossBanner: "Cảnh báo âm TB",
  recentOpened: "Mới mở mua",
  recentClosed: "Mới đóng",
  hideBanner: "Ẩn",
  showBanner: "Hiện",
  riskOverview: "Rủi ro",
  portfolioRisk: "Rủi ro danh mục",
  totalExposure: "Tổng tỷ trọng",
  weightedOpenPl: "Lãi/lỗ theo tỷ trọng",
  topTickerExposure: "Mã chiếm tỷ trọng cao nhất",
  stressMinus5: "Giả định giảm 5%",
  strategyExposure: "Tỷ trọng theo chiến lược",
  alertCenter: "Trung tâm cảnh báo",
  riskAlerts: "Cảnh báo rủi ro",
  noRiskAlerts: "Chưa có cảnh báo rủi ro",
  exposureAboveLimit: "Tổng tỷ trọng vượt 100%",
  concentrationAlert: "Tỷ trọng theo mã đang cao",
  strategyConcentrationAlert: "Tỷ trọng theo chiến lược đang cao",
  webhookIssueAlert: "Có cảnh báo webhook cần kiểm tra",
  dividendRiskAlert: "Sắp đến ngày GDKHQ",
  lossRiskAlert: "Vị thế đang dưới ngưỡng rủi ro",
  avgLossTouchAlert: "Chạm âm TB chiến lược",
  avgLossSignal: "Chạm âm TB",
  avgLossShort: "Âm TB",
  maxLossShort: "Âm lớn nhất",
  newSellAlert: "Vừa có vị thế đóng",
  kellyUsage: "Đang dùng",
  activePositions: "Vị thế đang mở",
});

Object.assign(translations.vi, {
  avgGainBanner: "Cảnh báo tăng TB",
  avgGainTouchAlert: "Chạm tăng TB chiến lược",
  avgGainSignal: "Chạm tăng TB",
  avgGainShort: "Tăng TB",
  maxGainShort: "Tăng lớn nhất",
});

Object.assign(translations.en, {
  deleteOpenPositionTitle: "Delete open position",
  deleteOpenPositionConfirm: "Delete this open position? This removes its opening buy signal.",
  deleteOpenPositionFailed: "Could not delete open position",
});

Object.assign(translations.vi, {
  deleteOpenPositionTitle: "Xóa vị thế đang mở",
  deleteOpenPositionConfirm: "Xóa vị thế đang mở này? Hệ thống sẽ xóa tín hiệu Buy mở vị thế.",
  deleteOpenPositionFailed: "Không thể xóa vị thế đang mở",
});

Object.assign(translations.en, {
  tabDcaSizing: "DCA Sizing",
  dcaSizingEyebrow: "DCA Sizing",
  dcaSizingTitle: "Position sizing by recommended allocation",
  dcaInitialCapital: "Initial capital",
  dcaAllocationPct: "Recommended allocation (%)",
  dcaEntryPrice: "First buy price",
  dcaDistanceMode: "Distance mode",
  dcaDistanceModePercent: "Percent from previous order",
  dcaDistanceModePriceStep: "Price step from previous order",
  dcaCount: "DCA count",
  dcaMaxLossPct: "Max loss from backtest (%)",
  dcaLotSize: "Lot size",
  dcaPriceStep: "Buy price rounding",
  dcaTotalShares: "Total shares",
  dcaAllocatedCapital: "Allocated capital",
  dcaUsedCapital: "Used capital",
  dcaAveragePrice: "Average buy price",
  dcaRiskPrice: "Risk price",
  dcaTargetPrice: "Target price",
  dcaProjectedLoss: "Projected loss",
  dcaProjectedProfit: "Projected profit",
  dcaCashLeft: "Cash left",
  dcaOpenPositionStatus: "Position status",
  dcaHasOpenPosition: "Open position",
  dcaNoOpenPosition: "No open position",
  dcaLevels: "DCA levels",
  dcaLevelsTitle: "Distance and multiplier",
  dcaLevel: "Level",
  dcaDistanceValue: "Distance",
  dcaDistancePct: "Distance %",
  dcaMultiplier: "Volume multiplier",
  dcaBuyPrice: "Buy price",
  dcaLevelBudget: "Budget",
  dcaShares: "Shares",
  dcaCost: "Cost",
  dcaCumulativeAverage: "Cumulative average",
  dcaSizingInvalidNote: "Enter capital, allocation, first buy price and at least one valid multiplier.",
  dcaSizingAutoNote: "Allocation uses saved Kelly; max loss uses saved backtest when available. Each level's shares are previous shares multiplied by the multiplier.",
  saveDcaPlan: "Save allocation",
  dcaSavedEyebrow: "Saved DCA",
  dcaSavedTitle: "Saved allocation plans",
  dcaPlanDetailEyebrow: "DCA plan",
  noDcaPlans: "No saved DCA plans",
  dcaPlanSaved: "DCA allocation saved",
  dcaPlanSaveFailed: "Could not save DCA allocation",
  deleteDcaPlanConfirm: "Delete this DCA allocation plan?",
  deleteDcaPlanFailed: "Could not delete DCA allocation plan",
  applyDcaSuggestion: "Suggest distance",
  dcaSuggestionMissingBacktest: "No backtest average loss and max loss found for this ticker/strategy.",
  dcaSuggestionMissingEntryPrice: "Enter first buy price to convert suggested distance into price steps.",
  dcaSuggestionApplied: "Suggested distance = (max loss {max}% - avg loss {avg}%) / {count} DCA entries = {step}%.",
  dcaSuggestionRounded: " Buy prices are rounded by {step}.",
});

Object.assign(translations.vi, {
  tabDcaSizing: "Phân bổ DCA",
  dcaSizingEyebrow: "PHÂN BỔ DCA",
  dcaSizingTitle: "Tính số lượng cổ phiếu theo tỷ trọng khuyến nghị",
  dcaInitialCapital: "Vốn ban đầu",
  dcaAllocationPct: "Tỷ trọng khuyến nghị (%)",
  dcaEntryPrice: "Giá mua đầu tiên",
  dcaDistanceMode: "Kiểu khoảng cách",
  dcaDistanceModePercent: "% so với lệnh trước",
  dcaDistanceModePriceStep: "Bước giá so với lệnh trước",
  dcaCount: "Số lần DCA",
  dcaMaxLossPct: "Âm lớn nhất backtest (%)",
  dcaLotSize: "Lô giao dịch",
  dcaPriceStep: "Làm tròn giá mua",
  dcaTotalShares: "Tổng cổ phiếu",
  dcaAllocatedCapital: "Vốn phân bổ",
  dcaUsedCapital: "Vốn đã dùng",
  dcaAveragePrice: "Giá mua trung bình",
  dcaRiskPrice: "Giá rủi ro",
  dcaProjectedLoss: "Lỗ dự kiến",
  dcaCashLeft: "Tiền dư",
  dcaLevels: "Các lớp DCA",
  dcaLevelsTitle: "Khoảng cách giá và multiplier",
  dcaLevel: "Lớp",
  dcaDistanceValue: "Khoảng cách",
  dcaDistancePct: "Khoảng cách %",
  dcaMultiplier: "Nhân khối lượng",
  dcaBuyPrice: "Giá mua",
  dcaLevelBudget: "Ngân sách",
  dcaShares: "Cổ phiếu",
  dcaCost: "Giá trị mua",
  dcaCumulativeAverage: "Giá TB lũy kế",
  dcaSizingInvalidNote: "Nhập vốn, tỷ trọng, giá mua đầu tiên và ít nhất một multiplier hợp lệ.",
  dcaSizingAutoNote: "Tỷ trọng lấy từ Kelly đã lưu; âm lớn nhất lấy từ Backtest đã lưu nếu có. Khối lượng mỗi lớp bằng khối lượng lớp trước nhân multiplier.",
  saveDcaPlan: "Lưu phân bổ",
  dcaSavedEyebrow: "DCA ĐÃ LƯU",
  dcaSavedTitle: "Danh sách phân bổ DCA đã lưu",
  dcaPlanDetailEyebrow: "Chi tiết DCA",
  noDcaPlans: "Chưa có phân bổ DCA đã lưu",
  dcaPlanSaved: "Đã lưu phân bổ DCA",
  dcaPlanSaveFailed: "Không thể lưu phân bổ DCA",
  deleteDcaPlanConfirm: "Xóa kế hoạch phân bổ DCA này?",
  deleteDcaPlanFailed: "Không thể xóa kế hoạch phân bổ DCA",
  applyDcaSuggestion: "Gợi ý khoảng cách",
  dcaSuggestionMissingBacktest: "Chưa có âm trung bình và âm lớn nhất backtest cho mã/chiến lược này.",
  dcaSuggestionMissingEntryPrice: "Nhập giá mua đầu tiên để quy đổi gợi ý sang bước giá.",
  dcaSuggestionApplied: "Khoảng cách gợi ý = (âm lớn nhất {max}% - âm TB {avg}%) / {count} lần DCA = {step}%.",
  dcaSuggestionRounded: " Giá mua làm tròn theo bước {step}.",
});

Object.assign(translations.vi, {
  dcaTargetPrice: "Gi\u00e1 m\u1ee5c ti\u00eau",
  dcaProjectedProfit: "L\u00e3i d\u1ef1 ki\u1ebfn",
  dcaOpenPositionStatus: "Tr\u1ea1ng th\u00e1i v\u1ecb th\u1ebf",
  dcaHasOpenPosition: "\u0110ang c\u00f3 v\u1ecb th\u1ebf",
  dcaNoOpenPosition: "Ch\u01b0a c\u00f3 v\u1ecb th\u1ebf",
});

Object.assign(translations.en, {
  dcaPreset: "Preset",
  dcaPresetCustom: "Custom",
  dcaPresetConservative: "Conservative",
  dcaPresetBalanced: "Balanced",
  dcaPresetAggressive: "Aggressive",
  applyDcaHalfSuggestion: "50% suggested distance",
  dcaHalfSuggestionApplied: "Applied 50% of suggested distance: {step}% instead of {base}%.",
  dcaProjectedLoss: "Maximum projected loss",
  dcaActualProjectedLoss: "Expected actual loss",
  dcaRiskLimitPct: "Risk limit (% capital)",
  dcaRiskBudget: "Risk / capital",
  dcaRiskExceeded: "Risk exceeds limit: projected loss is {risk}% of capital, above the {limit}% limit.",
  dcaRiskExceededShort: "Over risk",
  dcaPriceStepMode: "Step mode",
  dcaPriceStepModeCustom: "Custom per level",
  dcaPriceStepModeFixed: "Fixed step",
  dcaFixedPriceStep: "Fixed step distance",
  updateDcaPlan: "Save changes",
  cancelDcaPlanEdit: "Cancel edit",
  edit: "Edit",
  dcaPlanUpdated: "DCA allocation updated",
  dcaPlanEditStarted: "Editing saved DCA allocation",
});

Object.assign(translations.vi, {
  dcaPreset: "M\u1eabu multiplier",
  dcaPresetCustom: "T\u00f9y ch\u1ec9nh",
  dcaPresetConservative: "Th\u1eadn tr\u1ecdng",
  dcaPresetBalanced: "C\u00e2n b\u1eb1ng",
  dcaPresetAggressive: "M\u1ea1nh",
  applyDcaHalfSuggestion: "50% kho\u1ea3ng c\u00e1ch g\u1ee3i \u00fd",
  dcaHalfSuggestionApplied: "\u0110\u00e3 \u00e1p d\u1ee5ng 50% kho\u1ea3ng c\u00e1ch g\u1ee3i \u00fd: {step}% thay v\u00ec {base}%.",
  dcaProjectedLoss: "L\u1ed7 d\u1ef1 ki\u1ebfn cao nh\u1ea5t",
  dcaActualProjectedLoss: "L\u1ed7 d\u1ef1 ki\u1ebfn th\u1ef1c t\u1ebf",
  dcaRiskLimitPct: "Ng\u01b0\u1ee1ng r\u1ee7i ro (% v\u1ed1n)",
  dcaRiskBudget: "R\u1ee7i ro / v\u1ed1n",
  dcaRiskExceeded: "V\u01b0\u1ee3t ng\u01b0\u1ee1ng r\u1ee7i ro: l\u1ed7 d\u1ef1 ki\u1ebfn chi\u1ebfm {risk}% v\u1ed1n, cao h\u01a1n ng\u01b0\u1ee1ng {limit}%.",
  dcaRiskExceededShort: "V\u01b0\u1ee3t r\u1ee7i ro",
  dcaPriceStepMode: "Ki\u1ec3u b\u01b0\u1edbc gi\u00e1",
  dcaPriceStepModeCustom: "T\u00f9y ch\u1ec9nh t\u1eebng l\u1edbp",
  dcaPriceStepModeFixed: "B\u01b0\u1edbc c\u1ed1 \u0111\u1ecbnh",
  dcaFixedPriceStep: "Kho\u1ea3ng c\u00e1ch b\u01b0\u1edbc c\u1ed1 \u0111\u1ecbnh",
  updateDcaPlan: "L\u01b0u \u0111\u00e8",
  cancelDcaPlanEdit: "H\u1ee7y s\u1eeda",
  edit: "S\u1eeda",
  dcaPlanUpdated: "\u0110\u00e3 l\u01b0u \u0111\u00e8 ph\u00e2n b\u1ed5 DCA",
  dcaPlanEditStarted: "\u0110ang s\u1eeda ph\u00e2n b\u1ed5 DCA \u0111\u00e3 l\u01b0u",
});

Object.assign(translations.en, {
  allStrategies: "All strategies",
  performanceTradeHistory: "Trade History",
  strategyTradeHistory: "Strategy Closed Trades",
  tabKelly: "Kelly",
  kellyCalculator: "Kelly Calculator",
  kellyAllocation: "Allocation by Modern Chart DCA Metrics",
  kellyTicker: "Ticker",
  kellyWinRate: "Win Rate (%)",
  kellyWinningTrades: "Winning Trades",
  kellyTotalTrades: "Total Trades",
  kellyProfitFactor: "Profit Factor",
  kellyMaxDrawdown: "Max Drawdown (%)",
  kellyTargetDrawdown: "Target Drawdown (%)",
  kellyFraction: "Kelly Used (%)",
  kellyMaxAllocation: "Max Allocation Cap (%)",
  kellyRecommended: "Recommended Allocation",
  kellyFull: "Full Kelly",
  kellyHalf: "1/2 Kelly",
  kellyQuarter: "1/4 Kelly",
  kellyWinLossRatio: "Avg Win / Avg Loss",
  kellyEdge: "Edge",
  kellyDrawdownFactor: "Drawdown Factor",
  saveKellyEntry: "Save ticker",
  kellySavedList: "Saved Kelly List",
  kellySavedByTicker: "Allocation by Ticker",
  kellySearchPlaceholder: "Search ticker",
  noKellyEntries: "No saved Kelly entries",
  deleteKellyEntryConfirm: "Delete this Kelly entry?",
  kellyInvalidNote: "Enter a valid win rate and profit factor to calculate Kelly allocation.",
  kellyMissingTickerNote: "Enter a ticker before saving this Kelly entry.",
  kellyNegativeNote: "Kelly is zero or negative, so this setup does not justify allocation by the formula.",
  kellyPositiveNote: "Recommendation uses fractional Kelly, max allocation cap, and drawdown adjustment.",
});

Object.assign(translations.vi, {
  allStrategies: "Tất cả chiến lược",
  performanceTradeHistory: "Lịch sử giao dịch",
  strategyTradeHistory: "Lệnh đã đóng theo chiến lược",
  tabKelly: "Kelly",
  kellyCalculator: "Kelly",
  kellyAllocation: "Phân bổ theo chỉ số Modern Chart DCA",
  kellyTicker: "Mã",
  kellyWinRate: "Tỷ lệ thắng (%)",
  kellyWinningTrades: "Giao dịch lãi",
  kellyTotalTrades: "Tổng giao dịch",
  kellyProfitFactor: "Hệ số lãi",
  kellyMaxDrawdown: "Mức sụt giảm tối đa (%)",
  kellyTargetDrawdown: "Mức sụt giảm mục tiêu (%)",
  kellyFraction: "Kelly sử dụng (%)",
  kellyMaxAllocation: "Trần phân bổ tối đa (%)",
  kellyRecommended: "Tỷ lệ phân bổ khuyến nghị",
  kellyFull: "Kelly đầy đủ",
  kellyHalf: "1/2 Kelly",
  kellyQuarter: "1/4 Kelly",
  kellyWinLossRatio: "Lãi TB / Lỗ TB",
  kellyEdge: "Lợi thế",
  kellyDrawdownFactor: "Hệ số drawdown",
  saveKellyEntry: "Lưu mã",
  kellySavedList: "Danh sách Kelly đã lưu",
  kellySavedByTicker: "Phân bổ theo từng mã",
  kellySearchPlaceholder: "Tìm mã",
  noKellyEntries: "Chưa có mã Kelly đã lưu",
  deleteKellyEntryConfirm: "Xóa mã Kelly này?",
  kellyInvalidNote: "Nhập tỷ lệ thắng và hệ số lãi hợp lệ để tính phân bổ Kelly.",
  kellyMissingTickerNote: "Nhập mã trước khi lưu Kelly.",
  kellyNegativeNote: "Kelly bằng 0 hoặc âm, công thức chưa ủng hộ phân bổ cho bộ chỉ số này.",
  kellyPositiveNote: "Khuyến nghị đã áp dụng Kelly phân đoạn, trần phân bổ và điều chỉnh drawdown.",
});

Object.assign(translations.en, {
  backtestStats: "Backtest Stats",
  strategyBacktestStats: "Manual Strategy Backtest Stats",
  metric: "Metric",
  closedTrades: "Closed Trades",
  negativeTrades: "Negative Trades",
  maxLoss: "Max Loss",
  minLoss: "Min Loss",
  avgLoss: "Avg Loss",
  maxGain: "Max Gain",
  avgGain: "Avg Gain",
  tp1HitRate: "TP1 / Trades",
  tp2HitRate: "TP2 / Trades",
  tp3HitRate: "TP3 / Trades",
  avgHoldBars: "Avg Hold Bars",
  avgHoldDays: "Avg Hold Days",
  noBacktestStats: "No saved backtest stats",
  backtestSaveFailed: "Could not save backtest stats",
  backtestDeleteConfirm: "Delete this backtest stats row?",
  backtestDeleteFailed: "Could not delete backtest stats",
  duplicateTickerStrategy: "This ticker and strategy already exists",
  backtestSearchPlaceholder: "Search ticker",
  positionInsightEyebrow: "Position detail",
  openChart: "Open chart",
  kellySummary: "Kelly Allocation",
  backtestSummary: "Backtest Stats",
  currentPosition: "Current Position",
  noKellyForPosition: "No Kelly entry for this ticker and strategy",
  noBacktestForPosition: "No backtest stats for this ticker and strategy",
  recommendedAllocation: "Recommended allocation",
  fullKelly: "Full Kelly",
  quarterKelly: "Quarter Kelly",
  edge: "Edge",
  winLossRatio: "Win/Loss ratio",
  targetDrawdown: "Target drawdown",
  totalTrades: "Total trades",
  winningTrades: "Winning trades",
});

Object.assign(translations.vi, {
  backtestStats: "Thống kê backtest",
  strategyBacktestStats: "Thống kê backtest nhập tay theo mã và chiến lược",
  metric: "Chỉ số",
  closedTrades: "Lệnh đã đóng",
  negativeTrades: "Lệnh âm",
  maxLoss: "Âm lớn nhất",
  minLoss: "Âm nhỏ nhất",
  avgLoss: "Âm trung bình",
  maxGain: "Tăng lớn nhất",
  avgGain: "Tăng trung bình",
  tp1HitRate: "TP1 đạt / Tổng trade",
  tp2HitRate: "TP2 đạt / Tổng trade",
  tp3HitRate: "TP3 đạt / Tổng trade",
  avgHoldBars: "Số nến giữ TB",
  avgHoldDays: "Số ngày giữ TB",
  noBacktestStats: "Chưa có thống kê backtest đã lưu",
  backtestSaveFailed: "Không lưu được thống kê backtest",
  backtestDeleteConfirm: "Xóa dòng thống kê backtest này?",
  backtestDeleteFailed: "Không xóa được thống kê backtest",
  duplicateTickerStrategy: "Mã và chiến lược này đã tồn tại",
  backtestSearchPlaceholder: "Tìm mã",
  positionInsightEyebrow: "Chi tiết vị thế",
  openChart: "Mở biểu đồ",
  kellySummary: "Phân bổ Kelly",
  backtestSummary: "Thống kê backtest",
  currentPosition: "Vị thế hiện tại",
  noKellyForPosition: "Chưa có Kelly cho mã và chiến lược này",
  noBacktestForPosition: "Chưa có backtest cho mã và chiến lược này",
  recommendedAllocation: "Phân bổ khuyến nghị",
  fullKelly: "Kelly đầy đủ",
  quarterKelly: "Kelly 1/4",
  edge: "Lợi thế",
  winLossRatio: "Tỷ lệ lời/lỗ",
  targetDrawdown: "Drawdown mục tiêu",
  totalTrades: "Tổng giao dịch",
  winningTrades: "Giao dịch thắng",
});

const state = {
  user: null,
  availableFeatures: Object.keys(FEATURE_LABELS),
  availableStrategies: [],
  users: [],
  language: localStorage.getItem("dashboardLanguage") || "vi",
  theme: localStorage.getItem("dashboardTheme") || "light",
  activeTab: localStorage.getItem("dashboardActiveTab") || "overview",
  selectedTicker: "",
  watchlist: loadWatchlist(),
  watchlistOnly: localStorage.getItem("dashboardWatchlistOnly") === "true",
  recentTradeBannerHidden: localStorage.getItem("dashboardRecentTradeBannerHidden") === "true",
  signals: [],
  openTrades: [],
  closedTrades: [],
  invalidSignals: [],
  performanceStrategies: [],
  backtestStats: [],
  kellyEntries: [],
  dcaPlans: [],
  dcaSettings: { initialCapital: null, updatedAt: "" },
  kellyMigrationDone: false,
  dcaLevels: DEFAULT_DCA_LEVELS.map((level) => ({ ...level })),
  activeDcaPlanId: "",
  activeKellyEntryKey: "",
  activeBacktestStatKey: "",
  activeBacktestStatId: "",
  closedTradeFilter: null,
  defaultSignalWeightPct: FALLBACK_SIGNAL_WEIGHT_PCT,
  manualPortfolio: { positions: [], equity_curve: [], summary: {} },
  dividendEvents: [],
  dividendAlerts: [],
  summary: {},
  lastRefreshAt: null,
  derivatives: { summary: {}, open_positions: [], closed_trades: [], events: [] },
  portfolioBacktest: null,
};

const priceChartState = {
  chart: null,
  candleSeries: null,
  volumeSeries: null,
  markerPlugin: null,
  resizeObserver: null,
  ticker: "",
  requestId: 0,
};

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function t(key) {
  return translations[state.language]?.[key] || translations.en[key] || key;
}

function numberValue(value) {
  return value === null || value === undefined || Number.isNaN(Number(value))
    ? Number.NEGATIVE_INFINITY
    : Number(value);
}

function allocatedReturnPct(returnPct, weightPct = state.defaultSignalWeightPct) {
  const value = Number(returnPct);
  const weight = Number(weightPct);
  return Number.isFinite(value)
    ? (value * (Number.isFinite(weight) ? weight : state.defaultSignalWeightPct)) / 100
    : null;
}

function kellyEntryKey(ticker, strategy = "") {
  return `${String(ticker || "").trim().toUpperCase()}|${String(strategy || "").trim().toLowerCase()}`;
}

function tickerStrategyKey(ticker, strategy = "") {
  return kellyEntryKey(ticker, strategy);
}

function findKellyEntry(ticker, strategy = "") {
  const entries = loadKellyEntries();
  const exactKey = kellyEntryKey(ticker, strategy);
  const fallbackKey = kellyEntryKey(ticker, "");
  const normalizedTicker = String(ticker || "").trim().toUpperCase();
  return (
    entries.find((entry) => kellyEntryKey(entry.ticker, entry.strategy) === exactKey) ||
    entries.find((entry) => kellyEntryKey(entry.ticker, entry.strategy) === fallbackKey) ||
    (!String(strategy || "").trim()
      ? entries.find((entry) => String(entry.ticker || "").trim().toUpperCase() === normalizedTicker)
      : null) ||
    null
  );
}

function kellyAllocationPct(ticker, strategy = "") {
  const entry = findKellyEntry(ticker, strategy);
  if (!entry) return state.defaultSignalWeightPct;
  const recommended = calculateKelly(entry).recommendedPct;
  return Number.isFinite(Number(recommended)) ? Number(recommended) : state.defaultSignalWeightPct;
}

function kellyWinRatePct(entry) {
  const direct = Number(entry?.winRate);
  if (Number.isFinite(direct)) return direct;
  const wins = Number(entry?.winningTrades);
  const total = Number(entry?.totalTrades);
  return Number.isFinite(wins) && Number.isFinite(total) && total > 0
    ? wins / total * 100
    : null;
}

function loadWatchlist() {
  return parseWatchlist(localStorage.getItem("dashboardWatchlist") || "");
}

function parseWatchlist(value) {
  return [
    ...new Set(
      String(value || "")
        .split(/[,\s]+/)
        .map((ticker) => ticker.trim().toUpperCase())
        .filter(Boolean)
    ),
  ];
}

function saveWatchlist() {
  localStorage.setItem("dashboardWatchlist", state.watchlist.join(","));
}

function loadKellyInputs() {
  try {
    return {
      ...DEFAULT_KELLY_INPUTS,
      ...(JSON.parse(localStorage.getItem(KELLY_STORAGE_KEY) || "{}") || {}),
    };
  } catch {
    return { ...DEFAULT_KELLY_INPUTS };
  }
}

function loadKellyEntries() {
  return state.kellyEntries || [];
}

function loadLocalKellyEntries() {
  try {
    const entries = JSON.parse(localStorage.getItem(KELLY_LIST_STORAGE_KEY) || "[]");
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function saveKellyEntries(entries) {
  state.kellyEntries = entries;
}

function normalizeKellyProfitFactor(value) {
  const profitFactor = optionalNumber(value);
  if (profitFactor === null) return null;
  return profitFactor >= 100 ? profitFactor / 1000 : profitFactor;
}

function normalizeKellyEntry(entry) {
  return {
    id: entry.id,
    ticker: String(entry.ticker || "").trim().toUpperCase(),
    strategy: String(entry.strategy || "").trim(),
    winRate: optionalNumber(entry.winRate ?? entry.win_rate),
    winningTrades: optionalNumber(entry.winningTrades ?? entry.winning_trades),
    totalTrades: optionalNumber(entry.totalTrades ?? entry.total_trades),
    profitFactor: normalizeKellyProfitFactor(entry.profitFactor ?? entry.profit_factor),
    maxDrawdown: optionalNumber(entry.maxDrawdown ?? entry.max_drawdown),
    targetDrawdown: optionalNumber(entry.targetDrawdown ?? entry.target_drawdown),
    fraction: optionalNumber(entry.fraction),
    maxAllocation: optionalNumber(entry.maxAllocation ?? entry.max_allocation),
    updatedAt: entry.updatedAt || entry.updated_at || new Date().toISOString(),
  };
}

function initializeKellyCalculator() {
  const values = loadKellyInputs();
  els.kellyTicker.value = values.ticker || "";
  els.kellyStrategy.value = values.strategy || "";
  els.kellyWinRate.value = rawNumber(values.winRate);
  els.kellyWinningTrades.value = rawNumber(values.winningTrades);
  els.kellyTotalTrades.value = rawNumber(values.totalTrades);
  els.kellyProfitFactor.value = rawNumber(values.profitFactor);
  els.kellyMaxDrawdown.value = rawNumber(values.maxDrawdown);
  els.kellyTargetDrawdown.value = rawNumber(values.targetDrawdown);
  els.kellyFraction.value = rawNumber(values.fraction);
  els.kellyMaxAllocation.value = rawNumber(values.maxAllocation);
  renderKellyCalculator();
  renderKellyEntries();
}

function readKellyInputs() {
  return {
    ticker: els.kellyTicker.value.trim().toUpperCase(),
    strategy: els.kellyStrategy.value.trim(),
    winRate: optionalNumber(els.kellyWinRate.value),
    winningTrades: optionalNumber(els.kellyWinningTrades.value),
    totalTrades: optionalNumber(els.kellyTotalTrades.value),
    profitFactor: optionalNumber(els.kellyProfitFactor.value),
    maxDrawdown: optionalNumber(els.kellyMaxDrawdown.value),
    targetDrawdown: optionalNumber(els.kellyTargetDrawdown.value),
    fraction: optionalNumber(els.kellyFraction.value),
    maxAllocation: optionalNumber(els.kellyMaxAllocation.value),
  };
}

function renderKellyCalculator() {
  const inputs = readKellyInputs();
  localStorage.setItem(KELLY_STORAGE_KEY, JSON.stringify(inputs));
  const result = calculateKelly(inputs);

  els.kellyRecommendedAllocation.innerHTML = formatKellyPercent(result.recommendedPct);
  els.kellyFullKelly.innerHTML = formatSignedPercent(result.fullKellyPct);
  els.kellyHalfKelly.innerHTML = formatKellyPercent(result.halfKellyPct);
  els.kellyQuarterKelly.innerHTML = formatKellyPercent(result.quarterKellyPct);
  els.kellyWinLossRatio.textContent = formatRatio(result.winLossRatio);
  els.kellyEdge.innerHTML = formatSignedPercent(result.edgePct);
  els.kellyDrawdownFactor.textContent = formatRatio(result.drawdownFactor);
  els.kellyNote.textContent = result.note;
}

async function migrateLocalKellyEntriesToDatabase(serverEntries) {
  if (state.kellyMigrationDone || state.user?.role !== "admin") {
    return serverEntries;
  }
  state.kellyMigrationDone = true;
  const localEntries = loadLocalKellyEntries().map(normalizeKellyEntry).filter((entry) => entry.ticker);
  if (!localEntries.length) return serverEntries;

  const serverKeys = new Set(serverEntries.map((entry) => kellyEntryKey(entry.ticker, entry.strategy)));
  const entriesToUpload = localEntries.filter(
    (entry) => !serverKeys.has(kellyEntryKey(entry.ticker, entry.strategy))
  );
  if (!entriesToUpload.length) {
    localStorage.removeItem(KELLY_LIST_STORAGE_KEY);
    return serverEntries;
  }

  const uploaded = [];
  for (const entry of entriesToUpload) {
    const response = await fetch("/api/kelly-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      state.kellyMigrationDone = false;
      return serverEntries;
    }
    const payload = await response.json();
    uploaded.push(normalizeKellyEntry(payload.kelly_entry || entry));
  }
  localStorage.removeItem(KELLY_LIST_STORAGE_KEY);
  return [...uploaded, ...serverEntries]
    .sort((left, right) => String(left.ticker || "").localeCompare(String(right.ticker || "")));
}

async function saveCurrentKellyEntry() {
  const inputs = readKellyInputs();
  if (!inputs.ticker) {
    window.alert(t("kellyMissingTickerNote"));
    els.kellyTicker.focus();
    return;
  }
  const entry = {
    ...inputs,
    updatedAt: new Date().toISOString(),
  };
  const entries = loadKellyEntries();
  const entryKey = kellyEntryKey(inputs.ticker, inputs.strategy);
  const duplicate = entries.find((item) => kellyEntryKey(item.ticker, item.strategy) === entryKey);
  if (duplicate && state.activeKellyEntryKey !== entryKey) {
    window.alert(t("duplicateTickerStrategy"));
    els.kellyTicker.focus();
    return;
  }
  const nextEntries = [
    entry,
    ...entries.filter((item) => kellyEntryKey(item.ticker, item.strategy) !== entryKey),
  ].sort((left, right) => String(left.ticker || "").localeCompare(String(right.ticker || "")));
  const response = await fetch("/api/kelly-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!response.ok) {
    window.alert(t("backtestSaveFailed"));
    return;
  }
  const payload = await response.json();
  const savedEntry = normalizeKellyEntry(payload.kelly_entry || entry);
  saveKellyEntries(nextEntries);
  state.kellyEntries = [
    savedEntry,
    ...state.kellyEntries.filter((item) => kellyEntryKey(item.ticker, item.strategy) !== entryKey),
  ].sort((left, right) => String(left.ticker || "").localeCompare(String(right.ticker || "")));
  state.activeKellyEntryKey = entryKey;
  renderKellyEntries();
  refresh();
}

function renderKellyEntries() {
  const entries = loadKellyEntries();
  updateKellySavedStrategyFilterOptions(entries);
  const search = els.kellySearch.value.trim().toUpperCase();
  const strategyFilter = els.kellyStrategyFilter.value;
  const filteredEntries = entries.filter((entry) => {
    const tickerMatches = !search || String(entry.ticker || "").toUpperCase().includes(search);
    const strategyMatches = !strategyFilter || String(entry.strategy || "") === strategyFilter;
    return tickerMatches && strategyMatches;
  });
  if (!filteredEntries.length) {
    els.kellySavedTable.innerHTML =
      `<tr><td class="empty" colspan="10">${t("noKellyEntries")}</td></tr>`;
    return;
  }

  els.kellySavedTable.innerHTML = filteredEntries
    .map((entry) => {
      const result = calculateKelly(entry);
      const usageCount = kellyEntryUsageCount(entry);
      return `
        <tr class="clickableRow" data-kelly-load="${escapeHtml(kellyEntryKey(entry.ticker, entry.strategy))}">
          <td><strong>${escapeHtml(entry.ticker || "-")}</strong></td>
          <td>${escapeHtml(displayStrategyName(entry.strategy) || t("allStrategies"))}</td>
          <td>${formatKellyPercent(entry.winRate)}</td>
          <td>${escapeHtml(entry.winningTrades ?? "-")}/${escapeHtml(entry.totalTrades ?? "-")}</td>
          <td>${formatRatio(entry.profitFactor)}</td>
          <td>${formatKellyPercent(entry.maxDrawdown)}</td>
          <td>${formatSignedPercent(result.fullKellyPct)}</td>
          <td>${formatKellyPercent(result.recommendedPct)}</td>
          <td>${usageCount ? `${usageCount} ${escapeHtml(t("activePositions"))}` : "-"}</td>
          <td>
            <button class="deleteButton" type="button" data-kelly-delete="${escapeHtml(kellyEntryKey(entry.ticker, entry.strategy))}">${escapeHtml(t("delete"))}</button>
          </td>
        </tr>
      `;
    })
    .join("");

  els.kellySavedTable.querySelectorAll("[data-kelly-load]").forEach((row) => {
    row.addEventListener("click", () => loadKellyEntry(row.dataset.kellyLoad));
  });
  els.kellySavedTable.querySelectorAll("[data-kelly-delete]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteKellyEntry(button.dataset.kellyDelete);
    });
  });
}

function initializeDcaSizingCalculator() {
  const storedRiskLimit = optionalNumber(localStorage.getItem(DCA_RISK_LIMIT_STORAGE_KEY));
  els.dcaRiskLimitPct.value = rawNumber(
    storedRiskLimit === null ? DEFAULT_DCA_RISK_LIMIT_PCT : storedRiskLimit
  );
  els.dcaCount.value = String(Math.max(1, state.dcaLevels.length - 1));
  renderDcaLevelsTable();
  updateDcaSizingStrategyOptions([...state.performanceStrategies, ...state.backtestStats]);
  syncDcaSizingReferences();
  renderDcaSizing();
}

function updateDcaSizingStrategyOptions(strategies, preferredValue = els.dcaSizingStrategy.value) {
  const normalizedStrategies = uniqueStrategyNames(strategies);
  els.dcaSizingStrategy.replaceChildren();
  els.dcaSizingStrategy.append(new Option(t("allStrategies"), ""));
  normalizedStrategies.forEach((strategy) => {
    els.dcaSizingStrategy.append(new Option(displayStrategyName(strategy), strategy));
  });
  if (preferredValue && !normalizedStrategies.includes(preferredValue)) {
    els.dcaSizingStrategy.append(new Option(displayStrategyName(preferredValue), preferredValue));
  }
  els.dcaSizingStrategy.value = preferredValue && [...normalizedStrategies, preferredValue].includes(preferredValue)
    ? preferredValue
    : "";
}

function findBacktestStat(ticker, strategy = "") {
  const exactKey = tickerStrategyKey(ticker, strategy);
  const fallbackKey = tickerStrategyKey(ticker, "");
  const normalizedTicker = String(ticker || "").trim().toUpperCase();
  return (
    (state.backtestStats || []).find((stat) => tickerStrategyKey(stat.ticker, stat.strategy) === exactKey) ||
    (state.backtestStats || []).find((stat) => tickerStrategyKey(stat.ticker, stat.strategy) === fallbackKey) ||
    (!String(strategy || "").trim()
      ? (state.backtestStats || []).find((stat) => String(stat.ticker || "").trim().toUpperCase() === normalizedTicker)
      : null) ||
    null
  );
}

function findOpenTradeForDca(ticker, strategy = "") {
  const exactKey = tickerStrategyKey(ticker, strategy);
  const normalizedTicker = String(ticker || "").trim().toUpperCase();
  return (
    (state.openTrades || []).find((trade) => tickerStrategyKey(trade.ticker, trade.strategy) === exactKey) ||
    (!String(strategy || "").trim()
      ? (state.openTrades || []).find((trade) => String(trade.ticker || "").trim().toUpperCase() === normalizedTicker)
      : null) ||
    null
  );
}

function findExactOpenTradeForDca(ticker, strategy = "") {
  const normalizedTicker = String(ticker || "").trim().toUpperCase();
  const normalizedStrategy = String(strategy || "").trim();
  if (!normalizedTicker || !normalizedStrategy) return null;
  const exactKey = tickerStrategyKey(normalizedTicker, normalizedStrategy);
  return (state.openTrades || []).find((trade) =>
    tickerStrategyKey(trade.ticker, trade.strategy) === exactKey
  ) || null;
}

function syncDcaSizingReferences() {
  const ticker = els.dcaSizingTicker.value.trim().toUpperCase();
  const strategy = els.dcaSizingStrategy.value.trim();
  if (!ticker) {
    els.dcaEntryPrice.value = "";
    delete els.dcaEntryPrice.dataset.autoFilled;
    renderDcaSizing();
    return;
  }
  const kellyEntry = findKellyEntry(ticker, strategy);
  if (kellyEntry) {
    const recommended = calculateKelly(kellyEntry).recommendedPct;
    if (Number.isFinite(Number(recommended))) {
      els.dcaAllocationPct.value = rawNumber(recommended);
    }
  }
  const openTrade = findExactOpenTradeForDca(ticker, strategy);
  if (openTrade) {
    els.dcaEntryPrice.value = rawNumber(normalizeDcaEntryPrice(openTrade.entry_price));
    els.dcaEntryPrice.dataset.autoFilled = "true";
  } else {
    els.dcaEntryPrice.value = "";
    delete els.dcaEntryPrice.dataset.autoFilled;
  }
  const stat = findBacktestStat(ticker, strategy);
  const maxLoss = Math.abs(Number(stat?.max_loss_pct));
  if (Number.isFinite(maxLoss) && maxLoss > 0) {
    els.dcaMaxLossPct.value = rawNumber(maxLoss);
  }
  renderDcaSuggestionPreview();
  renderDcaSizing();
}

function readDcaSizingInputs() {
  const ticker = els.dcaSizingTicker.value.trim().toUpperCase();
  const strategy = els.dcaSizingStrategy.value.trim();
  const stat = ticker ? findBacktestStat(ticker, strategy) : null;
  const avgGainPct = Math.abs(Number(stat?.avg_gain_pct));
  const avgLossPct = Math.abs(Number(stat?.avg_loss_pct));
  const riskLimitPct = optionalNumber(els.dcaRiskLimitPct.value);
  const distanceMode = els.dcaDistanceMode.value === "priceStep" ? "priceStep" : "percent";
  const priceStepMode = distanceMode === "priceStep" && els.dcaPriceStepMode.value === "fixed"
    ? "fixed"
    : "custom";
  return {
    ticker,
    strategy,
    initialCapital: optionalNumber(els.dcaInitialCapital.value),
    allocationPct: optionalNumber(els.dcaAllocationPct.value),
    entryPrice: normalizeDcaEntryPrice(els.dcaEntryPrice.value),
    distanceMode,
    priceStepMode,
    fixedPriceStep: optionalNumber(els.dcaFixedPriceStep.value),
    maxLossPct: optionalNumber(els.dcaMaxLossPct.value),
    riskLimitPct: riskLimitPct === null ? DEFAULT_DCA_RISK_LIMIT_PCT : Math.max(0, riskLimitPct),
    avgLossPct: Number.isFinite(avgLossPct) && avgLossPct > 0 ? avgLossPct : null,
    avgGainPct: Number.isFinite(avgGainPct) && avgGainPct > 0 ? avgGainPct : null,
    lotSize: Math.max(1, Math.floor(optionalNumber(els.dcaLotSize.value) || 1)),
    priceStep: Math.max(0, Number(optionalNumber(els.dcaPriceStep.value) || 0)),
  };
}

function dcaLevelDistance(level, index, inputs) {
  if (index > 0 && inputs.distanceMode === "priceStep" && inputs.priceStepMode === "fixed") {
    return Math.max(0, Number(inputs.fixedPriceStep) || 0);
  }
  return Math.max(0, Number(level.distancePct) || 0);
}

function validDcaLevels(inputs) {
  return state.dcaLevels
    .map((level, index) => ({
      distancePct: dcaLevelDistance(level, index, inputs),
      multiplier: Math.max(0, Number(level.multiplier) || 0),
    }))
    .filter((level) => level.multiplier > 0);
}

function dcaCount() {
  return Math.max(1, Math.floor(optionalNumber(els.dcaCount.value) || Math.max(1, state.dcaLevels.length - 1)));
}

function roundDcaBuyPrice(price, priceStep = optionalNumber(els.dcaPriceStep.value)) {
  const step = Number(priceStep) || 0;
  if (!Number.isFinite(Number(price)) || Number(price) <= 0 || step <= 0) {
    return price;
  }
  return Math.max(step, Math.round(Number(price) / step) * step);
}

function setDcaLevelCount(count) {
  const normalizedCount = Math.max(1, Math.min(20, Math.floor(Number(count) || 1)));
  els.dcaCount.value = String(normalizedCount);
  const targetLength = normalizedCount + 1;
  const nextLevels = state.dcaLevels.slice(0, targetLength);
  while (nextLevels.length < targetLength) {
    const previous = nextLevels[nextLevels.length - 1] || { distancePct: 0, multiplier: 1.2 };
    nextLevels.push({
      distancePct: 0,
      multiplier: Number(previous.multiplier) > 0 ? previous.multiplier : 1.2,
    });
  }
  state.dcaLevels = nextLevels;
}

function applyDcaPreset(presetKey) {
  const preset = DCA_PRESETS[presetKey];
  if (!preset) return;
  const multipliers = preset.multipliers || [];
  state.dcaLevels = state.dcaLevels.map((level, index) => ({
    ...level,
    multiplier: multipliers[index] ?? multipliers[multipliers.length - 1] ?? level.multiplier,
  }));
  renderDcaSuggestionPreview();
  renderDcaSizing();
}

function markDcaPresetCustom() {
  if (els.dcaPreset) {
    els.dcaPreset.value = "custom";
  }
}

function renderDcaPriceStepControls() {
  const isPriceStep = els.dcaDistanceMode.value === "priceStep";
  const isFixed = isPriceStep && els.dcaPriceStepMode.value === "fixed";
  els.dcaPriceStepModeLabel.hidden = !isPriceStep;
  els.dcaFixedPriceStepLabel.hidden = !isFixed;
  els.dcaPriceStepMode.disabled = !isPriceStep;
  els.dcaFixedPriceStep.disabled = !isFixed;
}

function dcaBacktestLossRange() {
  const ticker = els.dcaSizingTicker.value.trim().toUpperCase();
  const strategy = els.dcaSizingStrategy.value.trim();
  const stat = ticker ? findBacktestStat(ticker, strategy) : null;
  const avgLoss = Math.abs(Number(stat?.avg_loss_pct));
  const maxLoss = Math.abs(Number(stat?.max_loss_pct));
  if (!Number.isFinite(avgLoss) || !Number.isFinite(maxLoss) || avgLoss <= 0 || maxLoss <= avgLoss) {
    return null;
  }
  return { avgLoss, maxLoss };
}

function suggestedDcaDistances(distanceScale = 1) {
  const range = dcaBacktestLossRange();
  if (!range) return null;
  const count = dcaCount();
  const baseStep = (range.maxLoss - range.avgLoss) / count;
  const scale = Math.max(0, Number(distanceScale) || 1);
  const step = baseStep * scale;
  const entryPrice = normalizeDcaEntryPrice(els.dcaEntryPrice.value);
  const usePriceStep = els.dcaDistanceMode.value === "priceStep";
  if (!Number.isFinite(Number(entryPrice)) || Number(entryPrice) <= 0) {
    return { error: t("dcaSuggestionMissingEntryPrice") };
  }
  const priceStep = optionalNumber(els.dcaPriceStep.value);
  const roundedEntryPrice = roundDcaBuyPrice(entryPrice, priceStep);
  const distances = [{ distancePct: 0, cumulativeLoss: 0, buyPrice: roundedEntryPrice }];
  let previousPrice = roundedEntryPrice;
  for (let index = 1; index <= count; index += 1) {
    const targetPrice = roundDcaBuyPrice(previousPrice * (1 - step / 100), priceStep);
    const cumulativeLoss = roundedEntryPrice > 0
      ? (1 - targetPrice / roundedEntryPrice) * 100
      : step * index;
    let distance = step;
    if (usePriceStep) {
      distance = previousPrice - targetPrice;
    }
    previousPrice = targetPrice;
    distances.push({
      distancePct: Math.max(0, distance),
      cumulativeLoss,
      buyPrice: targetPrice,
    });
  }
  return { ...range, count, step, baseStep, scale, distances, priceStep: Number(priceStep) || 0 };
}

function renderDcaSuggestionPreview(message = "") {
  if (message) {
    els.dcaSuggestionNote.textContent = message;
    return;
  }
  if (!els.dcaSizingTicker.value.trim()) {
    els.dcaSuggestionNote.textContent = "-";
    return;
  }
  const suggestion = suggestedDcaDistances();
  if (!suggestion || suggestion.error) {
    els.dcaSuggestionNote.textContent = suggestion?.error || t("dcaSuggestionMissingBacktest");
    return;
  }
  els.dcaSuggestionNote.textContent = t("dcaSuggestionApplied")
    .replace("{avg}", rawNumber(suggestion.avgLoss))
    .replace("{max}", rawNumber(suggestion.maxLoss))
    .replace("{count}", String(suggestion.count))
    .replace("{step}", rawNumber(suggestion.step))
    + (suggestion.priceStep > 0
      ? t("dcaSuggestionRounded").replace("{step}", formatPrice(suggestion.priceStep))
      : "");
}

function applyDcaSuggestion(distanceScale = 1) {
  const suggestion = suggestedDcaDistances(distanceScale);
  if (!suggestion || suggestion.error) {
    renderDcaSuggestionPreview(suggestion?.error || t("dcaSuggestionMissingBacktest"));
    return;
  }
  setDcaLevelCount(suggestion.count);
  const previousLevels = state.dcaLevels;
  state.dcaLevels = suggestion.distances.map((distance, index) => ({
    distancePct: distance.distancePct,
    multiplier: previousLevels[index]?.multiplier || (index === 0 ? 1 : 1.2),
  }));
  if (els.dcaDistanceMode.value === "priceStep" && els.dcaPriceStepMode.value === "fixed") {
    const firstDistance = suggestion.distances.find((distance, index) => index > 0 && distance.distancePct > 0);
    if (firstDistance) {
      els.dcaFixedPriceStep.value = rawNumber(firstDistance.distancePct);
    }
  }
  renderDcaSizing();
  if (distanceScale === 0.5) {
    renderDcaSuggestionPreview(
      t("dcaHalfSuggestionApplied")
        .replace("{step}", rawNumber(suggestion.step))
        .replace("{base}", rawNumber(suggestion.baseStep))
    );
  }
}

function calculateDcaSizing(inputs) {
  const levels = validDcaLevels(inputs);
  const allocatedCapital =
    Number(inputs.initialCapital) * Number(inputs.allocationPct) / 100;
  if (
    !Number.isFinite(allocatedCapital) ||
    allocatedCapital <= 0 ||
    !Number.isFinite(Number(inputs.entryPrice)) ||
    Number(inputs.entryPrice) <= 0 ||
    !levels.length ||
    (
      inputs.distanceMode === "priceStep" &&
      inputs.priceStepMode === "fixed" &&
      (!Number.isFinite(Number(inputs.fixedPriceStep)) || Number(inputs.fixedPriceStep) <= 0)
    )
  ) {
    return { valid: false, rows: [], note: t("dcaSizingInvalidNote") };
  }

  let previousPrice = roundDcaBuyPrice(Number(inputs.entryPrice), inputs.priceStep);
  let volumeFactor = 1;
  const plannedRows = [];
  for (const [index, level] of levels.entries()) {
    const distance = Math.max(0, Number(level.distancePct) || 0);
    if (index > 0) {
      previousPrice = inputs.distanceMode === "priceStep"
        ? previousPrice - distance
        : previousPrice * (1 - distance / 100);
      previousPrice = roundDcaBuyPrice(previousPrice, inputs.priceStep);
    }
    if (!Number.isFinite(previousPrice) || previousPrice <= 0) {
      return { valid: false, rows: [], note: t("dcaSizingInvalidNote") };
    }
    if (index > 0) {
      volumeFactor *= Math.max(0, Number(level.multiplier) || 0);
    }
    plannedRows.push({
      index: index + 1,
      distancePct: distance,
      multiplier: level.multiplier,
      buyPrice: previousPrice,
      volumeFactor,
    });
  }

  const factorCost = plannedRows.reduce((sum, row) => sum + row.buyPrice * row.volumeFactor, 0);
  const baseRawShares = factorCost > 0 ? allocatedCapital / factorCost : 0;
  const baseShares = Math.floor(baseRawShares / inputs.lotSize) * inputs.lotSize;

  let previousShares = baseShares;
  const rows = plannedRows.map((row, index) => {
    const shares = index === 0
      ? baseShares
      : Math.floor((previousShares * row.multiplier) / inputs.lotSize) * inputs.lotSize;
    previousShares = shares;
    const cost = shares * row.buyPrice;
    return {
      index: row.index,
      distancePct: row.distancePct,
      multiplier: row.multiplier,
      buyPrice: row.buyPrice,
      shares,
      cost,
      cumulativeAverage: null,
    };
  });
  distributeRemainingCapitalToLastDcaRows(rows, allocatedCapital, inputs.lotSize);

  let cumulativeShares = 0;
  let cumulativeCost = 0;
  rows.forEach((row) => {
    cumulativeShares += row.shares;
    cumulativeCost += row.cost;
    row.cumulativeAverage = cumulativeShares > 0 ? cumulativeCost / cumulativeShares : null;
  });

  const averagePrice = cumulativeShares > 0 ? cumulativeCost / cumulativeShares : null;
  const maxLossPct = Math.max(0, Number(inputs.maxLossPct) || 0);
  const firstBuyPrice = rows[0]?.buyPrice ?? roundDcaBuyPrice(Number(inputs.entryPrice), inputs.priceStep);
  const riskPrice = Number.isFinite(Number(firstBuyPrice))
    ? roundDcaBuyPrice(Number(firstBuyPrice) * (1 - maxLossPct / 100), inputs.priceStep)
    : null;
  const avgGainPct = Number(inputs.avgGainPct);
  const targetPrice = Number.isFinite(Number(firstBuyPrice)) && Number.isFinite(avgGainPct) && avgGainPct > 0
    ? roundDcaBuyPrice(Number(firstBuyPrice) * (1 + avgGainPct / 100), inputs.priceStep)
    : null;
  const projectedLoss = averagePrice !== null && riskPrice !== null
    ? Math.max(0, (averagePrice - riskPrice) * cumulativeShares)
    : null;
  const avgLossPct = Number(inputs.avgLossPct);
  const actualProjectedLoss = averagePrice !== null && Number.isFinite(avgLossPct) && avgLossPct > 0
    ? Math.max(0, averagePrice * (avgLossPct / 100) * cumulativeShares)
    : null;
  const projectedProfit = averagePrice !== null && targetPrice !== null
    ? (targetPrice - averagePrice) * cumulativeShares
    : null;
  const initialCapital = Number(inputs.initialCapital);
  const riskPctOfCapital = Number.isFinite(initialCapital) && initialCapital > 0 && projectedLoss !== null
    ? Math.abs(projectedLoss) / initialCapital * 100
    : null;
  const riskLimitPct = Math.max(0, Number(inputs.riskLimitPct) || 0);

  return {
    valid: true,
    rows,
    allocatedCapital,
    usedCapital: cumulativeCost,
    cashLeft: allocatedCapital - cumulativeCost,
    totalShares: cumulativeShares,
    averagePrice,
    firstBuyPrice,
    riskPrice,
    targetPrice,
    projectedLoss,
    actualProjectedLoss,
    avgLossPct: Number.isFinite(avgLossPct) && avgLossPct > 0 ? avgLossPct : null,
    projectedProfit,
    riskPctOfCapital,
    riskLimitPct,
    riskLimitExceeded:
      riskPctOfCapital !== null && riskLimitPct > 0 && riskPctOfCapital > riskLimitPct,
    note: t("dcaSizingAutoNote"),
  };
}

function distributeRemainingCapitalToLastDcaRows(rows, allocatedCapital, lotSize) {
  const normalizedLotSize = Math.max(1, Math.floor(Number(lotSize) || 1));
  const targetRows = rows.slice(-2).filter((row) => row && Number(row.buyPrice) > 0);
  if (!targetRows.length) return;

  let usedCapital = rows.reduce((sum, row) => sum + Number(row.cost || 0), 0);
  let remaining = Number(allocatedCapital) - usedCapital;
  if (!Number.isFinite(remaining) || remaining <= 0) return;

  [...targetRows].reverse().forEach((row, index) => {
    const slotsLeft = targetRows.length - index;
    const budget = remaining / slotsLeft;
    const extraShares = Math.floor(budget / row.buyPrice / normalizedLotSize) * normalizedLotSize;
    if (extraShares <= 0) return;
    const extraCost = extraShares * row.buyPrice;
    row.shares += extraShares;
    row.cost += extraCost;
    remaining -= extraCost;
  });

  while (true) {
    const affordableRow = [...targetRows]
      .sort((left, right) => Number(left.buyPrice) - Number(right.buyPrice))
      .find((row) => row.buyPrice * normalizedLotSize <= remaining);
    if (!affordableRow) break;
    const extraCost = affordableRow.buyPrice * normalizedLotSize;
    affordableRow.shares += normalizedLotSize;
    affordableRow.cost += extraCost;
    remaining -= extraCost;
  }
}

function renderDcaSizing() {
  renderDcaPriceStepControls();
  const inputs = readDcaSizingInputs();
  const result = calculateDcaSizing(inputs);
  renderDcaLevelsTable(result.rows || [], inputs);
  renderDcaSuggestionPreview();

  if (!result.valid) {
    els.dcaAllocatedCapital.textContent = "-";
    els.dcaUsedCapital.textContent = "-";
    els.dcaTotalShares.textContent = "-";
    els.dcaAveragePrice.textContent = "-";
    els.dcaRiskPrice.textContent = "-";
    els.dcaTargetPrice.textContent = "-";
    els.dcaProjectedLoss.textContent = "-";
    els.dcaActualProjectedLoss.textContent = "-";
    els.dcaProjectedProfit.textContent = "-";
    els.dcaRiskBudget.textContent = "-";
    els.dcaCashLeft.textContent = "-";
    els.dcaRiskAlert.hidden = true;
    els.dcaRiskAlert.textContent = "";
    els.dcaSizingNote.textContent = result.note;
    return;
  }

  els.dcaAllocatedCapital.textContent = formatVnd(result.allocatedCapital);
  els.dcaUsedCapital.textContent = formatVnd(result.usedCapital);
  els.dcaTotalShares.textContent = formatPrice(result.totalShares);
  els.dcaAveragePrice.textContent = formatPrice(result.averagePrice);
  els.dcaRiskPrice.textContent = formatPrice(result.riskPrice);
  els.dcaTargetPrice.textContent = formatPrice(result.targetPrice);
  els.dcaProjectedLoss.innerHTML = formatSignedVnd(-Math.abs(result.projectedLoss || 0));
  els.dcaActualProjectedLoss.innerHTML = formatSignedVnd(
    result.actualProjectedLoss === null ? null : -Math.abs(result.actualProjectedLoss || 0)
  );
  els.dcaProjectedProfit.innerHTML = formatSignedVnd(result.projectedProfit);
  els.dcaRiskBudget.innerHTML = formatSignedPercent(-Math.abs(result.riskPctOfCapital || 0));
  els.dcaCashLeft.textContent = formatVnd(result.cashLeft);
  els.dcaRiskAlert.hidden = !result.riskLimitExceeded;
  els.dcaRiskAlert.textContent = result.riskLimitExceeded
    ? t("dcaRiskExceeded")
        .replace("{risk}", rawNumber(result.riskPctOfCapital))
        .replace("{limit}", rawNumber(result.riskLimitPct))
    : "";
  els.dcaSizingNote.textContent = result.note;
}

function renderDcaLevelsTable(calculatedRows = [], inputs = readDcaSizingInputs()) {
  const calculatedByIndex = new Map(calculatedRows.map((row) => [row.index, row]));
  const fixedPriceStepMode = inputs.distanceMode === "priceStep" && inputs.priceStepMode === "fixed";
  els.dcaLevelsTable.innerHTML = state.dcaLevels
    .map((level, index) => {
      const row = calculatedByIndex.get(index + 1) || {};
      const displayedDistance = fixedPriceStepMode
        ? dcaLevelDistance(level, index, inputs)
        : level.distancePct;
      const distanceDisabled = fixedPriceStepMode ? "disabled" : "";
      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <input class="dcaLevelInput" data-dca-level-index="${index}" data-dca-level-field="distancePct" min="0" max="99" step="0.01" type="number" value="${escapeHtml(rawNumber(displayedDistance))}" ${distanceDisabled} />
          </td>
          <td>
            <input class="dcaLevelInput" data-dca-level-index="${index}" data-dca-level-field="multiplier" min="0" step="0.01" type="number" value="${escapeHtml(rawNumber(level.multiplier))}" />
          </td>
          <td>${formatPrice(row.buyPrice)}</td>
          <td>${formatPrice(row.shares)}</td>
          <td>${formatVnd(row.cost)}</td>
          <td>${formatPrice(row.cumulativeAverage)}</td>
        </tr>
      `;
    })
    .join("");
  els.dcaLevelsTable.querySelectorAll("[data-dca-level-index]").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.dcaLevelIndex);
      const field = input.dataset.dcaLevelField;
      state.dcaLevels[index][field] = optionalNumber(input.value) ?? 0;
      if (field === "multiplier") {
        markDcaPresetCustom();
      }
      renderDcaSizing();
    });
  });
}

function normalizeDcaPlan(plan) {
  return {
    id: plan.id,
    userId: plan.user_id ?? plan.userId,
    ticker: String(plan.ticker || "").trim().toUpperCase(),
    strategy: String(plan.strategy || "").trim(),
    initialCapital: optionalNumber(plan.initialCapital ?? plan.initial_capital),
    allocationPct: optionalNumber(plan.allocationPct ?? plan.allocation_pct),
    entryPrice: optionalNumber(plan.entryPrice ?? plan.entry_price),
    distanceMode: plan.distanceMode || plan.distance_mode || "percent",
    maxLossPct: optionalNumber(plan.maxLossPct ?? plan.max_loss_pct),
    lotSize: optionalNumber(plan.lotSize ?? plan.lot_size),
    priceStep: optionalNumber(plan.priceStep ?? plan.price_step ?? plan.result?.priceStep),
    priceStepMode: String(plan.priceStepMode || plan.price_step_mode || plan.result?.priceStepMode || "").trim(),
    fixedPriceStep: optionalNumber(plan.fixedPriceStep ?? plan.fixed_price_step ?? plan.result?.fixedPriceStep),
    levels: Array.isArray(plan.levels) ? plan.levels : [],
    result: plan.result && typeof plan.result === "object" ? plan.result : {},
    createdAt: plan.createdAt || plan.created_at || "",
    updatedAt: plan.updatedAt || plan.updated_at || "",
  };
}

function normalizeDcaSettings(settings = {}) {
  return {
    userId: settings.userId ?? settings.user_id ?? null,
    initialCapital: optionalNumber(settings.initialCapital ?? settings.initial_capital),
    updatedAt: settings.updatedAt || settings.updated_at || "",
  };
}

function applyDcaSettingsToForm({ force = false } = {}) {
  if (!featureEnabled("dcaSizing")) return;
  const savedCapital = optionalNumber(state.dcaSettings?.initialCapital);
  if (savedCapital === null) return;
  if (!force && els.dcaInitialCapital.dataset.dirty === "true") return;
  els.dcaInitialCapital.value = formatDcaInitialCapitalValue(savedCapital);
  delete els.dcaInitialCapital.dataset.dirty;
}

async function saveDcaInitialCapital() {
  window.clearTimeout(dcaInitialCapitalSaveTimer);
  if (!featureEnabled("dcaSizing")) return;
  const valueAtSave = els.dcaInitialCapital.value;
  const response = await fetch("/api/dca-settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      initialCapital: optionalNumber(valueAtSave),
    }),
  });
  if (!response.ok) return;
  const payload = await response.json();
  state.dcaSettings = normalizeDcaSettings(payload.dca_settings);
  if (els.dcaInitialCapital.value === valueAtSave) {
    delete els.dcaInitialCapital.dataset.dirty;
  }
}

function scheduleDcaInitialCapitalSave() {
  els.dcaInitialCapital.dataset.dirty = "true";
  window.clearTimeout(dcaInitialCapitalSaveTimer);
  dcaInitialCapitalSaveTimer = window.setTimeout(saveDcaInitialCapital, 700);
}

function saveDcaRiskLimitPreference() {
  const riskLimit = optionalNumber(els.dcaRiskLimitPct.value);
  if (riskLimit === null) {
    localStorage.removeItem(DCA_RISK_LIMIT_STORAGE_KEY);
    return;
  }
  localStorage.setItem(DCA_RISK_LIMIT_STORAGE_KEY, rawNumber(Math.max(0, riskLimit)));
}

function dcaPlanLevelsForEdit(plan) {
  const savedLevels = Array.isArray(plan?.levels) ? plan.levels : [];
  if (savedLevels.length) {
    return savedLevels.map((level, index) => ({
      distancePct: optionalNumber(level.distancePct ?? level.distance_pct) ?? 0,
      multiplier: optionalNumber(level.multiplier) ?? (index === 0 ? 1 : 0),
    }));
  }
  const rows = Array.isArray(plan?.result?.rows) ? plan.result.rows : [];
  return rows.map((row, index) => ({
    distancePct: optionalNumber(row.distancePct ?? row.distance_pct) ?? 0,
    multiplier: optionalNumber(row.multiplier) ?? (index === 0 ? 1 : 0),
  }));
}

function renderDcaEditState() {
  const editing = Boolean(state.activeDcaPlanId);
  els.saveDcaPlan.textContent = t(editing ? "updateDcaPlan" : "saveDcaPlan");
  if (els.cancelDcaPlanEdit) {
    els.cancelDcaPlanEdit.hidden = !editing;
  }
  els.dcaSizingForm.dataset.editingPlanId = editing ? String(state.activeDcaPlanId) : "";
}

function cancelDcaPlanEdit() {
  state.activeDcaPlanId = "";
  renderDcaEditState();
  renderDcaPlans();
}

function editDcaPlan(planId) {
  const plan = (state.dcaPlans || []).map(normalizeDcaPlan)
    .find((item) => Number(item.id) === Number(planId));
  if (!plan) return;
  state.activeDcaPlanId = String(plan.id);
  els.dcaSizingTicker.value = plan.ticker || "";
  updateDcaSizingStrategyOptions(
    [...state.performanceStrategies, ...state.backtestStats, ...state.kellyEntries],
    plan.strategy || ""
  );
  els.dcaSizingStrategy.value = plan.strategy || "";
  els.dcaInitialCapital.value = formatDcaInitialCapitalValue(plan.initialCapital);
  els.dcaAllocationPct.value = rawNumber(plan.allocationPct);
  els.dcaEntryPrice.value = rawNumber(plan.entryPrice);
  els.dcaDistanceMode.value = plan.distanceMode === "priceStep" ? "priceStep" : "percent";
  els.dcaPriceStepMode.value = plan.distanceMode === "priceStep" && plan.priceStepMode === "fixed"
    ? "fixed"
    : "custom";
  els.dcaMaxLossPct.value = rawNumber(plan.maxLossPct);
  els.dcaLotSize.value = rawNumber(plan.lotSize);
  els.dcaPriceStep.value = rawNumber(plan.priceStep);
  els.dcaFixedPriceStep.value = rawNumber(plan.fixedPriceStep);
  const levels = dcaPlanLevelsForEdit(plan);
  state.dcaLevels = levels.length ? levels : DEFAULT_DCA_LEVELS.map((level) => ({ ...level }));
  els.dcaCount.value = String(Math.max(1, state.dcaLevels.length - 1));
  els.dcaPreset.value = "custom";
  renderDcaEditState();
  renderDcaSizing();
  renderDcaPlans();
  closeDcaPlanDetail();
  els.dcaSizingNote.textContent = t("dcaPlanEditStarted");
  els.dcaSizingForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function saveCurrentDcaPlan() {
  const inputs = readDcaSizingInputs();
  const result = calculateDcaSizing(inputs);
  if (!inputs.ticker || !result.valid) {
    window.alert(t("dcaSizingInvalidNote"));
    return;
  }
  const payload = {
    ticker: inputs.ticker,
    strategy: inputs.strategy,
    initialCapital: inputs.initialCapital,
    allocationPct: inputs.allocationPct,
    entryPrice: inputs.entryPrice,
    distanceMode: inputs.distanceMode,
    maxLossPct: inputs.maxLossPct,
    lotSize: inputs.lotSize,
    levels: (result.rows?.length ? result.rows : state.dcaLevels).map((level) => ({
      distancePct: optionalNumber(level.distancePct) ?? 0,
      multiplier: optionalNumber(level.multiplier) ?? 0,
    })),
    result: {
      allocatedCapital: result.allocatedCapital,
      usedCapital: result.usedCapital,
      cashLeft: result.cashLeft,
      totalShares: result.totalShares,
      averagePrice: result.averagePrice,
      firstBuyPrice: result.firstBuyPrice,
      riskPrice: result.riskPrice,
      targetPrice: result.targetPrice,
      projectedLoss: result.projectedLoss,
      actualProjectedLoss: result.actualProjectedLoss,
      avgLossPct: result.avgLossPct,
      projectedProfit: result.projectedProfit,
      riskPctOfCapital: result.riskPctOfCapital,
      riskLimitPct: result.riskLimitPct,
      riskLimitExceeded: result.riskLimitExceeded,
      priceStep: inputs.priceStep,
      priceStepMode: inputs.priceStepMode,
      fixedPriceStep: inputs.fixedPriceStep,
      rows: result.rows,
    },
  };
  const editingPlanId = state.activeDcaPlanId;
  const response = await fetch(
    editingPlanId
      ? `/api/dca-plans/${encodeURIComponent(editingPlanId)}`
      : "/api/dca-plans",
    {
      method: editingPlanId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!response.ok) {
    window.alert(t("dcaPlanSaveFailed"));
    return;
  }
  const saved = await response.json();
  const savedPlan = normalizeDcaPlan(saved.dca_plan);
  state.dcaPlans = [
    savedPlan,
    ...state.dcaPlans.filter((plan) => Number(plan.id) !== Number(savedPlan.id)),
  ];
  if (editingPlanId) {
    state.activeDcaPlanId = "";
    renderDcaEditState();
  }
  renderDcaPlans();
  els.dcaSizingNote.textContent = t(editingPlanId ? "dcaPlanUpdated" : "dcaPlanSaved");
}

function renderDcaPlans() {
  if (!featureEnabled("dcaSizing")) {
    els.dcaPlansTable.innerHTML = "";
    return;
  }
  const plans = (state.dcaPlans || []).map(normalizeDcaPlan);
  if (!plans.length) {
    els.dcaPlansTable.innerHTML = `<tr><td class="empty" colspan="11">${t("noDcaPlans")}</td></tr>`;
    return;
  }
  els.dcaPlansTable.innerHTML = plans
    .map((plan) => {
      const result = plan.result || {};
      const openTrade = findOpenTradeForDca(plan.ticker, plan.strategy);
      const hasOpenPosition = Boolean(openTrade);
      const statusClass = hasOpenPosition ? "open" : "neutral";
      const statusLabel = hasOpenPosition ? t("dcaHasOpenPosition") : t("dcaNoOpenPosition");
      const riskExceeded = Boolean(result.riskLimitExceeded);
      const editing = String(state.activeDcaPlanId) === String(plan.id);
      return `
        <tr class="clickableRow ${editing ? "activeRow" : ""}" data-dca-plan-id="${escapeHtml(plan.id)}">
          <td><strong>${escapeHtml(plan.ticker || "-")}</strong></td>
          <td>${escapeHtml(displayStrategyName(plan.strategy) || "-")}</td>
          <td><span class="statusBadge ${statusClass}">${escapeHtml(statusLabel)}</span></td>
          <td>${formatVnd(result.allocatedCapital)}</td>
          <td>${formatPrice(result.totalShares)}</td>
          <td>${formatPrice(result.averagePrice)}</td>
          <td>
            ${formatSignedVnd(-Math.abs(Number(result.projectedLoss) || 0))}
            ${riskExceeded ? `<span class="statusBadge danger">${escapeHtml(t("dcaRiskExceededShort"))}</span>` : ""}
          </td>
          <td>${formatSignedVnd(result.actualProjectedLoss == null ? null : -Math.abs(Number(result.actualProjectedLoss) || 0))}</td>
          <td>${formatSignedVnd(result.projectedProfit)}</td>
          <td>${escapeHtml(formatDate(plan.updatedAt || plan.createdAt))}</td>
          <td>
            <button class="smallButton ghostButton" type="button" data-dca-plan-edit="${escapeHtml(plan.id)}">${escapeHtml(t("edit"))}</button>
            <button class="smallButton ghostButton" type="button" data-dca-plan-delete="${escapeHtml(plan.id)}">${escapeHtml(t("delete"))}</button>
          </td>
        </tr>
      `;
    })
    .join("");
  els.dcaPlansTable.querySelectorAll("[data-dca-plan-id]").forEach((row) => {
    row.addEventListener("click", () => openDcaPlanDetail(row.dataset.dcaPlanId));
  });
  els.dcaPlansTable.querySelectorAll("[data-dca-plan-delete]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteDcaPlan(button.dataset.dcaPlanDelete);
    });
  });
  els.dcaPlansTable.querySelectorAll("[data-dca-plan-edit]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      editDcaPlan(button.dataset.dcaPlanEdit);
    });
  });
}

async function deleteDcaPlan(planId) {
  if (!window.confirm(t("deleteDcaPlanConfirm"))) return;
  const response = await fetch(`/api/dca-plans/${encodeURIComponent(planId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    window.alert(t("deleteDcaPlanFailed"));
    return;
  }
  state.dcaPlans = state.dcaPlans.filter((plan) => Number(plan.id) !== Number(planId));
  if (String(state.activeDcaPlanId) === String(planId)) {
    state.activeDcaPlanId = "";
    renderDcaEditState();
  }
  renderDcaPlans();
}

function openDcaPlanDetail(planId) {
  const plan = (state.dcaPlans || []).map(normalizeDcaPlan)
    .find((item) => Number(item.id) === Number(planId));
  if (!plan) return;
  const result = plan.result || {};
  const rows = Array.isArray(result.rows) ? result.rows : [];
  els.dcaPlanTitle.textContent = plan.ticker || "-";
  els.dcaPlanSubtitle.textContent = `${displayStrategyName(plan.strategy) || "-"} · ${formatDate(plan.updatedAt || plan.createdAt)}`;
  els.dcaPlanBody.innerHTML = `
    ${renderInsightSection(t("dcaSavedTitle"), [
      insightMetric(t("dcaInitialCapital"), formatVnd(plan.initialCapital)),
      insightMetric(t("dcaAllocationPct"), formatKellyPercent(plan.allocationPct)),
      insightMetric(t("dcaEntryPrice"), formatPrice(plan.entryPrice)),
      insightMetric(t("dcaDistanceMode"), plan.distanceMode === "priceStep" ? t("dcaDistanceModePriceStep") : t("dcaDistanceModePercent")),
      insightMetric(t("dcaPriceStepMode"), plan.distanceMode === "priceStep"
        ? t(plan.priceStepMode === "fixed" ? "dcaPriceStepModeFixed" : "dcaPriceStepModeCustom")
        : "-"),
      insightMetric(t("dcaFixedPriceStep"), plan.priceStepMode === "fixed" ? formatPrice(plan.fixedPriceStep) : "-"),
      insightMetric(t("dcaMaxLossPct"), formatKellyPercent(plan.maxLossPct)),
      insightMetric(t("dcaLotSize"), formatPrice(plan.lotSize)),
      insightMetric(t("dcaPriceStep"), formatPrice(plan.priceStep)),
    ])}
    ${renderInsightSection(t("dcaSizingTitle"), [
      insightMetric(t("dcaAllocatedCapital"), formatVnd(result.allocatedCapital)),
      insightMetric(t("dcaUsedCapital"), formatVnd(result.usedCapital)),
      insightMetric(t("dcaTotalShares"), formatPrice(result.totalShares)),
      insightMetric(t("dcaAveragePrice"), formatPrice(result.averagePrice)),
      insightMetric(t("dcaRiskPrice"), formatPrice(result.riskPrice)),
      insightMetric(t("dcaTargetPrice"), formatPrice(result.targetPrice)),
      insightMetric(t("dcaProjectedLoss"), formatSignedVnd(-Math.abs(Number(result.projectedLoss) || 0))),
      insightMetric(
        t("dcaActualProjectedLoss"),
        formatSignedVnd(result.actualProjectedLoss == null ? null : -Math.abs(Number(result.actualProjectedLoss) || 0))
      ),
      insightMetric(t("dcaProjectedProfit"), formatSignedVnd(result.projectedProfit)),
      insightMetric(t("dcaRiskBudget"), formatSignedPercent(-Math.abs(Number(result.riskPctOfCapital) || 0))),
      insightMetric(t("dcaRiskLimitPct"), formatKellyPercent(result.riskLimitPct)),
    ])}
    ${renderDcaPlanRows(rows)}
  `;
  els.dcaPlanModal.hidden = false;
}

function renderDcaPlanRows(rows) {
  if (!rows.length) return "";
  return `
    <section class="insightSection">
      <h3>${escapeHtml(t("dcaLevelsTitle"))}</h3>
      <div class="tableWrap compactTable">
        <table>
          <thead>
            <tr>
              <th>${escapeHtml(t("dcaLevel"))}</th>
              <th>${escapeHtml(t("dcaDistanceValue"))}</th>
              <th>${escapeHtml(t("dcaMultiplier"))}</th>
              <th>${escapeHtml(t("dcaBuyPrice"))}</th>
              <th>${escapeHtml(t("dcaShares"))}</th>
              <th>${escapeHtml(t("dcaCost"))}</th>
              <th>${escapeHtml(t("dcaCumulativeAverage"))}</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.index)}</td>
                <td>${formatPrice(row.distancePct)}</td>
                <td>${formatPrice(row.multiplier)}</td>
                <td>${formatPrice(row.buyPrice)}</td>
                <td>${formatPrice(row.shares)}</td>
                <td>${formatVnd(row.cost)}</td>
                <td>${formatPrice(row.cumulativeAverage)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function closeDcaPlanDetail() {
  els.dcaPlanModal.hidden = true;
  els.dcaPlanBody.innerHTML = "";
}

function updateKellySavedStrategyFilterOptions(entries) {
  const currentValue = els.kellyStrategyFilter.value;
  const strategies = uniqueStrategyNames([
    ...(entries || []).map((entry) => entry.strategy),
    ...state.performanceStrategies,
  ]);

  els.kellyStrategyFilter.replaceChildren();
  els.kellyStrategyFilter.append(new Option(t("allStrategies"), ""));
  strategies.forEach((strategy) => {
    els.kellyStrategyFilter.append(new Option(displayStrategyName(strategy), strategy));
  });
  els.kellyStrategyFilter.value = strategies.includes(currentValue) ? currentValue : "";
}

function kellyEntryUsageCount(entry) {
  const ticker = String(entry.ticker || "").trim().toUpperCase();
  const strategy = String(entry.strategy || "").trim();
  if (!ticker) return 0;
  return state.openTrades.filter((trade) => {
    if (String(trade.ticker || "").trim().toUpperCase() !== ticker) return false;
    return strategy ? String(trade.strategy || "").trim() === strategy : true;
  }).length;
}

function loadKellyEntry(entryKey) {
  const entry = loadKellyEntries().find(
    (item) => kellyEntryKey(item.ticker, item.strategy) === entryKey
  );
  if (!entry) return;
  state.activeKellyEntryKey = entryKey;
  els.kellyTicker.value = entry.ticker || "";
  updateKellyStrategyOptions(state.performanceStrategies, entry.strategy || "");
  els.kellyStrategy.value = entry.strategy || "";
  els.kellyWinRate.value = rawNumber(entry.winRate);
  els.kellyWinningTrades.value = rawNumber(entry.winningTrades);
  els.kellyTotalTrades.value = rawNumber(entry.totalTrades);
  els.kellyProfitFactor.value = rawNumber(entry.profitFactor);
  els.kellyMaxDrawdown.value = rawNumber(entry.maxDrawdown);
  els.kellyTargetDrawdown.value = rawNumber(entry.targetDrawdown);
  els.kellyFraction.value = rawNumber(entry.fraction);
  els.kellyMaxAllocation.value = rawNumber(entry.maxAllocation);
  renderKellyCalculator();
}

async function deleteKellyEntry(entryKey) {
  if (!window.confirm(t("deleteKellyEntryConfirm"))) return;
  const entry = loadKellyEntries().find(
    (item) => kellyEntryKey(item.ticker, item.strategy) === entryKey
  );
  if (entry?.id) {
    const response = await fetch(`/api/kelly-entries/${encodeURIComponent(entry.id)}`, {
      method: "DELETE",
    });
    if (!response.ok) return;
  }
  const entries = loadKellyEntries().filter(
    (entry) => kellyEntryKey(entry.ticker, entry.strategy) !== entryKey
  );
  saveKellyEntries(entries);
  if (state.activeKellyEntryKey === entryKey) {
    state.activeKellyEntryKey = "";
  }
  renderKellyEntries();
  refresh();
}

function calculateKelly(inputs) {
  const tradesWinRate =
    inputs.totalTrades > 0 && inputs.winningTrades >= 0
      ? (inputs.winningTrades / inputs.totalTrades) * 100
      : null;
  const winRatePct = Number.isFinite(inputs.winRate) ? inputs.winRate : tradesWinRate;
  const p = clamp(Number(winRatePct) / 100, 0, 1);
  const q = 1 - p;
  const profitFactor = Number(inputs.profitFactor);
  const fraction = clamp(Number(inputs.fraction ?? 50), 0, 100) / 100;
  const maxAllocation = clamp(Number(inputs.maxAllocation ?? 100), 0, 100);
  const maxDrawdown = Number(inputs.maxDrawdown);
  const targetDrawdown = Number(inputs.targetDrawdown);

  if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(profitFactor) || profitFactor <= 0) {
    return emptyKellyResult(t("kellyInvalidNote"));
  }

  const winLossRatio =
    q > 0 ? profitFactor * (q / p) : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(winLossRatio) || winLossRatio <= 0) {
    return emptyKellyResult(t("kellyInvalidNote"));
  }

  const fullKelly = p - q / winLossRatio;
  const usableKelly = Math.max(0, fullKelly);
  const drawdownFactor =
    Number.isFinite(maxDrawdown) && maxDrawdown > 0 && Number.isFinite(targetDrawdown) && targetDrawdown > 0
      ? Math.min(1, targetDrawdown / maxDrawdown)
      : 1;
  const recommended = Math.min(usableKelly * fraction * drawdownFactor * 100, maxAllocation);
  const note = usableKelly <= 0 ? t("kellyNegativeNote") : t("kellyPositiveNote");

  return {
    fullKellyPct: fullKelly * 100,
    halfKellyPct: usableKelly * 50,
    quarterKellyPct: usableKelly * 25,
    recommendedPct: Math.max(0, recommended),
    winLossRatio,
    edgePct: (p * winLossRatio - q) * 100,
    drawdownFactor,
    note,
  };
}

function emptyKellyResult(note) {
  return {
    fullKellyPct: null,
    halfKellyPct: null,
    quarterKellyPct: null,
    recommendedPct: null,
    winLossRatio: null,
    edgePct: null,
    drawdownFactor: null,
    note,
  };
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function applyTranslations() {
  document.documentElement.lang = state.language;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  els.refresh.title = t("refresh");
  els.openPositionTickerFilter.placeholder = t("openPositionTickerPlaceholder");
  updateOpenPositionStrategyFilterOptions(state.openTrades);
  els.performanceTickerFilter.placeholder = t("performanceTickerPlaceholder");
  els.backtestTickerSearch.placeholder = t("backtestSearchPlaceholder");
  updatePerformanceStrategyFilterOptions([...state.performanceStrategies, ...state.backtestStats]);
  if (!state.selectedTicker) {
    els.chartTitle.textContent = t("noTickerSelected");
  }
  if (els.lastUpdated.dataset.empty === "true") {
    els.lastUpdated.textContent = t("waitingWebhook");
  }
  updateClosedTradesFilterLabel();
  updateThemeButton();
  renderSummary(state.summary);
  renderUserAttention();
  renderRecentTradeBanner();
  renderRiskOverview();
  renderRiskAlerts();
  renderKellyCalculator();
  renderKellyEntries();
  renderBacktestStats(filterBacktestStats(state.backtestStats));
  renderDcaEditState();
  renderDcaSizing();
  renderDcaPlans();
  renderAverageLossBanner();
  renderAverageGainBanner();
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  updateThemeButton();
  if (priceChartState.chart) {
    applyPriceChartTheme();
  } else if (state.selectedTicker) {
    renderChart(state.selectedTicker);
  }
  if (state.activeTab === "performance") {
    drawEquityCurve(state.closedTrades);
  }
  if (state.activeTab === "manualPortfolio") {
    drawManualEquityCurve(state.manualPortfolio.equity_curve || []);
  }
  if (state.activeTab === "derivatives") {
    drawDerivativeEquityCurve(state.derivatives.equity_curve || []);
  }
}

function updateThemeButton() {
  const isDark = state.theme === "dark";
  els.themeToggle.textContent = isDark ? t("lightMode") : t("darkMode");
  els.themeToggle.title = isDark ? t("lightMode") : t("darkMode");
}

function setActiveTab(tabName) {
  const exists = [...els.tabButtons].some(
    (button) =>
      button.dataset.tabTarget === tabName && button.dataset.accessHidden !== "true"
  );
  if (!exists) {
    tabName =
      [...els.tabButtons].find((button) => button.dataset.accessHidden !== "true")
        ?.dataset.tabTarget || "overview";
  }
  state.activeTab = tabName;
  localStorage.setItem("dashboardActiveTab", tabName);
  els.tabButtons.forEach((button) => {
    const active = button.dataset.tabTarget === tabName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  els.tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.tabPanel === tabName);
  });
  if (tabName === "overview" && state.selectedTicker) {
    renderChart(state.selectedTicker);
  }
  if (tabName === "performance") {
    drawEquityCurve(state.closedTrades);
  }
  if (tabName === "manualPortfolio") {
    drawManualEquityCurve(state.manualPortfolio.equity_curve || []);
  }
  if (tabName === "derivatives") {
    drawDerivativeEquityCurve(state.derivatives.equity_curve || []);
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (response.status === 401) {
    showLogin();
  }
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

function featureEnabled(feature) {
  if (!state.user) return false;
  if (state.user.role === "admin") return true;
  const required = Array.isArray(feature) ? feature : [feature];
  return required.some((item) => state.user.features.includes(item));
}

function featureFetch(feature, url, fallback) {
  return featureEnabled(feature) ? fetchJson(url) : Promise.resolve(fallback);
}

async function bootstrapAuth() {
  try {
    const payload = await fetchJson("/api/auth/me");
    if (!payload.user) {
      showLogin();
      return;
    }
    setAuthenticatedUser(payload.user, payload.available_features || [], payload.available_strategies || []);
    await refresh();
  } catch (error) {
    showLogin();
  }
}

function setAuthenticatedUser(user, availableFeatures, availableStrategies = []) {
  state.user = user;
  state.availableFeatures = availableFeatures.length ? availableFeatures : Object.keys(FEATURE_LABELS);
  state.availableStrategies = availableStrategies || [];
  els.loginScreen.hidden = true;
  els.currentUser.textContent = user.username;
  els.currentUser.dataset.initial = user.username.slice(0, 1).toUpperCase();
  document.body.classList.toggle("readOnly", user.role !== "admin");
  applyAccessControl();
  if (user.role === "admin") {
    renderFeatureSelector(els.newUserFeatures, state.availableFeatures);
    renderStrategySelector(els.newUserStrategies);
    loadAdminUsers();
  }
}

function showLogin() {
  state.user = null;
  state.dcaSettings = { initialCapital: null, updatedAt: "" };
  els.dcaInitialCapital.value = formatDcaInitialCapitalValue(els.dcaInitialCapital.defaultValue || "");
  delete els.dcaInitialCapital.dataset.dirty;
  els.loginScreen.hidden = false;
  els.loginPassword.value = "";
  els.loginUsername.focus();
}

async function submitLogin(event) {
  event.preventDefault();
  els.loginError.hidden = true;
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: els.loginUsername.value.trim(),
      password: els.loginPassword.value,
    }),
  });
  if (!response.ok) {
    els.loginError.textContent = "Sai tài khoản hoặc mật khẩu";
    els.loginError.hidden = false;
    return;
  }
  const payload = await response.json();
  const me = await fetchJson("/api/auth/me");
  setAuthenticatedUser(payload.user, me.available_features || [], me.available_strategies || []);
  await refresh();
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  els.accountMenu.open = false;
  showLogin();
}

function applyAccessControl() {
  const allowed = new Set(state.user?.features || []);
  const isAdmin = state.user?.role === "admin";
  document.querySelectorAll("[data-tab-target]").forEach((button) => {
    const target = button.dataset.tabTarget;
    const visible = target === "admin" ? isAdmin : isAdmin || allowed.has(target);
    button.dataset.accessHidden = visible ? "false" : "true";
  });
  document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
    const target = panel.dataset.tabPanel;
    const visible = target === "admin" ? isAdmin : isAdmin || allowed.has(target);
    panel.dataset.accessHidden = visible ? "false" : "true";
  });
  [
    els.openPositionRefreshPrices,
    els.manualPositionForm,
    els.manualRefreshPrices,
    els.manualRecordDailyPerformance,
    els.dividendEventForm,
    els.derivativeCapitalForm,
    document.querySelector(".exportActions"),
  ].forEach((element) => element?.classList.add("adminOnly"));
  setActiveTab(state.activeTab);
}

function renderFeatureSelector(container, selectedFeatures = []) {
  const selected = new Set(selectedFeatures);
  container.innerHTML = state.availableFeatures
    .map((feature) => `
      <label class="featureOption">
        <input type="checkbox" value="${escapeHtml(feature)}" ${selected.has(feature) ? "checked" : ""} />
        <span>${escapeHtml(FEATURE_LABELS[feature] || feature)}</span>
      </label>
    `)
    .join("");
}

function selectedFeatures(container) {
  return [...container.querySelectorAll('input[type="checkbox"]:checked')].map(
    (input) => input.value
  );
}

function renderStrategySelector(container, selectedStrategies = []) {
  const selected = new Set((selectedStrategies || []).map((strategy) => String(strategy).toLowerCase()));
  if (!state.availableStrategies.length) {
    container.innerHTML = `<span class="selectorHint">Chưa có chiến lược. Không chọn = tất cả.</span>`;
    return;
  }
  container.innerHTML = `
    <span class="selectorHint">Chiến lược: không chọn = tất cả</span>
    ${state.availableStrategies
      .map((strategy) => `
        <label class="featureOption">
          <input type="checkbox" value="${escapeHtml(strategy)}" ${selected.has(String(strategy).toLowerCase()) ? "checked" : ""} />
          <span>${escapeHtml(displayStrategyName(strategy))}</span>
        </label>
      `)
      .join("")}
  `;
}

function selectedStrategies(container) {
  return [...container.querySelectorAll('input[type="checkbox"]:checked')].map(
    (input) => input.value
  );
}

async function loadAdminUsers() {
  if (state.user?.role !== "admin") return;
  const payload = await fetchJson("/api/admin/users");
  state.users = payload.users || [];
  state.availableFeatures = payload.available_features || state.availableFeatures;
  state.availableStrategies = payload.available_strategies || state.availableStrategies;
  renderStrategySelector(els.newUserStrategies);
  renderAdminUsers();
}

function renderAdminUsers() {
  els.usersTable.innerHTML = state.users
    .map((user) => `
      <tr data-user-id="${user.id}">
        <td><strong>${escapeHtml(user.username)}</strong></td>
        <td>
          <select data-user-role>
            <option value="user" ${user.role === "user" ? "selected" : ""}>User chỉ xem</option>
            <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
          </select>
        </td>
        <td><div class="featureSelector" data-user-features></div></td>
        <td><div class="strategySelector" data-user-strategies></div></td>
        <td>
          <label class="featureOption">
            <input data-user-active type="checkbox" ${user.active ? "checked" : ""} />
            <span>Hoạt động</span>
          </label>
        </td>
        <td><input data-user-password name="admin-user-new-password-${user.id}" type="password" minlength="8" autocomplete="new-password" placeholder="Để trống nếu giữ nguyên" /></td>
        <td>
          <button class="smallButton" type="button" data-user-save>Lưu</button>
          ${user.id === state.user.id ? "" : `<button class="deleteButton" type="button" data-user-delete>Xóa</button>`}
        </td>
      </tr>
    `)
    .join("");

  state.users.forEach((user) => {
    const row = els.usersTable.querySelector(`[data-user-id="${user.id}"]`);
    renderFeatureSelector(row.querySelector("[data-user-features]"), user.features);
    renderStrategySelector(row.querySelector("[data-user-strategies]"), user.strategies);
    row.querySelector("[data-user-save]").addEventListener("click", () => saveAdminUser(user.id));
    row.querySelector("[data-user-delete]")?.addEventListener("click", () => deleteAdminUser(user.id));
  });
}

async function createAdminUser(event) {
  event.preventDefault();
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: els.newUsername.value.trim(),
      password: els.newPassword.value,
      role: els.newUserRole.value,
      features: selectedFeatures(els.newUserFeatures),
      strategies: selectedStrategies(els.newUserStrategies),
    }),
  });
  if (!response.ok) {
    window.alert((await response.json()).detail || "Không thể tạo tài khoản");
    return;
  }
  els.userCreateForm.reset();
  renderFeatureSelector(els.newUserFeatures, state.availableFeatures);
  renderStrategySelector(els.newUserStrategies);
  await loadAdminUsers();
}

async function saveAdminUser(userId) {
  const row = els.usersTable.querySelector(`[data-user-id="${userId}"]`);
  const password = row.querySelector("[data-user-password]").value;
  const body = {
    role: row.querySelector("[data-user-role]").value,
    active: row.querySelector("[data-user-active]").checked,
    features: selectedFeatures(row.querySelector("[data-user-features]")),
    strategies: selectedStrategies(row.querySelector("[data-user-strategies]")),
  };
  if (password) body.password = password;
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    window.alert((await response.json()).detail || "Không thể cập nhật tài khoản");
    return;
  }
  await loadAdminUsers();
}

async function deleteAdminUser(userId) {
  if (!window.confirm("Xóa tài khoản này?")) return;
  const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
  if (!response.ok) {
    window.alert((await response.json()).detail || "Không thể xóa tài khoản");
    return;
  }
  await loadAdminUsers();
}

function settledPayload(result, fallback, label) {
  if (result.status === "fulfilled") {
    return result.value;
  }
  console.error(`Failed to load ${label}`, result.reason);
  return fallback;
}

async function refresh() {
  if (!state.user) return;
  els.syncStatus.textContent = t("syncing");
  const query = "";
  const performanceQuery = buildPerformanceQuery();
  const results = await Promise.allSettled([
    fetchJson("/api/settings"),
    featureFetch("overview", "/api/summary", { total: 0, buy_count: 0, sell_count: 0, tickers: 0 }),
    featureFetch("overview", `/api/signals${query}`, { signals: [] }),
    featureFetch(["positions", "performance"], "/api/performance", {
      open_trades: [],
      closed_trades: [],
      strategies: [],
      ignored_signals: [],
    }),
    featureFetch("performance", `/api/performance${performanceQuery}`, {
      open_trades: [],
      closed_trades: [],
      strategies: [],
      ignored_signals: [],
    }),
    featureFetch("logs", "/api/invalid-signals", { invalid_signals: [] }),
    featureFetch("manualPortfolio", "/api/manual-portfolio", state.manualPortfolio),
    featureFetch("dividends", "/api/dividend-events", { dividend_events: [], dividend_alerts: [] }),
    featureFetch("derivatives", "/api/derivatives", state.derivatives),
    featureFetch(["performance", "dcaSizing"], "/api/backtest-stats", { backtest_stats: [] }),
    featureFetch(["positions", "performance", "kelly", "dcaSizing"], "/api/kelly-entries", { kelly_entries: state.kellyEntries }),
    featureFetch("dcaSizing", "/api/dca-plans", { dca_plans: state.dcaPlans }),
    featureFetch("dcaSizing", "/api/dca-settings", { dca_settings: state.dcaSettings }),
    featureFetch("portfolioMonitor", "/api/portfolio-backtests/latest", { backtest: null }),
  ]);

  const settingsPayload = settledPayload(
    results[0],
    { default_signal_weight_pct: state.defaultSignalWeightPct },
    "settings"
  );
  const summary = settledPayload(
    results[1],
    { total: 0, buy_count: 0, sell_count: 0, tickers: 0, latest_received_at: null },
    "summary"
  );
  const signalsPayload = settledPayload(results[2], { signals: state.signals }, "signals");
  const positionPayload = settledPayload(
    results[3],
    {
      open_trades: state.openTrades,
      closed_trades: state.closedTrades,
      strategies: [],
      ignored_signals: [],
    },
    "positions"
  );
  const performancePayload = settledPayload(
    results[4],
    {
      open_trades: [],
      closed_trades: [],
      strategies: [],
      ignored_signals: [],
    },
    "performance"
  );
  const invalidPayload = settledPayload(results[5], { invalid_signals: [] }, "invalid signals");
  const manualPayload = settledPayload(results[6], state.manualPortfolio, "manual portfolio");
  const dividendPayload = settledPayload(
    results[7],
    { dividend_events: state.dividendEvents, dividend_alerts: state.dividendAlerts },
    "dividend events"
  );
  const derivativePayload = settledPayload(
    results[8],
    state.derivatives,
    "derivatives"
  );
  const backtestPayload = settledPayload(
    results[9],
    { backtest_stats: state.backtestStats },
    "backtest stats"
  );
  const kellyPayload = settledPayload(
    results[10],
    { kelly_entries: state.kellyEntries },
    "kelly entries"
  );
  const dcaPlansPayload = settledPayload(
    results[11],
    { dca_plans: state.dcaPlans },
    "DCA plans"
  );
  const dcaSettingsPayload = settledPayload(
    results[12],
    { dca_settings: state.dcaSettings },
    "DCA settings"
  );
  const portfolioBacktestPayload = settledPayload(
    results[13],
    { backtest: state.portfolioBacktest },
    "portfolio backtest"
  );

  state.defaultSignalWeightPct = Number(settingsPayload.default_signal_weight_pct) || FALLBACK_SIGNAL_WEIGHT_PCT;
  state.summary = summary;
  state.signals = filterSignalsForWatchlist(signalsPayload.signals || []);
  renderSignals();
  state.backtestStats = backtestPayload.backtest_stats || [];
  state.kellyEntries = await migrateLocalKellyEntriesToDatabase(
    (kellyPayload.kelly_entries || []).map(normalizeKellyEntry)
  );
  state.dcaPlans = (dcaPlansPayload.dca_plans || []).map(normalizeDcaPlan);
  if (
    state.activeDcaPlanId &&
    !state.dcaPlans.some((plan) => String(plan.id) === String(state.activeDcaPlanId))
  ) {
    state.activeDcaPlanId = "";
    renderDcaEditState();
  }
  state.dcaSettings = normalizeDcaSettings(dcaSettingsPayload.dca_settings || {});
  state.portfolioBacktest = portfolioBacktestPayload.backtest || null;
  applyDcaSettingsToForm();
  state.openTrades = positionPayload.open_trades || [];
  updateOpenPositionStrategyFilterOptions(filterTradesForWatchlist(state.openTrades));
  state.performanceStrategies = positionPayload.strategies || [];
  updatePerformanceStrategyFilterOptions([...state.performanceStrategies, ...state.backtestStats]);
  updateDcaSizingStrategyOptions([...state.performanceStrategies, ...state.backtestStats, ...state.kellyEntries]);
  renderOpenPositions();
  state.closedTrades = positionPayload.closed_trades || [];
  renderClosedTrades(state.closedTrades);
  renderRecentTradeBanner();
  renderAverageLossBanner();
  renderAverageGainBanner();
  if (state.activeTab === "performance") {
    drawEquityCurve(performancePayload.closed_trades || []);
  }
  state.invalidSignals = [
    ...(positionPayload.ignored_signals || []).map((item) => ({
      ...item,
      received_at: "",
      timeframe: "",
    })),
    ...(invalidPayload.invalid_signals || []),
  ];
  renderInvalidSignals(state.invalidSignals);
  renderPerformance(sortPerformance(performancePayload.strategies || []));
  renderPerformanceClosedTrades(performancePayload.closed_trades || []);
  renderBacktestStats(filterBacktestStats(state.backtestStats));
  renderDcaSizing();
  renderDcaPlans();
  renderPortfolioBacktest(state.portfolioBacktest);
  state.manualPortfolio = manualPayload;
  renderManualPortfolio(manualPayload);
  state.dividendEvents = dividendPayload.dividend_events || [];
  state.dividendAlerts = dividendPayload.dividend_alerts || [];
  renderDividendEvents();
  renderExDateAlerts();
  renderSummary(summary);
  renderUserAttention();
  renderRiskOverview();
  renderRiskAlerts();
  renderKellyEntries();
  state.derivatives = derivativePayload;
  renderDerivatives(derivativePayload);
  state.lastRefreshAt = new Date();
  els.syncStatus.textContent = t("syncedJustNow");

  const firstTicker = state.selectedTicker || state.signals[0]?.ticker || "";
  if (firstTicker) {
    await renderChart(firstTicker);
  } else {
    state.selectedTicker = "";
    els.chartTitle.textContent = t("noTickerSelected");
    renderTickerTimeline("");
    clearChart(t("noTickerSelected"));
  }
}

function renderPortfolioBacktest(report) {
  const placeholder = "-";
  if (!report) {
    els.portfolioBacktestStatus.textContent = "Chưa có snapshot backtest. Chạy local rồi gửi báo cáo lên dashboard.";
    els.portfolioBacktestCagr.textContent = placeholder;
    els.portfolioBacktestMdd.textContent = placeholder;
    els.portfolioBacktestSharpe.textContent = placeholder;
    els.portfolioBacktestExposure.textContent = placeholder;
    els.portfolioBacktestMeta.textContent = placeholder;
    els.portfolioBacktestComparison.textContent = "Chưa có baseline để so sánh.";
    els.portfolioBacktestGuardrails.textContent = placeholder;
    els.portfolioBacktestLimitations.textContent = "Không phải lệnh giao dịch tự động.";
    return;
  }

  const summary = report.summary || {};
  const production = summary.variants?.production?.base || {};
  const benchmark = summary.benchmark?.metrics || {};
  const period = summary.common_period || {};
  const guardrails = summary.guardrails || {};
  const percent = (value) =>
    Number.isFinite(Number(value)) ? formatPercent(Number(value) * 100) : placeholder;
  const source = report.source || "local";
  const title = report.title || "Portfolio backtest";
  const reportDate = report.report_date ? formatDateOnly(report.report_date) : "-";

  els.portfolioBacktestStatus.textContent = `${title} · ${report.research_status || "research"} · ${reportDate}`;
  els.portfolioBacktestCagr.textContent = percent(production.cagr);
  els.portfolioBacktestMdd.textContent = percent(production.max_drawdown);
  els.portfolioBacktestSharpe.textContent = formatRatio(production.sharpe);
  els.portfolioBacktestExposure.textContent = percent(production.average_exposure);
  els.portfolioBacktestMeta.textContent = period.start_date && period.end_date
    ? `${period.start_date} → ${period.end_date} (${Number(period.years || 0).toFixed(1)} năm)`
    : `Nguồn ${source}`;

  const spread = production.relative_to_benchmark?.cagr_spread;
  const benchmarkCagr = benchmark.cagr;
  if (Number.isFinite(Number(spread)) && Number.isFinite(Number(benchmarkCagr))) {
    els.portfolioBacktestComparison.textContent = `VNINDEX CAGR ${percent(benchmarkCagr)} · chênh lệch ${percent(spread)}.`;
  } else {
    els.portfolioBacktestComparison.textContent = "So sánh VNINDEX chưa có trong snapshot.";
  }

  const cap = (label, value) => Number.isFinite(Number(value)) ? `${label} ${percent(value)}` : null;
  const guardrailText = [
    cap("Tổng", guardrails.total_exposure_cap),
    cap("Ngành", guardrails.sector_cap),
    cap("Mã", guardrails.ticker_cap),
    cap("RF", guardrails.rf_hard_cap),
    cap("EMA", guardrails.ema_hard_cap),
  ].filter(Boolean).join(" · ");
  els.portfolioBacktestGuardrails.textContent = guardrailText || "Chưa có ràng buộc trong snapshot.";

  const limitations = Array.isArray(summary.limitations) ? summary.limitations : [];
  els.portfolioBacktestLimitations.textContent = limitations.length
    ? limitations.join(" ")
    : "Kết quả là chuẩn nghiên cứu/paper-trading; không phải lệnh giao dịch tự động.";
}

function filterSignalsForWatchlist(signals) {
  if (!state.watchlistOnly) return signals;
  if (!state.watchlist.length) return [];
  const allowed = new Set(state.watchlist);
  return signals.filter((signal) => allowed.has(String(signal.ticker || "").toUpperCase()));
}

function filterTradesForWatchlist(trades) {
  if (!state.watchlistOnly) return trades || [];
  if (!state.watchlist.length) return [];
  const allowed = new Set(state.watchlist);
  return (trades || []).filter((trade) => allowed.has(String(trade.ticker || "").toUpperCase()));
}

function renderManualPortfolio(payload) {
  const summary = payload.summary || {};
  const positions = payload.positions || [];
  els.manualPortfolioReturn.innerHTML = formatSignedPercent(summary.portfolio_return_pct);
  els.manualTotalWeight.textContent = formatPercent(summary.total_weight_pct || 0);
  els.manualOpenCount.textContent = summary.open_count ?? 0;
  els.manualClosedCount.textContent = summary.closed_count ?? 0;
  renderManualDailyPerformanceStatus(payload.daily_performance || []);
  renderManualDailyPerformanceTable(payload.daily_performance || []);
  drawManualEquityCurve(payload.equity_curve || []);

  if (!positions.length) {
    els.manualPortfolioTable.innerHTML = `<tr><td class="empty" colspan="12">${t("noManualPositions")}</td></tr>`;
    return;
  }

  els.manualPortfolioTable.innerHTML = positions
    .map((position) => {
      const status = position.status === "closed" ? "closed" : "open";
      const isOpen = status === "open";
      const markPrice = position.mark_price ?? position.current_price;
      return `
        <tr>
          <td><strong>${escapeHtml(position.ticker)}</strong></td>
          <td>${formatPercent(position.weight_pct)}</td>
          <td>${formatPrice(position.entry_price)}</td>
          <td>${formatPrice(markPrice)}</td>
          <td>${formatSignedPercent(position.return_pct)}</td>
          <td>${formatPrice(position.quantity)}</td>
          <td><span class="statusBadge ${status}">${escapeHtml(isOpen ? t("openStatus") : t("closedStatus"))}</span></td>
          <td>${formatDateOnly(position.entry_date)}</td>
          <td>${formatHoldingDaysBetween(position.entry_date, isOpen ? null : position.closed_at)}</td>
          <td>${renderDividendNotes(position.dividend_notes || [])}</td>
          <td>${escapeHtml(position.note || "-")}</td>
          <td>
            <div class="portfolioActions">
              ${isOpen ? `
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  aria-label="${escapeHtml(t("closeManualPricePrompt"))}"
                  value="${escapeHtml(rawNumber(markPrice))}"
                  data-manual-close-price-input="${position.id}"
                />
                <button class="deleteButton" type="button" data-manual-close-id="${position.id}">${escapeHtml(t("close"))}</button>
              ` : ""}
              <button class="deleteButton" type="button" data-manual-delete-id="${position.id}">${escapeHtml(t("delete"))}</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  els.manualPortfolioTable.querySelectorAll("[data-manual-close-id]").forEach((button) => {
    button.addEventListener("click", () => closeManualPosition(button.dataset.manualCloseId));
  });
  els.manualPortfolioTable.querySelectorAll("[data-manual-delete-id]").forEach((button) => {
    button.addEventListener("click", () => deleteManualPosition(button.dataset.manualDeleteId));
  });
}

function renderManualDailyPerformanceStatus(dailyPerformance) {
  if (!dailyPerformance.length) {
    els.manualDailyPerformanceStatus.textContent = t("dailyPerformanceEmpty");
    return;
  }
  const latest = dailyPerformance[dailyPerformance.length - 1];
  els.manualDailyPerformanceStatus.innerHTML = `
    <span>${escapeHtml(t("dailyPerformanceStatus"))}: <strong>${dailyPerformance.length}</strong></span>
    <span>${escapeHtml(t("dailyPerformanceLatest"))}: <strong>${escapeHtml(formatDateOnly(latest.trade_date || latest.recorded_at))}</strong></span>
    <span>${escapeHtml(t("returnPct"))}: ${formatSignedPercent(latest.portfolio_return_pct)}</span>
  `;
}

function renderManualDailyPerformanceTable(dailyPerformance) {
  const rows = [...dailyPerformance].reverse();
  if (!rows.length) {
    els.manualDailyPerformanceTable.innerHTML = `<tr><td class="empty" colspan="8">${t("noDailyPerformance")}</td></tr>`;
    return;
  }
  els.manualDailyPerformanceTable.innerHTML = rows
    .map((row) => `
      <tr>
        <td>${formatDateOnly(row.trade_date)}</td>
        <td>${formatSignedPercent(row.portfolio_return_pct)}</td>
        <td>${formatPrice(row.equity_value)}</td>
        <td>${formatPercent(row.total_weight_pct)}</td>
        <td>${row.open_count ?? 0}</td>
        <td>${row.closed_count ?? 0}</td>
        <td>${formatDate(row.recorded_at)}</td>
        <td>
          <button class="deleteButton" type="button" data-daily-performance-delete="${escapeHtml(row.trade_date)}">${escapeHtml(t("delete"))}</button>
        </td>
      </tr>
    `)
    .join("");

  els.manualDailyPerformanceTable
    .querySelectorAll("[data-daily-performance-delete]")
    .forEach((button) => {
      button.addEventListener("click", () =>
        deleteManualDailyPerformance(button.dataset.dailyPerformanceDelete)
      );
    });
}

async function addManualPosition(event) {
  event.preventDefault();
  const body = {
    ticker: els.manualTicker.value.trim().toUpperCase(),
    weight_pct: Number(els.manualWeight.value),
    entry_price: Number(els.manualEntryPrice.value),
    current_price: optionalNumber(els.manualCurrentPrice.value),
    quantity: optionalNumber(els.manualQuantity.value),
    entry_date: localDateToIsoDate(els.manualEntryDate.value),
    note: els.manualNote.value.trim() || null,
  };
  const response = await fetch("/api/manual-portfolio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    window.alert(t("manualSaveFailed"));
    return;
  }
  els.manualPositionForm.reset();
  await refresh();
}

async function closeManualPosition(positionId) {
  const input = els.manualPortfolioTable.querySelector(
    `[data-manual-close-price-input="${CSS.escape(String(positionId))}"]`
  );
  const rawPrice = input?.value || "";
  const price = parsePriceInput(rawPrice);
  if (!Number.isFinite(price) || price <= 0) {
    window.alert(t("closeManualInvalidPrice"));
    input?.focus();
    return;
  }
  const response = await fetch(`/api/manual-portfolio/${encodeURIComponent(positionId)}/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exit_price: price }),
  });
  if (!response.ok) {
    window.alert(t("manualCloseFailed"));
    return;
  }
  await refresh();
}

async function deleteManualPosition(positionId) {
  if (!window.confirm(t("deleteManualConfirm"))) {
    return;
  }
  const response = await fetch(`/api/manual-portfolio/${encodeURIComponent(positionId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    window.alert(t("manualDeleteFailed"));
    return;
  }
  await refresh();
}

async function refreshManualMarketPrices() {
  const response = await fetch("/api/manual-portfolio/refresh-prices", {
    method: "POST",
  });
  if (!response.ok) {
    window.alert(t("refreshPricesFailed"));
    return;
  }
  await refresh();
}

async function recordManualDailyPerformance() {
  const response = await fetch("/api/manual-portfolio/record-daily-performance", {
    method: "POST",
  });
  if (!response.ok) {
    window.alert(t("manualSaveFailed"));
    return;
  }
  await refresh();
}

async function deleteManualDailyPerformance(tradeDate) {
  if (!window.confirm(t("deleteDailyPerformanceConfirm"))) {
    return;
  }
  const response = await fetch(
    `/api/manual-portfolio/daily-performance/${encodeURIComponent(tradeDate)}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    window.alert(t("deleteDailyPerformanceFailed"));
    return;
  }
  await refresh();
}

function renderDerivatives(payload) {
  const summary = payload.summary || {};
  const openPositions = payload.open_positions || [];
  const closedTrades = payload.closed_trades || [];
  const events = payload.events || [];

  els.derivativeOpenCount.textContent = summary.open_count ?? 0;
  els.derivativeOpenPnl.innerHTML = formatSignedVnd(summary.open_pnl_vnd);
  els.derivativeClosedCount.textContent = summary.closed_count ?? 0;
  els.derivativeRealizedPnl.innerHTML = formatSignedVnd(summary.realized_pnl_vnd);
  els.derivativeInitialCapital.textContent = formatVnd(summary.initial_capital);
  els.derivativeCurrentEquity.textContent = formatVnd(summary.current_equity);
  els.derivativeMaxDrawdown.innerHTML = formatDrawdownVnd(summary.max_drawdown_vnd);
  els.derivativeMaxDrawdownPct.innerHTML = formatDrawdownPercent(summary.max_drawdown_pct);
  els.derivativeTotalPnl.innerHTML = formatSignedVnd(summary.total_pnl_vnd);
  els.derivativeTotalReturn.innerHTML = formatSignedPercent(summary.total_return_pct);
  els.derivativeWinningTrades.textContent = summary.closed_count
    ? `${formatPercent(summary.win_rate_pct)} · ${summary.wins}/${summary.closed_count}`
    : "-";
  els.derivativeProfitFactor.textContent = formatRatio(summary.profit_factor);
  if (document.activeElement !== els.derivativeCapitalInput) {
    els.derivativeCapitalInput.value = rawNumber(summary.initial_capital);
  }
  drawDerivativeEquityCurve(payload.equity_curve || []);

  if (!openPositions.length) {
    els.derivativeOpenPositionsTable.innerHTML =
      `<tr><td class="empty" colspan="11">${t("noDerivativePositions")}</td></tr>`;
  } else {
    els.derivativeOpenPositionsTable.innerHTML = openPositions
      .map((position) => `
        <tr>
          <td><strong>${escapeHtml(position.symbol)}</strong></td>
          <td><strong>${escapeHtml(displayStrategyName(position.strategy))}</strong></td>
          <td><span class="derivativeSide ${escapeHtml(position.side)}">${escapeHtml(position.side)}</span></td>
          <td>${formatPrice(position.average_price)}</td>
          <td>${formatPrice(position.current_price)}</td>
          <td>${formatPrice(position.quantity)}</td>
          <td>${position.layer_count ?? 0}</td>
          <td>${formatSignedNumber(position.pnl_points)}</td>
          <td>${formatSignedVnd(position.pnl_vnd)}</td>
          <td>${formatPrice(position.take_profit)}</td>
          <td>${formatPrice(position.stop_loss)}</td>
        </tr>
      `)
      .join("");
  }

  if (!closedTrades.length) {
    els.derivativeClosedTradesTable.innerHTML =
      `<tr><td class="empty" colspan="11">${t("noDerivativeTrades")}</td></tr>`;
  } else {
    els.derivativeClosedTradesTable.innerHTML = closedTrades
      .map((trade) => `
        <tr>
          <td><strong>${escapeHtml(trade.symbol)}</strong></td>
          <td><strong>${escapeHtml(displayStrategyName(trade.strategy))}</strong></td>
          <td><span class="derivativeSide ${escapeHtml(trade.side)}">${escapeHtml(trade.side)}</span></td>
          <td>${formatPrice(trade.average_price)}</td>
          <td>${formatPrice(trade.exit_price)}</td>
          <td>${formatPrice(trade.quantity)}</td>
          <td>${trade.layer_count ?? 0}</td>
          <td>${escapeHtml(trade.exit_reason || "-")}</td>
          <td>${formatSignedNumber(trade.pnl_points)}</td>
          <td>${formatSignedVnd(trade.pnl_vnd)}</td>
          <td>${formatDate(trade.exit_time)}</td>
        </tr>
      `)
      .join("");
  }

  if (!events.length) {
    els.derivativeEventsTable.innerHTML =
      `<tr><td class="empty" colspan="8">${t("noDerivativeEvents")}</td></tr>`;
    return;
  }
  els.derivativeEventsTable.innerHTML = events
    .map((event) => `
      <tr>
        <td>${formatDate(event.source_time || event.received_at)}</td>
        <td><strong>${escapeHtml(event.symbol)}</strong></td>
        <td><span class="side ${escapeHtml(event.action)}">${escapeHtml(event.action)}</span></td>
        <td>${formatPrice(event.price)}</td>
        <td>${formatPrice(event.quantity)}</td>
        <td>${escapeHtml(displayStrategyName(event.strategy) || "-")}</td>
        <td>${escapeHtml(event.reason || "-")}</td>
        <td class="adminOnly">
          <button class="deleteButton" type="button" data-derivative-delete-id="${event.id}">
            ${escapeHtml(t("delete"))}
          </button>
        </td>
      </tr>
    `)
    .join("");

  els.derivativeEventsTable.querySelectorAll("[data-derivative-delete-id]").forEach((button) => {
    button.addEventListener("click", () => deleteDerivativeEvent(button.dataset.derivativeDeleteId));
  });
}

async function deleteDerivativeEvent(signalId) {
  if (!window.confirm(t("deleteDerivativeConfirm"))) {
    return;
  }
  const response = await fetch(`/api/derivatives/signals/${encodeURIComponent(signalId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    window.alert(t("deleteDerivativeFailed"));
    return;
  }
  await refresh();
}

async function saveDerivativeCapital(event) {
  event.preventDefault();
  const initialCapital = parsePriceInput(els.derivativeCapitalInput.value);
  if (!Number.isFinite(initialCapital) || initialCapital <= 0) {
    window.alert(t("derivativeCapitalSaveFailed"));
    return;
  }
  const response = await fetch("/api/settings/derivative-capital", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initial_capital: initialCapital }),
  });
  if (!response.ok) {
    window.alert(t("derivativeCapitalSaveFailed"));
    return;
  }
  await refresh();
}

function renderDividendEvents() {
  if (!els.dividendEventsTable) return;
  const rows = [...state.dividendEvents].sort((left, right) =>
    String(left.ex_date || "").localeCompare(String(right.ex_date || ""))
  );
  if (!rows.length) {
    els.dividendEventsTable.innerHTML = `<tr><td class="empty" colspan="8">${t("noDividendEvents")}</td></tr>`;
    return;
  }
  els.dividendEventsTable.innerHTML = rows
    .map((event) => {
      const daysUntil = Number(event.days_until);
      const dateLabel = event.alert_status === "ex_date_today"
        ? `<strong>${escapeHtml(t("exDateToday"))}</strong>`
        : Number.isFinite(daysUntil)
          ? `${formatDateOnly(event.ex_date)} (${daysUntil} ngày)`
          : formatDateOnly(event.ex_date);
      return `
      <tr class="${event.alert_status === "ex_date_today" ? "exDateRow" : ""}">
        <td><strong>${escapeHtml(event.ticker || "-")}</strong></td>
        <td>${dateLabel}</td>
        <td>${formatPrice(event.cash_amount)}</td>
        <td>${formatPercent(event.stock_ratio_pct)}</td>
        <td>${formatPercent(event.issue_ratio_pct)}</td>
        <td>${formatPrice(event.issue_price)}</td>
        <td>${escapeHtml(event.note || "-")}</td>
        <td class="adminOnly">
          <button class="deleteButton" type="button" data-dividend-delete-id="${event.id}">${escapeHtml(t("delete"))}</button>
        </td>
      </tr>
    `;
    })
    .join("");

  els.dividendEventsTable.querySelectorAll("[data-dividend-delete-id]").forEach((button) => {
    button.addEventListener("click", () => deleteDividendEvent(button.dataset.dividendDeleteId));
  });
}

function renderExDateAlerts() {
  if (!els.exDateAlerts) return;
  const events = state.dividendAlerts.filter((event) => event.alert_status === "ex_date_today");
  if (!events.length) {
    els.exDateAlerts.hidden = true;
    els.exDateAlerts.innerHTML = "";
    return;
  }

  const tickers = [...new Set(events.map((event) => String(event.ticker || "").toUpperCase()))].sort();
  const message = `${t("exDateAlertMessage")}: ${tickers.join(", ")}`;
  els.exDateAlerts.innerHTML = `
    <div class="exDateAlertHeader">
      <strong>${escapeHtml(t("exDateToday"))}</strong>
      <span>${escapeHtml(t("exDateAlertMessage"))}</span>
    </div>
    <div class="exDateAlertChips">
      ${tickers.map((ticker) => `
        <button class="exDateAlertChip" type="button" data-ex-date-ticker="${escapeHtml(ticker)}">
          ${escapeHtml(ticker)}
        </button>
      `).join("")}
    </div>
  `;
  els.exDateAlerts.hidden = false;
  els.exDateAlerts.querySelectorAll("[data-ex-date-ticker]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab("overview");
      renderChart(button.dataset.exDateTicker);
    });
  });

  const alertKey = `dividendExDateAlert:${localMarketDate()}:${tickers.join(",")}`;
  if (localStorage.getItem(alertKey) !== "shown") {
    localStorage.setItem(alertKey, "shown");
    window.alert(message);
  }
}

function localMarketDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function addDividendEvent(event) {
  event.preventDefault();
  const body = {
    ticker: els.dividendTicker.value.trim().toUpperCase(),
    ex_date: els.dividendExDate.value,
    cash_amount: optionalNumber(els.dividendCashAmount.value),
    stock_ratio_pct: optionalNumber(els.dividendStockRatio.value),
    issue_ratio_pct: optionalNumber(els.dividendIssueRatio.value),
    issue_price: optionalNumber(els.dividendIssuePrice.value),
    note: els.dividendNote.value.trim() || null,
  };
  const response = await fetch("/api/dividend-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    window.alert(t("dividendSaveFailed"));
    return;
  }
  els.dividendEventForm.reset();
  await refresh();
}

async function deleteDividendEvent(eventId) {
  if (!window.confirm(t("dividendDeleteConfirm"))) {
    return;
  }
  const response = await fetch(`/api/dividend-events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    window.alert(t("dividendDeleteFailed"));
    return;
  }
  await refresh();
}

async function refreshOpenPositionMarketPrices() {
  const response = await fetch("/api/open-positions/refresh-prices", {
    method: "POST",
  });
  if (!response.ok) {
    window.alert(t("refreshPricesFailed"));
    return;
  }
  await refresh();
}

function buildPerformanceQuery() {
  const params = new URLSearchParams();
  const ticker = els.performanceTickerFilter.value.trim().toUpperCase();
  const strategy = els.performanceStrategyFilter.value.trim();
  if (ticker) params.set("ticker", ticker);
  if (strategy) params.set("strategy", strategy);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function filterBacktestStats(stats) {
  const tickerFilter = els.performanceTickerFilter.value.trim().toUpperCase();
  const backtestTickerSearch = els.backtestTickerSearch.value.trim().toUpperCase();
  const strategyFilter = els.performanceStrategyFilter.value.trim();
  const backtestStrategyFilter = els.backtestStrategyFilter.value;
  return (stats || []).filter((stat) => {
    const ticker = String(stat.ticker || "").toUpperCase();
    const strategy = String(stat.strategy || "");
    const tickerMatches =
      (!tickerFilter || ticker.includes(tickerFilter)) &&
      (!backtestTickerSearch || ticker.includes(backtestTickerSearch));
    const strategyMatches =
      (!strategyFilter || strategy === strategyFilter) &&
      (!backtestStrategyFilter || strategy === backtestStrategyFilter);
    return tickerMatches && strategyMatches;
  });
}

function optionalInteger(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function readBacktestStatsForm() {
  const closedTrades = optionalInteger(els.backtestClosedTrades.value);
  return {
    ticker: els.backtestTicker.value.trim().toUpperCase(),
    strategy: els.backtestStrategy.value.trim(),
    metric_name: "Price Drawdown % From BUY",
    closed_trades: closedTrades,
    negative_trades: optionalInteger(els.backtestNegativeTrades.value),
    max_loss_pct: optionalNumber(els.backtestMaxLoss.value),
    min_loss_pct: optionalNumber(els.backtestMinLoss.value),
    avg_loss_pct: optionalNumber(els.backtestAvgLoss.value),
    max_gain_pct: optionalNumber(els.backtestMaxGain.value),
    avg_gain_pct: optionalNumber(els.backtestAvgGain.value),
    tp1_hits: optionalInteger(els.backtestTp1Hits.value),
    tp1_total: closedTrades,
    tp2_hits: optionalInteger(els.backtestTp2Hits.value),
    tp2_total: closedTrades,
    tp3_hits: optionalInteger(els.backtestTp3Hits.value),
    tp3_total: closedTrades,
    avg_hold_bars: null,
    avg_hold_days: null,
    note: els.backtestNote.value.trim() || null,
  };
}

function resetBacktestStatsForm() {
  els.backtestStatsForm.reset();
  state.activeBacktestStatKey = "";
  state.activeBacktestStatId = "";
}

async function saveBacktestStats(event) {
  event.preventDefault();
  const payload = readBacktestStatsForm();
  if (!payload.ticker || !payload.strategy) return;
  const statKey = tickerStrategyKey(payload.ticker, payload.strategy);
  const duplicate = state.backtestStats.find(
    (stat) =>
      tickerStrategyKey(stat.ticker, stat.strategy) === statKey &&
      String(stat.id) !== String(state.activeBacktestStatId || "")
  );
  if (duplicate) {
    window.alert(t("duplicateTickerStrategy"));
    els.backtestTicker.focus();
    return;
  }
  const previousStatId = state.activeBacktestStatId;
  const response = await fetch("/api/backtest-stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    window.alert(t("backtestSaveFailed"));
    return;
  }
  const result = await response.json();
  const savedId = result.backtest_stat?.id;
  if (previousStatId && savedId && String(previousStatId) !== String(savedId)) {
    await fetch(`/api/backtest-stats/${encodeURIComponent(previousStatId)}`, {
      method: "DELETE",
    });
  }
  resetBacktestStatsForm();
  await refresh();
}

function loadBacktestStatsToForm(stat) {
  if (state.user?.role !== "admin") return;
  state.activeBacktestStatKey = tickerStrategyKey(stat.ticker, stat.strategy);
  state.activeBacktestStatId = String(stat.id || "");
  els.backtestTicker.value = stat.ticker || "";
  updateBacktestStrategyOptions([...state.performanceStrategies, ...state.backtestStats], stat.strategy || "");
  els.backtestStrategy.value = stat.strategy || "";
  els.backtestClosedTrades.value = rawNumber(stat.closed_trades);
  els.backtestNegativeTrades.value = rawNumber(stat.negative_trades);
  els.backtestMaxLoss.value = rawNumber(stat.max_loss_pct);
  els.backtestMinLoss.value = rawNumber(stat.min_loss_pct);
  els.backtestAvgLoss.value = rawNumber(stat.avg_loss_pct);
  els.backtestMaxGain.value = rawNumber(stat.max_gain_pct);
  els.backtestAvgGain.value = rawNumber(stat.avg_gain_pct);
  els.backtestTp1Hits.value = rawNumber(stat.tp1_hits);
  els.backtestTp2Hits.value = rawNumber(stat.tp2_hits);
  els.backtestTp3Hits.value = rawNumber(stat.tp3_hits);
  els.backtestNote.value = stat.note || "";
  els.backtestTicker.focus();
}

async function deleteBacktestStats(statId) {
  if (!window.confirm(t("backtestDeleteConfirm"))) return;
  const deleted = state.backtestStats.find((stat) => String(stat.id) === String(statId));
  const response = await fetch(`/api/backtest-stats/${encodeURIComponent(statId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    window.alert(t("backtestDeleteFailed"));
    return;
  }
  if (
    String(state.activeBacktestStatId || "") === String(statId) ||
    (deleted && state.activeBacktestStatKey === tickerStrategyKey(deleted.ticker, deleted.strategy))
  ) {
    state.activeBacktestStatKey = "";
    state.activeBacktestStatId = "";
  }
  await refresh();
}

function strategyNameFrom(value) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (!value || typeof value !== "object") return "";
  return String(value.strategy || value.name || value.label || value.value || "").trim();
}

function displayStrategyName(value) {
  const strategy = String(value || "").trim();
  if (!strategy) return "";
  return STRATEGY_DISPLAY_ALIASES[strategy.toLowerCase()] || strategy;
}

function uniqueStrategyNames(items) {
  return [...new Set((items || []).map(strategyNameFrom).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

function updateOpenPositionStrategyFilterOptions(openTrades) {
  const currentValue = els.openPositionStrategyFilter.value;
  const strategies = [
    ...new Set(
      (openTrades || [])
        .map((trade) => String(trade.strategy || "").trim())
        .filter(Boolean)
    ),
  ].sort((left, right) => left.localeCompare(right));

  els.openPositionStrategyFilter.replaceChildren();
  els.openPositionStrategyFilter.append(new Option(t("allStrategies"), ""));
  strategies.forEach((strategy) => {
    els.openPositionStrategyFilter.append(new Option(displayStrategyName(strategy), strategy));
  });
  els.openPositionStrategyFilter.value = strategies.includes(currentValue) ? currentValue : "";
}

function updatePerformanceStrategyFilterOptions(strategyRows) {
  const currentValue = els.performanceStrategyFilter.value;
  const strategies = uniqueStrategyNames(strategyRows);

  els.performanceStrategyFilter.replaceChildren();
  els.performanceStrategyFilter.append(new Option(t("allStrategies"), ""));
  strategies.forEach((strategy) => {
    els.performanceStrategyFilter.append(new Option(displayStrategyName(strategy), strategy));
  });
  els.performanceStrategyFilter.value = strategies.includes(currentValue) ? currentValue : "";
  updateKellyStrategyOptions(strategies);
  updateBacktestStrategyOptions(strategies);
  updateDcaSizingStrategyOptions(strategies);
}

function updateBacktestStrategyOptions(strategies, preferredValue = els.backtestStrategy.value) {
  const normalizedStrategies = uniqueStrategyNames(strategies);

  els.backtestStrategy.replaceChildren();
  els.backtestStrategy.append(new Option(t("strategy"), ""));
  normalizedStrategies.forEach((strategy) => {
    els.backtestStrategy.append(new Option(displayStrategyName(strategy), strategy));
  });
  if (preferredValue && !normalizedStrategies.includes(preferredValue)) {
    els.backtestStrategy.append(new Option(displayStrategyName(preferredValue), preferredValue));
  }
  els.backtestStrategy.value = preferredValue && [...normalizedStrategies, preferredValue].includes(preferredValue)
    ? preferredValue
    : "";
}

function updateKellyStrategyOptions(strategies, preferredValue = els.kellyStrategy.value) {
  const normalizedStrategies = uniqueStrategyNames(strategies);

  els.kellyStrategy.replaceChildren();
  els.kellyStrategy.append(new Option(t("allStrategies"), ""));
  normalizedStrategies.forEach((strategy) => {
    els.kellyStrategy.append(new Option(displayStrategyName(strategy), strategy));
  });
  if (preferredValue && !normalizedStrategies.includes(preferredValue)) {
    els.kellyStrategy.append(new Option(displayStrategyName(preferredValue), preferredValue));
  }
  els.kellyStrategy.value = preferredValue && [...normalizedStrategies, preferredValue].includes(preferredValue)
    ? preferredValue
    : "";
}

function tradeTimestamp(trade, field) {
  const parsed = Date.parse(trade?.[field] || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function recentTrades(trades, field, limit = 5) {
  return [...(trades || [])]
    .sort((left, right) => tradeTimestamp(right, field) - tradeTimestamp(left, field))
    .slice(0, limit);
}

function renderRecentTradeBanner() {
  const opened = recentTrades(state.openTrades, "entry_time", 5);
  const closed = recentTrades(state.closedTrades, "exit_time", 5);

  if (!opened.length && !closed.length) {
    els.recentTradeBanner.hidden = true;
    els.recentTradeBannerTrack.innerHTML = "";
    return;
  }

  els.recentTradeBanner.hidden = false;
  els.recentTradeBanner.classList.toggle("isCollapsed", state.recentTradeBannerHidden);
  els.recentTradeBannerToggle.textContent = state.recentTradeBannerHidden ? t("showBanner") : t("hideBanner");
  if (state.recentTradeBannerHidden) {
    els.recentTradeBannerTrack.innerHTML = "";
    return;
  }

  const groupHtml = [
    renderRecentTradeGroup(t("recentOpened"), opened, "entry_time", "buy"),
    renderRecentTradeGroup(t("recentClosed"), closed, "exit_time", "sell"),
  ].filter(Boolean).join("");

  els.recentTradeBannerTrack.innerHTML = `
    <div class="recentTradeGroupSet">${groupHtml}</div>
    <div class="recentTradeGroupSet" aria-hidden="true">${groupHtml}</div>
  `;

  bindBannerPositionButtons(els.recentTradeBannerTrack);
}

function bindBannerPositionButtons(container) {
  container.querySelectorAll("[data-banner-position-key]").forEach((button) => {
    button.addEventListener("click", () => {
      openBannerPositionDetail(button.dataset.bannerPositionKey, button.dataset.bannerTicker);
    });
  });
}

function openBannerPositionDetail(positionKey, ticker) {
  const hasOpenPosition = (state.openTrades || []).some((trade) =>
    tickerStrategyKey(trade.ticker, trade.strategy) === positionKey
  );
  if (hasOpenPosition) {
    openPositionInsight(positionKey);
    return;
  }
  if (ticker) {
    setActiveTab("overview");
    renderChart(ticker);
  }
}

function renderAverageLossBanner() {
  const signals = averageLossSignals().slice(0, 8);
  if (!signals.length) {
    els.avgLossBanner.hidden = true;
    els.avgLossBannerTrack.innerHTML = "";
    return;
  }

  els.avgLossBanner.hidden = false;
  const groupHtml = `
    <span class="recentTradeGroup avgLoss">
      <span class="recentTradeGroupLabel">${escapeHtml(t("avgLossSignal"))}</span>
      ${signals
        .map(({ trade, signal }) => `
          <button
            class="recentTradeChip avgLoss"
            type="button"
            data-banner-position-key="${escapeHtml(tickerStrategyKey(trade.ticker, trade.strategy))}"
            data-banner-ticker="${escapeHtml(trade.ticker)}"
            title="${escapeHtml(`${trade.ticker} · ${displayStrategyName(trade.strategy) || "-"} · ${stripHtml(averageLossSignalDetail(signal))}`)}"
          >
            <strong>${escapeHtml(trade.ticker)}</strong>
            <span>${escapeHtml(displayStrategyName(trade.strategy) || "-")} · ${stripHtml(averageLossSignalDetail(signal))}</span>
          </button>
        `)
        .join("")}
    </span>
  `;

  els.avgLossBannerTrack.innerHTML = `
    <div class="recentTradeGroupSet">${groupHtml}</div>
    <div class="recentTradeGroupSet" aria-hidden="true">${groupHtml}</div>
  `;
  bindBannerPositionButtons(els.avgLossBannerTrack);
}

function renderAverageGainBanner() {
  const signals = averageGainSignals().slice(0, 8);
  if (!signals.length) {
    els.avgGainBanner.hidden = true;
    els.avgGainBannerTrack.innerHTML = "";
    return;
  }

  els.avgGainBanner.hidden = false;
  const groupHtml = `
    <span class="recentTradeGroup avgGain">
      <span class="recentTradeGroupLabel">${escapeHtml(t("avgGainSignal"))}</span>
      ${signals
        .map(({ trade, signal }) => `
          <button
            class="recentTradeChip avgGain"
            type="button"
            data-banner-position-key="${escapeHtml(tickerStrategyKey(trade.ticker, trade.strategy))}"
            data-banner-ticker="${escapeHtml(trade.ticker)}"
            title="${escapeHtml(`${trade.ticker} - ${displayStrategyName(trade.strategy) || "-"} - ${stripHtml(averageGainSignalDetail(signal))}`)}"
          >
            <strong>${escapeHtml(trade.ticker)}</strong>
            <span>${escapeHtml(displayStrategyName(trade.strategy) || "-")} - ${stripHtml(averageGainSignalDetail(signal))}</span>
          </button>
        `)
        .join("")}
    </span>
  `;

  els.avgGainBannerTrack.innerHTML = `
    <div class="recentTradeGroupSet">${groupHtml}</div>
    <div class="recentTradeGroupSet" aria-hidden="true">${groupHtml}</div>
  `;
  bindBannerPositionButtons(els.avgGainBannerTrack);
}

function renderRecentTradeGroup(label, trades, timeField, tone) {
  if (!trades.length) return "";
  return `
    <span class="recentTradeGroup ${tone}">
      <span class="recentTradeGroupLabel">${escapeHtml(label)}</span>
      ${trades
        .map((trade) => `
          <button
            class="recentTradeChip ${tone}"
            type="button"
            data-banner-position-key="${escapeHtml(tickerStrategyKey(trade.ticker, trade.strategy))}"
            data-banner-ticker="${escapeHtml(trade.ticker)}"
            title="${escapeHtml(`${trade.ticker} · ${displayStrategyName(trade.strategy) || "-"} · ${formatDate(trade[timeField])}`)}"
          >
            <strong>${escapeHtml(trade.ticker)}</strong>
            <span>${escapeHtml(displayStrategyName(trade.strategy) || "-")} · ${escapeHtml(formatDateOnly(trade[timeField]))}</span>
          </button>
        `)
        .join("")}
    </span>
  `;
}

function openTradeRiskRows() {
  return state.openTrades.map((trade) => {
    const weightPct = kellyAllocationPct(trade.ticker, trade.strategy);
    return {
      trade,
      weightPct,
      allocatedPl: allocatedReturnPct(trade.return_pct, weightPct),
    };
  });
}

function backtestStatForTrade(trade) {
  const targetKey = tickerStrategyKey(trade.ticker, trade.strategy);
  return (state.backtestStats || []).find((stat) => {
    return tickerStrategyKey(stat.ticker, stat.strategy) === targetKey;
  });
}

function averageLossThreshold(stat) {
  const value = Number(stat?.avg_loss_pct);
  if (!Number.isFinite(value) || value === 0) return null;
  return value > 0 ? -value : value;
}

function maxLossThreshold(stat) {
  const value = Number(stat?.max_loss_pct);
  if (!Number.isFinite(value) || value === 0) return null;
  return value > 0 ? -value : value;
}

function averageGainThreshold(stat) {
  const value = Number(stat?.avg_gain_pct);
  if (!Number.isFinite(value) || value === 0) return null;
  return Math.abs(value);
}

function maxGainThreshold(stat) {
  const value = Number(stat?.max_gain_pct);
  if (!Number.isFinite(value) || value === 0) return null;
  return Math.abs(value);
}

function averageLossSignalForTrade(trade) {
  const stat = backtestStatForTrade(trade);
  const threshold = averageLossThreshold(stat);
  const maxLoss = maxLossThreshold(stat);
  const returnPct = Number(trade?.return_pct);
  if (threshold === null || !Number.isFinite(returnPct) || returnPct > threshold) {
    return null;
  }
  return {
    ticker: trade.ticker,
    strategy: trade.strategy || "-",
    price: trade.exit_price,
    returnPct,
    threshold,
    maxLoss,
  };
}

function averageGainSignalForTrade(trade) {
  const stat = backtestStatForTrade(trade);
  const threshold = averageGainThreshold(stat);
  const maxGain = maxGainThreshold(stat);
  const returnPct = Number(trade?.return_pct);
  if (threshold === null || !Number.isFinite(returnPct) || returnPct < threshold) {
    return null;
  }
  return {
    ticker: trade.ticker,
    strategy: trade.strategy || "-",
    price: trade.exit_price,
    returnPct,
    threshold,
    maxGain,
  };
}

function averageLossSignals() {
  return (state.openTrades || [])
    .map((trade) => ({ trade, signal: averageLossSignalForTrade(trade) }))
    .filter((item) => item.signal)
    .sort((left, right) => Number(left.signal.returnPct) - Number(right.signal.returnPct));
}

function averageGainSignals() {
  return (state.openTrades || [])
    .map((trade) => ({ trade, signal: averageGainSignalForTrade(trade) }))
    .filter((item) => item.signal)
    .sort((left, right) => Number(right.signal.returnPct) - Number(left.signal.returnPct));
}

function averageLossSignalDetail(signal) {
  const parts = [
    formatSignedPercent(signal.returnPct),
    `${t("avgLossShort")} ${formatSignedPercent(signal.threshold)}`,
  ];
  if (signal.maxLoss !== null) {
    parts.push(`${t("maxLossShort")} ${formatSignedPercent(signal.maxLoss)}`);
  }
  return parts.join(" / ");
}

function averageGainSignalDetail(signal) {
  const parts = [
    formatSignedPercent(signal.returnPct),
    `${t("avgGainShort")} ${formatSignedPercent(signal.threshold)}`,
  ];
  if (signal.maxGain !== null) {
    parts.push(`${t("maxGainShort")} ${formatSignedPercent(signal.maxGain)}`);
  }
  return parts.join(" / ");
}

function aggregateRisk(rows, keyFn) {
  const totals = new Map();
  rows.forEach((row) => {
    const key = keyFn(row.trade) || "-";
    totals.set(key, (totals.get(key) || 0) + (Number(row.weightPct) || 0));
  });
  return [...totals.entries()]
    .map(([key, value]) => ({ key, value }))
    .sort((left, right) => right.value - left.value);
}

function renderRiskOverview() {
  const rows = openTradeRiskRows();
  if (!rows.length) {
    els.riskTotalExposure.textContent = "-";
    els.riskWeightedPl.textContent = "-";
    els.riskTopTicker.textContent = "-";
    els.riskStressMinus5.textContent = "-";
    els.riskStrategyBreakdown.innerHTML = `<div class="empty">${escapeHtml(t("noOpenPositions"))}</div>`;
    return;
  }

  const totalExposure = rows.reduce((sum, row) => sum + (Number(row.weightPct) || 0), 0);
  const weightedPl = rows.reduce((sum, row) => {
    const value = Number(row.allocatedPl);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);
  const tickerExposure = aggregateRisk(rows, (trade) => trade.ticker);
  const strategyExposure = aggregateRisk(rows, (trade) => trade.strategy);
  const topTicker = tickerExposure[0];
  const stressMinus5 = weightedPl - (totalExposure * 5) / 100;

  els.riskTotalExposure.textContent = formatPercent(totalExposure);
  els.riskWeightedPl.innerHTML = formatSignedPercent(weightedPl);
  els.riskTopTicker.textContent = topTicker ? `${topTicker.key} ${formatPercent(topTicker.value)}` : "-";
  els.riskStressMinus5.innerHTML = formatSignedPercent(stressMinus5);
  els.riskStrategyBreakdown.innerHTML = `
    <div class="riskBreakdownTitle">${escapeHtml(t("strategyExposure"))}</div>
    ${strategyExposure.slice(0, 5).map((item) => {
      const width = Math.min(100, Math.max(4, item.value));
      return `
        <button class="riskBreakdownRow" type="button" data-risk-strategy="${escapeHtml(item.key)}">
          <span>${escapeHtml(displayStrategyName(item.key))}</span>
          <strong>${formatPercent(item.value)}</strong>
          <i style="width:${width}%"></i>
        </button>
      `;
    }).join("")}
  `;
  els.riskStrategyBreakdown.querySelectorAll("[data-risk-strategy]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab("positions");
      els.openPositionStrategyFilter.value = button.dataset.riskStrategy;
      renderOpenPositions();
    });
  });
}

function renderRiskAlerts() {
  const rows = openTradeRiskRows();
  const totalExposure = rows.reduce((sum, row) => sum + (Number(row.weightPct) || 0), 0);
  const tickerExposure = aggregateRisk(rows, (trade) => trade.ticker);
  const strategyExposure = aggregateRisk(rows, (trade) => trade.strategy);
  const alerts = [];

  if (totalExposure > 100) {
    alerts.push({
      level: "danger",
      title: t("exposureAboveLimit"),
      detail: formatPercent(totalExposure),
    });
  }
  if (tickerExposure[0]?.value >= 20) {
    alerts.push({
      level: "warning",
      title: t("concentrationAlert"),
      detail: `${tickerExposure[0].key} ${formatPercent(tickerExposure[0].value)}`,
      ticker: tickerExposure[0].key,
    });
  }
  if (strategyExposure[0]?.value >= 50) {
    alerts.push({
      level: "warning",
      title: t("strategyConcentrationAlert"),
      detail: `${displayStrategyName(strategyExposure[0].key)} ${formatPercent(strategyExposure[0].value)}`,
    });
  }
  (state.dividendAlerts || [])
    .filter((alert) => alert.alert_status === "ex_date_today")
    .slice(0, 5)
    .forEach((alert) => {
      alerts.push({
        level: "danger",
        title: t("exDateToday"),
        detail: `${alert.ticker || alert.symbol || "-"} ${formatDateOnly(alert.ex_date || alert.date)}`,
        ticker: alert.ticker || alert.symbol,
      });
    });
  averageLossSignals()
    .slice(0, 5)
    .forEach(({ trade, signal }) => alerts.push({
      level: "warning",
      title: t("avgLossTouchAlert"),
      detail: `${trade.ticker} ${displayStrategyName(trade.strategy) || "-"} ${averageLossSignalDetail(signal)}`,
      ticker: trade.ticker,
    }));
  averageGainSignals()
    .slice(0, 5)
    .forEach(({ trade, signal }) => alerts.push({
      level: "success",
      title: t("avgGainTouchAlert"),
      detail: `${trade.ticker} ${displayStrategyName(trade.strategy) || "-"} ${averageGainSignalDetail(signal)}`,
      ticker: trade.ticker,
    }));
  rows
    .filter((row) => Number(row.trade.return_pct) <= -5)
    .slice(0, 5)
    .forEach((row) => alerts.push({
      level: "danger",
      title: t("lossRiskAlert"),
      detail: `${row.trade.ticker} ${formatSignedPercent(row.trade.return_pct)}`,
      ticker: row.trade.ticker,
    }));
  (state.dividendAlerts || [])
    .filter((alert) => alert.alert_status !== "ex_date_today")
    .slice(0, 5)
    .forEach((alert) => {
      alerts.push({
        level: "warning",
        title: t("dividendRiskAlert"),
        detail: `${alert.ticker || alert.symbol || "-"} ${formatDateOnly(alert.ex_date || alert.date)}`,
        ticker: alert.ticker || alert.symbol,
      });
    });
  if (state.invalidSignals.length) {
    alerts.push({
      level: "warning",
      title: t("webhookIssueAlert"),
      detail: String(state.invalidSignals.length),
    });
  }
  recentTrades(state.closedTrades, "exit_time", 3).forEach((trade) => {
    alerts.push({
      level: "info",
      title: t("newSellAlert"),
      detail: `${trade.ticker} ${displayStrategyName(trade.strategy) || "-"} ${formatDateOnly(trade.exit_time)}`,
      ticker: trade.ticker,
    });
  });

  if (!alerts.length) {
    els.riskAlertList.innerHTML = `<div class="empty">${escapeHtml(t("noRiskAlerts"))}</div>`;
    return;
  }

  els.riskAlertList.innerHTML = alerts.slice(0, 10).map((alert) => `
    <button class="riskAlertItem ${alert.level}" type="button" ${alert.ticker ? `data-risk-alert-ticker="${escapeHtml(alert.ticker)}"` : ""}>
      <span>${escapeHtml(alert.title)}</span>
      <strong>${alert.detail}</strong>
    </button>
  `).join("");
  els.riskAlertList.querySelectorAll("[data-risk-alert-ticker]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab("overview");
      renderChart(button.dataset.riskAlertTicker);
    });
  });
}

function sortPerformance(strategies) {
  const sortMode = els.performanceSort.value;
  const sorted = [...strategies];

  sorted.sort((left, right) => {
    switch (sortMode) {
      case "current_asc":
        return numberValue(left.current_return_pct) - numberValue(right.current_return_pct);
      case "realized_desc":
        return numberValue(right.realized_return_pct) - numberValue(left.realized_return_pct);
      case "realized_asc":
        return numberValue(left.realized_return_pct) - numberValue(right.realized_return_pct);
      case "win_desc":
        return numberValue(right.win_rate_pct) - numberValue(left.win_rate_pct);
      case "ticker_asc":
        return String(left.ticker).localeCompare(String(right.ticker));
      case "strategy_asc":
        return String(left.strategy).localeCompare(String(right.strategy));
      case "current_desc":
      default:
        return numberValue(right.current_return_pct) - numberValue(left.current_return_pct);
    }
  });
  return sorted;
}

function filterOpenPositions(openTrades) {
  const tickerFilter = els.openPositionTickerFilter.value.trim().toUpperCase();
  const strategyFilter = els.openPositionStrategyFilter.value.trim();
  const confirmFilter = els.openPositionConfirmFilter.value;
  return filterTradesForWatchlist(openTrades).filter((trade) => {
    const ticker = String(trade.ticker || "").toUpperCase();
    const tickerMatches = !tickerFilter || ticker.includes(tickerFilter);
    const strategyMatches =
      !strategyFilter || String(trade.strategy || "") === strategyFilter;
    const confirmMatches =
      confirmFilter === "all" ||
      (confirmFilter === "confirmed" && trade.has_confirm_buy) ||
      (confirmFilter === "unconfirmed" && !trade.has_confirm_buy);
    return tickerMatches && strategyMatches && confirmMatches;
  });
}

function sortOpenPositions(openTrades) {
  const sortMode = els.openPositionSort.value;
  const sorted = [...openTrades];
  sorted.sort((left, right) => {
    switch (sortMode) {
      case "return_asc":
        return numberValue(left.return_pct) - numberValue(right.return_pct);
      case "current_price_desc":
        return numberValue(right.exit_price) - numberValue(left.exit_price);
      case "current_price_asc":
        return numberValue(left.exit_price) - numberValue(right.exit_price);
      case "entry_newest":
        return String(right.entry_time || "").localeCompare(String(left.entry_time || ""));
      case "entry_oldest":
        return String(left.entry_time || "").localeCompare(String(right.entry_time || ""));
      case "ticker_asc":
        return String(left.ticker || "").localeCompare(String(right.ticker || ""));
      case "strategy_asc":
        return String(left.strategy || "").localeCompare(String(right.strategy || ""));
      case "return_desc":
      default:
        return numberValue(right.return_pct) - numberValue(left.return_pct);
    }
  });
  return sorted;
}

function renderPerformance(strategies) {
  if (!strategies.length) {
    els.performanceTable.innerHTML = `<tr><td class="empty" colspan="9">${t("noTrades")}</td></tr>`;
    return;
  }

  els.performanceTable.innerHTML = strategies
    .map((strategy) => {
      const weightPct = kellyAllocationPct(strategy.ticker, strategy.strategy);
      return `
        <tr class="clickableRow" data-performance-ticker="${escapeHtml(strategy.ticker)}" data-performance-strategy="${escapeHtml(strategy.strategy)}">
          <td><strong>${escapeHtml(strategy.ticker)}</strong></td>
          <td><strong>${escapeHtml(displayStrategyName(strategy.strategy))}</strong></td>
          <td>${formatKellyPercent(weightPct)}</td>
          <td>${strategy.closed_trades}</td>
          <td>${strategy.open_trades}</td>
          <td>${formatPercent(strategy.win_rate_pct)}</td>
          <td>${formatSignedPercent(strategy.closed_trades ? allocatedReturnPct(strategy.realized_return_pct, weightPct) : null)}</td>
          <td>${formatSignedPercent(strategy.open_trades ? allocatedReturnPct(strategy.open_return_avg_pct, weightPct) : null)}</td>
          <td>${formatSignedPercent(allocatedReturnPct(strategy.current_return_pct, weightPct))}</td>
        </tr>
      `;
    })
    .join("");

  els.performanceTable.querySelectorAll("[data-performance-ticker]").forEach((row) => {
    row.addEventListener("click", () => {
      applyClosedTradeFilter(row.dataset.performanceTicker, row.dataset.performanceStrategy);
    });
  });
}

function renderBacktestStats(stats) {
  if (!els.backtestStatsTable) return;
  updateBacktestSavedStrategyFilterOptions(state.backtestStats);
  if (!stats.length) {
    els.backtestStatsTable.innerHTML = `<tr><td class="empty" colspan="14">${t("noBacktestStats")}</td></tr>`;
    return;
  }

  els.backtestStatsTable.innerHTML = stats
    .map((stat) => `
      <tr class="clickableRow" data-backtest-stat-id="${escapeHtml(stat.id)}">
        <td><strong>${escapeHtml(stat.ticker || "-")}</strong></td>
        <td><strong>${escapeHtml(displayStrategyName(stat.strategy) || "-")}</strong></td>
        <td>${stat.closed_trades ?? "-"}</td>
        <td>${stat.negative_trades ?? "-"}</td>
        <td>${formatSignedPercent(stat.max_loss_pct)}</td>
        <td>${formatSignedPercent(stat.min_loss_pct)}</td>
        <td>${formatSignedPercent(stat.avg_loss_pct)}</td>
        <td>${formatSignedPercent(stat.max_gain_pct)}</td>
        <td>${formatSignedPercent(stat.avg_gain_pct)}</td>
        <td>${formatHitRate(stat.tp1_hits, stat.tp1_total ?? stat.closed_trades)}</td>
        <td>${formatHitRate(stat.tp2_hits, stat.tp2_total ?? stat.closed_trades)}</td>
        <td>${formatHitRate(stat.tp3_hits, stat.tp3_total ?? stat.closed_trades)}</td>
        <td>${escapeHtml(stat.note || "-")}</td>
        <td class="adminOnly">
          <button class="deleteButton" type="button" data-backtest-delete="${escapeHtml(stat.id)}">${escapeHtml(t("delete"))}</button>
        </td>
      </tr>
    `)
    .join("");

  els.backtestStatsTable.querySelectorAll("[data-backtest-stat-id]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("[data-backtest-delete]")) return;
      const stat = state.backtestStats.find((item) => String(item.id) === row.dataset.backtestStatId);
      if (stat) loadBacktestStatsToForm(stat);
    });
  });
  els.backtestStatsTable.querySelectorAll("[data-backtest-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteBacktestStats(button.dataset.backtestDelete));
  });
}

function updateBacktestSavedStrategyFilterOptions(stats) {
  const currentValue = els.backtestStrategyFilter.value;
  const strategies = uniqueStrategyNames([
    ...(stats || []).map((stat) => stat.strategy),
    ...state.performanceStrategies,
  ]);

  els.backtestStrategyFilter.replaceChildren();
  els.backtestStrategyFilter.append(new Option(t("allStrategies"), ""));
  strategies.forEach((strategy) => {
    els.backtestStrategyFilter.append(new Option(displayStrategyName(strategy), strategy));
  });
  els.backtestStrategyFilter.value = strategies.includes(currentValue) ? currentValue : "";
}

function renderPerformanceClosedTrades(closedTrades) {
  const sorted = [...closedTrades].sort((left, right) =>
    String(right.exit_time || "").localeCompare(String(left.exit_time || ""))
  );

  if (!sorted.length) {
    els.performanceClosedTradesTable.innerHTML =
      `<tr><td class="empty" colspan="10">${t("noClosedTrades")}</td></tr>`;
    return;
  }

  els.performanceClosedTradesTable.innerHTML = sorted
    .map((trade) => {
      const weightPct = kellyAllocationPct(trade.ticker, trade.strategy);
      return `
        <tr data-performance-history-ticker="${escapeHtml(trade.ticker)}">
          <td><strong>${escapeHtml(trade.ticker)}</strong></td>
          <td><strong>${escapeHtml(displayStrategyName(trade.strategy))}</strong></td>
          <td>${escapeHtml(trade.timeframe || "-")}</td>
          <td>${formatPrice(trade.entry_price)}</td>
          <td>${formatPrice(trade.exit_price)}</td>
          <td>${formatSignedPercent(trade.return_pct)}</td>
          <td>${formatKellyPercent(weightPct)}</td>
          <td>${formatSignedPercent(allocatedReturnPct(trade.return_pct, weightPct))}</td>
          <td>${formatDuration(trade.holding_seconds)}</td>
          <td>${formatDate(trade.exit_time)}</td>
        </tr>
      `;
    })
    .join("");

  els.performanceClosedTradesTable
    .querySelectorAll("[data-performance-history-ticker]")
    .forEach((row) => {
      row.addEventListener("click", () => {
        setActiveTab("overview");
        renderChart(row.dataset.performanceHistoryTicker);
      });
    });
}

function renderOpenPositions() {
  const openTrades = sortOpenPositions(filterOpenPositions(state.openTrades));
  renderOpenPositionsTotalReturn(openTrades);
  if (!openTrades.length) {
    els.openPositionsTable.innerHTML = `<tr><td class="empty" colspan="13">${t("noOpenPositions")}</td></tr>`;
    els.openPositionCards.innerHTML = `<div class="empty">${t("noOpenPositions")}</div>`;
    return;
  }

  els.openPositionsTable.innerHTML = openTrades
    .map((trade) => {
      const tickerClass = trade.has_confirm_buy ? "confirmedTicker" : "";
      const confirmTitle = trade.has_confirm_buy ? t("confirmBuyTitle") : "";
      const weightPct = kellyAllocationPct(trade.ticker, trade.strategy);
      const allocatedPl = allocatedReturnPct(trade.return_pct, weightPct);
      const signals = positionSignals(trade);
      const positionKey = tickerStrategyKey(trade.ticker, trade.strategy);
      return `
      <tr data-position-key="${escapeHtml(positionKey)}">
        <td><strong class="${tickerClass}" title="${escapeHtml(confirmTitle)}">${escapeHtml(trade.ticker)}</strong></td>
        <td><strong>${escapeHtml(displayStrategyName(trade.strategy))}</strong></td>
        <td>${escapeHtml(trade.timeframe || "-")}</td>
        <td>${formatPrice(trade.entry_price)}</td>
        <td>${formatPrice(trade.exit_price)}</td>
        <td>${formatSignedPercent(trade.return_pct)}</td>
        <td>${formatKellyPercent(weightPct)}</td>
        <td>${formatSignedPercent(allocatedPl)}</td>
        <td>${renderConfirmations(signals)}</td>
        <td>${renderDividendNotes(trade.dividend_notes || [])}</td>
        <td>${formatHoldingDaysBetween(trade.entry_time)}</td>
        <td>${formatDate(trade.entry_time)}</td>
        <td class="adminOnly">
          <button
            class="deleteButton"
            type="button"
            data-open-position-delete-id="${escapeHtml(trade.entry_signal_id)}"
            data-open-position-delete-ticker="${escapeHtml(trade.ticker)}"
            data-open-position-delete-strategy="${escapeHtml(trade.strategy)}"
            title="${escapeHtml(t("deleteOpenPositionTitle"))}"
          >
            ${escapeHtml(t("delete"))}
          </button>
        </td>
      </tr>
    `;
    })
    .join("");
  els.openPositionCards.innerHTML = openTrades
    .map((trade) => {
      const weightPct = kellyAllocationPct(trade.ticker, trade.strategy);
      const allocatedPl = allocatedReturnPct(trade.return_pct, weightPct);
      const signals = positionSignals(trade);
      const positionKey = tickerStrategyKey(trade.ticker, trade.strategy);
      const dividendToday = (trade.dividend_notes || []).some((note) =>
        note.status === "upcoming" && Number(note.days_until) === 0
      );
      const dividendUpcoming = (trade.dividend_notes || []).some((note) => note.status === "upcoming");
      return `
      <article class="positionCard" data-position-card-key="${escapeHtml(positionKey)}">
        <div class="positionCardHead">
          <div>
            <strong class="${trade.has_confirm_buy ? "confirmedTicker" : ""}">${escapeHtml(trade.ticker)}</strong>
            <span>${escapeHtml(displayStrategyName(trade.strategy) || "-")} · ${escapeHtml(trade.timeframe || "-")}</span>
          </div>
          ${formatSignedPercent(trade.return_pct)}
        </div>
        <div class="positionCardMetrics">
          <div><span>${escapeHtml(t("entryShort"))}</span><strong>${formatPrice(trade.entry_price)}</strong></div>
          <div><span>${escapeHtml(t("currentShort"))}</span><strong>${formatPrice(trade.exit_price)}</strong></div>
          <div><span>${escapeHtml(t("allocationWeight"))}</span><strong>${formatKellyPercent(weightPct)}</strong></div>
          <div><span>${escapeHtml(t("portfolioPl"))}</span><strong>${formatSignedPercent(allocatedPl)}</strong></div>
          <div><span>${escapeHtml(t("daysShort"))}</span><strong>${formatHoldingDaysBetween(trade.entry_time)}</strong></div>
        </div>
        <div class="positionCardSignal">
          ${signals.length
            ? `<span class="confirmBadge">${escapeHtml(t("confirmedStatus"))}</span>`
            : `<span class="mutedText">${escapeHtml(t("unconfirmedStatus"))}</span>`}
          ${averageLossSignalForTrade(trade)
            ? `<span class="confirmBadge avgLossBadge">${escapeHtml(t("avgLossSignal"))}</span>`
            : ""}
          ${averageGainSignalForTrade(trade)
            ? `<span class="confirmBadge avgGainBadge">${escapeHtml(t("avgGainSignal"))}</span>`
            : ""}
          ${dividendUpcoming
            ? `<span class="dividendBadge ${dividendToday ? "today" : "upcoming"}">${escapeHtml(dividendToday ? t("exDateTodayShort") : t("upcomingDividend"))}</span>`
            : ""}
        </div>
        <div class="positionCardActions adminOnly">
          <button
            class="deleteButton"
            type="button"
            data-open-position-delete-id="${escapeHtml(trade.entry_signal_id)}"
            data-open-position-delete-ticker="${escapeHtml(trade.ticker)}"
            data-open-position-delete-strategy="${escapeHtml(trade.strategy)}"
            title="${escapeHtml(t("deleteOpenPositionTitle"))}"
          >
            ${escapeHtml(t("delete"))}
          </button>
        </div>
      </article>
    `;
    })
    .join("");

  els.openPositionsTable.querySelectorAll("[data-position-key]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("[data-open-position-delete-id]")) return;
      openPositionInsight(row.dataset.positionKey);
    });
  });
  els.openPositionCards.querySelectorAll("[data-position-card-key]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-open-position-delete-id]")) return;
      openPositionInsight(card.dataset.positionCardKey);
    });
  });
  els.openPositionsTable
    .querySelectorAll("[data-open-position-delete-id]")
    .forEach(bindOpenPositionDeleteButton);
  els.openPositionCards
    .querySelectorAll("[data-open-position-delete-id]")
    .forEach(bindOpenPositionDeleteButton);
}

function bindOpenPositionDeleteButton(button) {
  button.addEventListener("click", async (event) => {
    event.stopPropagation();
    await deleteOpenPosition(
      button.dataset.openPositionDeleteId,
      button.dataset.openPositionDeleteTicker,
      button.dataset.openPositionDeleteStrategy
    );
  });
}

async function deleteOpenPosition(signalId, ticker, strategy) {
  const label = [ticker, displayStrategyName(strategy)].filter(Boolean).join(" - ");
  const message = label
    ? `${t("deleteOpenPositionConfirm")}\n\n${label}`
    : t("deleteOpenPositionConfirm");
  if (!window.confirm(message)) {
    return;
  }
  const response = await fetch(`/api/signals/${encodeURIComponent(signalId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    window.alert(t("deleteOpenPositionFailed"));
    return;
  }
  await refresh();
}

function openPositionInsight(positionKey) {
  const trade = (state.openTrades || []).find((item) =>
    tickerStrategyKey(item.ticker, item.strategy) === positionKey
  );
  if (!trade) return;

  const weightPct = kellyAllocationPct(trade.ticker, trade.strategy);
  const kellyEntry = findKellyEntry(trade.ticker, trade.strategy);
  const backtestStat = backtestStatForTrade(trade);

  els.positionInsightTitle.textContent = trade.ticker || "-";
  els.positionInsightSubtitle.textContent = `${displayStrategyName(trade.strategy) || "-"} · ${trade.timeframe || "-"}`;
  els.positionInsightChart.dataset.positionInsightTicker = trade.ticker || "";
  els.positionInsightBody.innerHTML = `
    ${renderInsightSection(t("currentPosition"), [
      insightMetric(t("entryPrice"), formatPrice(trade.entry_price)),
      insightMetric(t("currentPrice"), formatPrice(trade.exit_price)),
      insightMetric(t("returnPct"), formatSignedPercent(trade.return_pct)),
      insightMetric(t("recommendedAllocation"), formatKellyPercent(weightPct)),
      insightMetric(t("portfolioPl"), formatSignedPercent(allocatedReturnPct(trade.return_pct, weightPct))),
      insightMetric(t("holdingDays"), formatHoldingDaysBetween(trade.entry_time)),
      insightMetric(t("entryTime"), escapeHtml(formatDate(trade.entry_time))),
    ])}
    ${renderKellyInsight(kellyEntry)}
    ${renderBacktestInsight(backtestStat)}
  `;
  els.positionInsightModal.hidden = false;
}

function closePositionInsight() {
  els.positionInsightModal.hidden = true;
  els.positionInsightBody.innerHTML = "";
  delete els.positionInsightChart.dataset.positionInsightTicker;
}

function renderInsightSection(title, metrics, emptyText = "") {
  const body = metrics.length
    ? metrics.map((metric) => `
        <div class="insightMetric">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${metric.value}</strong>
        </div>
      `).join("")
    : `<p class="empty">${escapeHtml(emptyText)}</p>`;
  return `
    <section class="insightSection">
      <h3>${escapeHtml(title)}</h3>
      <div class="insightMetricGrid">${body}</div>
    </section>
  `;
}

function insightMetric(label, value) {
  return { label, value: value === null || value === undefined || value === "" ? "-" : value };
}

function renderKellyInsight(entry) {
  if (!entry) {
    return renderInsightSection(t("kellySummary"), [], t("noKellyForPosition"));
  }
  const result = calculateKelly(entry);
  return renderInsightSection(t("kellySummary"), [
    insightMetric(t("recommendedAllocation"), formatKellyPercent(result.recommendedPct)),
    insightMetric(t("fullKelly"), formatSignedPercent(result.fullKellyPct)),
    insightMetric(t("quarterKelly"), formatKellyPercent(result.quarterKellyPct)),
    insightMetric(t("edge"), formatSignedPercent(result.edgePct)),
    insightMetric(t("winLossRatio"), formatRatio(result.winLossRatio)),
    insightMetric(t("winRate"), formatKellyPercent(kellyWinRatePct(entry))),
    insightMetric(t("winningTrades"), `${formatPrice(entry.winningTrades)} / ${formatPrice(entry.totalTrades)}`),
    insightMetric(t("profitFactor"), formatRatio(entry.profitFactor)),
    insightMetric(t("kellyMaxDrawdown"), formatKellyPercent(entry.maxDrawdown)),
    insightMetric(t("targetDrawdown"), formatKellyPercent(entry.targetDrawdown)),
  ]);
}

function renderBacktestInsight(stat) {
  if (!stat) {
    return renderInsightSection(t("backtestSummary"), [], t("noBacktestForPosition"));
  }
  return renderInsightSection(t("backtestSummary"), [
    insightMetric(t("closedTrades"), stat.closed_trades ?? "-"),
    insightMetric(t("negativeTrades"), stat.negative_trades ?? "-"),
    insightMetric(t("maxLoss"), formatSignedPercent(stat.max_loss_pct)),
    insightMetric(t("minLoss"), formatSignedPercent(stat.min_loss_pct)),
    insightMetric(t("avgLoss"), formatSignedPercent(stat.avg_loss_pct)),
    insightMetric(t("maxGain"), formatSignedPercent(stat.max_gain_pct)),
    insightMetric(t("avgGain"), formatSignedPercent(stat.avg_gain_pct)),
    insightMetric(t("tp1HitRate"), formatHitRate(stat.tp1_hits, stat.tp1_total ?? stat.closed_trades)),
    insightMetric(t("tp2HitRate"), formatHitRate(stat.tp2_hits, stat.tp2_total ?? stat.closed_trades)),
    insightMetric(t("tp3HitRate"), formatHitRate(stat.tp3_hits, stat.tp3_total ?? stat.closed_trades)),
  ]);
}

function positionSignals(trade) {
  const confirmations = [...(trade.confirmations || [])];
  const avgLossSignal = averageLossSignalForTrade(trade);
  if (avgLossSignal) {
    confirmations.push({
      strategy: t("avgLossSignal"),
      action: "avg_loss",
      price: trade.exit_price,
      time: new Date().toISOString(),
      detail: averageLossSignalDetail(avgLossSignal),
    });
  }
  const avgGainSignal = averageGainSignalForTrade(trade);
  if (avgGainSignal) {
    confirmations.push({
      strategy: t("avgGainSignal"),
      action: "avg_gain",
      price: trade.exit_price,
      time: new Date().toISOString(),
      detail: averageGainSignalDetail(avgGainSignal),
    });
  }
  return confirmations;
}

function renderConfirmations(confirmations) {
  if (!confirmations.length) {
    return `<span class="mutedText">${escapeHtml(t("noConfirmations"))}</span>`;
  }
  return `
    <div class="confirmTimeline">
      ${confirmations
        .map((confirmation) => {
          const isAvgLoss = confirmation.action === "avg_loss";
          const isAvgGain = confirmation.action === "avg_gain";
          return `
          <span class="confirmBadge ${isAvgLoss ? "avgLossBadge" : ""} ${isAvgGain ? "avgGainBadge" : ""}" title="${escapeHtml(formatDate(confirmation.time))}">
            ${escapeHtml(displayStrategyName(confirmation.strategy) || confirmation.action || "-")}
            <small>${isAvgLoss || isAvgGain
              ? confirmation.detail
              : `${escapeHtml(formatPrice(confirmation.price))} · ${escapeHtml(formatDateOnly(confirmation.time))}`}</small>
          </span>
        `;
        })
        .join("")}
    </div>
  `;
}

function renderDividendNotes(notes) {
  if (!notes.length) {
    return `<span class="mutedText">${escapeHtml(t("noDividends"))}</span>`;
  }
  return `
    <div class="confirmTimeline">
      ${notes
        .map((note) => {
          const isApplied = note.status === "applied";
          const isToday = !isApplied && Number(note.days_until) === 0;
          const label = isApplied ? t("appliedDividend") : isToday ? t("exDateTodayShort") : t("upcomingDividend");
          const badgeClass = isApplied ? "applied" : isToday ? "today" : "upcoming";
          const detail = [
            note.cash_amount ? `${formatPrice(note.cash_amount)} cash` : "",
            note.stock_ratio_pct ? `${formatPercent(note.stock_ratio_pct)} stock` : "",
            note.issue_ratio_pct ? `${formatPercent(note.issue_ratio_pct)} issue` : "",
            note.issue_price ? `${formatPrice(note.issue_price)} price` : "",
            note.days_until !== undefined ? `${note.days_until}d` : "",
          ].filter(Boolean).join(" · ");
          return `
            <span class="dividendBadge ${badgeClass}" title="${escapeHtml(note.note || "")}">
              ${escapeHtml(label)}
              <small>${escapeHtml(formatDateOnly(note.ex_date))}${detail ? ` · ${escapeHtml(detail)}` : ""}</small>
            </span>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderOpenPositionsTotalReturn(openTrades) {
  const totalReturn = openTrades.reduce((sum, trade) => {
    const value = allocatedReturnPct(trade.return_pct, kellyAllocationPct(trade.ticker, trade.strategy));
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);
  els.openPositionsTotalReturn.innerHTML = openTrades.length
    ? formatSignedPercent(totalReturn)
    : "-";
}

function renderClosedTrades(closedTrades) {
  const filtered = filterClosedTrades(closedTrades);
  updateClosedTradesFilterLabel();
  const sorted = [...filtered].sort((left, right) =>
    String(right.exit_time || "").localeCompare(String(left.exit_time || ""))
  );

  if (!sorted.length) {
    els.closedTradesTable.innerHTML = `<tr><td class="empty" colspan="10">${t("noClosedTrades")}</td></tr>`;
    return;
  }

  els.closedTradesTable.innerHTML = sorted
    .map((trade) => {
      const weightPct = kellyAllocationPct(trade.ticker, trade.strategy);
      return `
      <tr data-ticker="${escapeHtml(trade.ticker)}">
        <td><strong>${escapeHtml(trade.ticker)}</strong></td>
        <td><strong>${escapeHtml(displayStrategyName(trade.strategy))}</strong></td>
        <td>${formatPrice(trade.entry_price)}</td>
        <td>${formatPrice(trade.exit_price)}</td>
        <td>${formatSignedPercent(trade.return_pct)}</td>
        <td>${formatKellyPercent(weightPct)}</td>
        <td>${formatSignedPercent(allocatedReturnPct(trade.return_pct, weightPct))}</td>
        <td>${formatDuration(trade.holding_seconds)}</td>
        <td>${formatDate(trade.exit_time)}</td>
        <td class="adminOnly">
          ${trade.exit_signal_id ? `
            <button class="restoreButton" type="button" data-reopen-exit-id="${escapeHtml(trade.exit_signal_id)}" title="${escapeHtml(t("reopenPositionTitle"))}">
              ${escapeHtml(t("reopenPosition"))}
            </button>
          ` : "-"}
        </td>
      </tr>
    `;
    })
    .join("");

  els.closedTradesTable.querySelectorAll("[data-ticker]").forEach((row) => {
    row.addEventListener("click", () => renderChart(row.dataset.ticker));
  });
  els.closedTradesTable.querySelectorAll("[data-reopen-exit-id]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      await reopenClosedTrade(button.dataset.reopenExitId);
    });
  });
}

function filterClosedTrades(closedTrades) {
  const visibleClosedTrades = filterTradesForWatchlist(
    hideClosedTradesForReopenedPositions(closedTrades)
  );
  if (!state.closedTradeFilter) return visibleClosedTrades;
  const ticker = state.closedTradeFilter.ticker;
  const strategy = state.closedTradeFilter.strategy;
  return visibleClosedTrades.filter(
    (trade) => trade.ticker === ticker && trade.strategy === strategy
  );
}

function hideClosedTradesForReopenedPositions(closedTrades) {
  const openKeys = new Set(state.openTrades.map(tradeIdentityKey));
  if (!openKeys.size) return closedTrades;
  return closedTrades.filter((trade) => !openKeys.has(tradeIdentityKey(trade)));
}

function tradeIdentityKey(trade) {
  return `${String(trade.ticker || "").trim().toUpperCase()}::${String(trade.strategy || "").trim().toLowerCase()}`;
}

function applyClosedTradeFilter(ticker, strategy) {
  state.closedTradeFilter = { ticker, strategy };
  renderClosedTrades(state.closedTrades);
  setActiveTab("positions");
}

function clearClosedTradeFilter() {
  state.closedTradeFilter = null;
  renderClosedTrades(state.closedTrades);
}

function updateClosedTradesFilterLabel() {
  if (!state.closedTradeFilter) {
    els.closedTradesFilter.hidden = true;
    els.closedTradesFilterLabel.textContent = "";
    return;
  }
  els.closedTradesFilter.hidden = false;
  els.closedTradesFilterLabel.textContent =
    `${t("filteredTrades")} ${state.closedTradeFilter.ticker} / ${displayStrategyName(state.closedTradeFilter.strategy)}`;
}

function updateWatchlistControls() {
  els.watchlistInput.value = state.watchlist.join(",");
  els.watchlistOnly.checked = state.watchlistOnly;
}

function updateWatchlistFromInput() {
  state.watchlist = parseWatchlist(els.watchlistInput.value);
  saveWatchlist();
  refresh();
}

function toggleWatchlistOnly() {
  state.watchlistOnly = els.watchlistOnly.checked;
  localStorage.setItem("dashboardWatchlistOnly", String(state.watchlistOnly));
  refresh();
}

function addSelectedTickerToWatchlist() {
  const ticker = (state.selectedTicker || "").trim().toUpperCase();
  if (!ticker) return;
  if (!state.watchlist.includes(ticker)) {
    state.watchlist.push(ticker);
    saveWatchlist();
    updateWatchlistControls();
  }
}

function renderInvalidSignals(invalidSignals) {
  if (!invalidSignals.length) {
    els.invalidSignalsTable.innerHTML = `<tr><td class="empty" colspan="6">${t("noInvalidSignals")}</td></tr>`;
    return;
  }

  els.invalidSignalsTable.innerHTML = invalidSignals
    .slice(0, 100)
    .map((signal) => `
      <tr>
        <td>${formatSignalTime(signal)}</td>
        <td><strong>${escapeHtml(signal.ticker || "-")}</strong></td>
        <td>${escapeHtml(signal.action || "-")}</td>
        <td>${escapeHtml(signal.timeframe || "-")}</td>
        <td>${escapeHtml(displayStrategyName(signal.strategy) || "-")}</td>
        <td>${escapeHtml(formatReason(signal.reason))}</td>
      </tr>
    `)
    .join("");
}

function formatReason(reason) {
  const key = {
    duplicate_webhook: "duplicateWebhook",
    sell_without_open_buy: "sellWithoutOpenBuy",
    missing_buy_price: "missingBuyPrice",
    missing_sell_price: "missingSellPrice",
    position_already_open: "positionAlreadyOpen",
    base_strategy_not_open: "baseStrategyNotOpen",
  }[reason];
  return key ? t(key) : reason || "-";
}

function drawEquityCurve(closedTrades) {
  const canvas = els.equityCanvas;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const sorted = [...closedTrades].sort((left, right) =>
    String(left.exit_time || "").localeCompare(String(right.exit_time || ""))
  );
  if (!sorted.length) {
    ctx.fillStyle = cssVar("--muted") || "#66727a";
    ctx.font = "14px system-ui";
    ctx.fillText(t("noClosedTrades"), 18, 38);
    return;
  }

  const points = [{ value: 100, label: "Start" }];
  sorted.forEach((trade) => {
    const previous = points[points.length - 1].value;
    const allocatedReturn =
      allocatedReturnPct(trade.return_pct, kellyAllocationPct(trade.ticker, trade.strategy)) || 0;
    points.push({
      value: previous * (1 + allocatedReturn / 100),
      label: trade.ticker,
    });
  });

  const pad = { top: 24, right: 48, bottom: 30, left: 18 };
  const width = rect.width - pad.left - pad.right;
  const height = rect.height - pad.top - pad.bottom;
  const min = Math.min(...points.map((point) => point.value));
  const max = Math.max(...points.map((point) => point.value));
  const range = max - min || 1;

  ctx.strokeStyle = cssVar("--line") || "#dbe2df";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(rect.width - pad.right + 6, y);
    ctx.stroke();
    const label = max - (range / 4) * i;
    ctx.fillStyle = cssVar("--muted") || "#66727a";
    ctx.font = "12px system-ui";
    ctx.fillText(label.toFixed(1), rect.width - pad.right + 10, y + 4);
  }

  ctx.strokeStyle = cssVar("--accent") || "#245c7a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = pad.left + (width / Math.max(1, points.length - 1)) * index;
    const y = pad.top + height - ((point.value - min) / range) * height;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  const last = points[points.length - 1];
  ctx.fillStyle = cssVar("--ink") || "#152025";
  ctx.font = "700 12px system-ui";
  ctx.fillText(`${last.value.toFixed(2)}`, pad.left, rect.height - 9);
}

function drawManualEquityCurve(curve) {
  const canvas = els.manualEquityCanvas;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const points = (curve || [])
    .map((point) => ({
      value: Number(point.value),
      label: point.time || "",
    }))
    .filter((point) => Number.isFinite(point.value));

  if (!points.length) {
    ctx.fillStyle = cssVar("--muted") || "#66727a";
    ctx.font = "14px system-ui";
    ctx.fillText(t("noManualPositions"), 18, 38);
    return;
  }

  const pad = { top: 24, right: 48, bottom: 30, left: 18 };
  const width = rect.width - pad.left - pad.right;
  const height = rect.height - pad.top - pad.bottom;
  const min = Math.min(...points.map((point) => point.value), 100);
  const max = Math.max(...points.map((point) => point.value), 100);
  const range = max - min || 1;

  ctx.strokeStyle = cssVar("--line") || "#dbe2df";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(rect.width - pad.right + 6, y);
    ctx.stroke();
    const label = max - (range / 4) * i;
    ctx.fillStyle = cssVar("--muted") || "#66727a";
    ctx.font = "12px system-ui";
    ctx.fillText(label.toFixed(1), rect.width - pad.right + 10, y + 4);
  }

  ctx.strokeStyle = cssVar("--accent") || "#245c7a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = pad.left + (width / Math.max(1, points.length - 1)) * index;
    const y = pad.top + height - ((point.value - min) / range) * height;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  const last = points[points.length - 1];
  ctx.fillStyle = cssVar("--ink") || "#152025";
  ctx.font = "700 12px system-ui";
  ctx.fillText(`${last.value.toFixed(2)}`, pad.left, rect.height - 9);
}

function drawDerivativeEquityCurve(curve) {
  const canvas = els.derivativeEquityCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const points = (curve || [])
    .map((point) => ({
      equity: Number(point.equity),
      drawdown: Number(point.drawdown_vnd || 0),
    }))
    .filter((point) => Number.isFinite(point.equity));
  if (points.length < 2) {
    ctx.fillStyle = cssVar("--muted") || "#66727a";
    ctx.font = "14px system-ui";
    ctx.fillText(t("noDerivativeTrades"), 18, 38);
    return;
  }

  const pad = { top: 24, right: 76, bottom: 32, left: 18 };
  const width = rect.width - pad.left - pad.right;
  const height = rect.height - pad.top - pad.bottom;
  const values = points.map((point) => point.equity);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const maxDrawdown = Math.max(...points.map((point) => point.drawdown), 1);

  ctx.strokeStyle = cssVar("--line") || "#dbe2df";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(rect.width - pad.right, y);
    ctx.stroke();
    ctx.fillStyle = cssVar("--muted") || "#66727a";
    ctx.font = "12px system-ui";
    ctx.fillText(compactVnd(max - (range / 4) * i), rect.width - pad.right + 8, y + 4);
  }

  const stepX = width / Math.max(1, points.length - 1);
  const barWidth = Math.max(2, Math.min(12, stepX * 0.55));
  points.forEach((point, index) => {
    if (point.drawdown <= 0) return;
    const x = pad.left + stepX * index;
    const barHeight = (point.drawdown / maxDrawdown) * (height * 0.34);
    ctx.fillStyle = "rgba(202, 62, 62, 0.45)";
    ctx.fillRect(x - barWidth / 2, pad.top + height - barHeight, barWidth, barHeight);
  });

  ctx.strokeStyle = cssVar("--buy") || "#16a085";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = pad.left + stepX * index;
    const y = pad.top + height - ((point.equity - min) / range) * height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const last = points[points.length - 1];
  ctx.fillStyle = cssVar("--ink") || "#152025";
  ctx.font = "700 12px system-ui";
  ctx.fillText(formatVnd(last.equity), pad.left, rect.height - 9);
}

function renderSummary(summary) {
  if (!els.total || !state.user) return;
  if (state.user.role !== "admin" && featureEnabled(["positions", "performance"])) {
    const openReturn = state.openTrades.reduce((sum, trade) => {
      const value = allocatedReturnPct(trade.return_pct, kellyAllocationPct(trade.ticker, trade.strategy));
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
    const today = localMarketDate();
    const todaySignals = state.signals.filter(
      (signal) => marketDateKey(signalTimeValue(signal)) === today
    ).length;
    els.metricTotalLabel.textContent = t("userOpenPositions");
    els.metricBuyLabel.textContent = t("userOpenPl");
    els.metricSellLabel.textContent = t("userTodaySignals");
    els.metricTickerLabel.textContent = t("userAlerts");
    els.total.textContent = state.openTrades.length;
    els.buy.innerHTML = state.openTrades.length ? formatSignedPercent(openReturn) : "-";
    els.sell.textContent = todaySignals;
    els.tickers.textContent = userAttentionItems().length;
  } else {
    const visibleSummary = state.watchlistOnly ? summarizeSignals(state.signals) : summary;
    els.metricTotalLabel.textContent = t("total");
    els.metricBuyLabel.textContent = t("buy");
    els.metricSellLabel.textContent = t("sell");
    els.metricTickerLabel.textContent = t("tickers");
    els.total.textContent = visibleSummary.total ?? 0;
    els.buy.textContent = visibleSummary.buy_count ?? 0;
    els.sell.textContent = visibleSummary.sell_count ?? 0;
    els.tickers.textContent = visibleSummary.tickers ?? 0;
  }
  els.lastUpdated.textContent = summary.latest_received_at
    ? formatDate(summary.latest_received_at)
    : t("waitingWebhook");
  els.lastUpdated.dataset.empty = summary.latest_received_at ? "false" : "true";
}

function marketDateKey(value) {
  const date = parseDateValue(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function userAttentionItems() {
  return state.openTrades
    .map((trade) => {
      const upcomingDividend = (trade.dividend_notes || []).find(
        (note) => note.status === "upcoming"
      );
      if (Number(trade.return_pct) <= -5) {
        return { trade, reason: t("alertLoss"), priority: 1 };
      }
      if ((trade.confirmations || []).length) {
        return { trade, reason: t("alertSignal"), priority: 2 };
      }
      if (upcomingDividend) {
        return { trade, reason: t("alertDividend"), priority: 3 };
      }
      return null;
    })
    .filter(Boolean)
    .sort((left, right) => left.priority - right.priority);
}

function renderUserAttention() {
  if (!els.userAttentionList || state.user?.role === "admin") return;
  const items = userAttentionItems().slice(0, 3);
  els.userAttentionPanel.hidden = !items.length;
  if (!items.length) {
    els.userAttentionList.innerHTML = `<div class="attentionEmpty">${escapeHtml(t("noAttention"))}</div>`;
    return;
  }
  els.userAttentionList.innerHTML = items
    .map(({ trade, reason }) => `
      <article class="attentionItem" data-attention-ticker="${escapeHtml(trade.ticker)}">
        <div class="attentionItemHead">
          <strong>${escapeHtml(trade.ticker)}</strong>
          ${formatSignedPercent(trade.return_pct)}
        </div>
        <p>${escapeHtml(reason)} · ${escapeHtml(displayStrategyName(trade.strategy) || "-")}</p>
      </article>
    `)
    .join("");
  els.userAttentionList.querySelectorAll("[data-attention-ticker]").forEach((item) => {
    item.addEventListener("click", () => renderChart(item.dataset.attentionTicker));
  });
}

function summarizeSignals(signals) {
  const tickers = new Set();
  let buyCount = 0;
  let sellCount = 0;
  signals.forEach((signal) => {
    if (signal.ticker) tickers.add(signal.ticker);
    const action = String(signal.action || "").toLowerCase();
    if (action === "buy") buyCount += 1;
    if (action === "sell") sellCount += 1;
  });
  return {
    total: signals.length,
    buy_count: buyCount,
    sell_count: sellCount,
    tickers: tickers.size,
  };
}

function renderSignals() {
  if (!state.signals.length) {
    els.table.innerHTML = `<tr><td class="empty" colspan="7">${t("noSignals")}</td></tr>`;
    els.signalCards.innerHTML = `<div class="empty">${t("noSignals")}</div>`;
    return;
  }

  els.table.innerHTML = state.signals
    .map((signal) => {
      const action = (signal.action || "").toLowerCase();
      return `
        <tr data-ticker="${escapeHtml(signal.ticker)}">
          <td>${formatSignalTime(signal)}</td>
          <td><strong>${escapeHtml(signal.ticker)}</strong></td>
          <td><span class="side ${action}">${escapeHtml(signal.action)}</span></td>
          <td>${formatPrice(signal.price)}</td>
          <td>${escapeHtml(signal.timeframe || "-")}</td>
          <td>${escapeHtml(displayStrategyName(signal.strategy) || "-")}</td>
          <td class="adminOnly">
            <button class="deleteButton" type="button" data-delete-id="${signal.id}" title="${escapeHtml(t("deleteTitle"))}" aria-label="${escapeHtml(`${t("deleteTitle")} ${signal.id}`)}">${escapeHtml(t("delete"))}</button>
          </td>
        </tr>
      `;
    })
    .join("");
  els.signalCards.innerHTML = state.signals
    .map((signal) => {
      const action = String(signal.action || "").toLowerCase();
      return `
        <article class="signalCard" data-signal-card-ticker="${escapeHtml(signal.ticker)}">
          <span class="side ${action}">${escapeHtml(signal.action)}</span>
          <div>
            <strong>${escapeHtml(signal.ticker)}</strong>
            <span class="signalCardMeta">${escapeHtml(displayStrategyName(signal.strategy) || "-")} · ${escapeHtml(signal.timeframe || "-")}</span>
          </div>
          <strong>${formatPrice(signal.price)}</strong>
          <time>${formatSignalTime(signal)}</time>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-ticker]").forEach((row) => {
    row.addEventListener("click", () => renderChart(row.dataset.ticker));
  });
  els.signalCards.querySelectorAll("[data-signal-card-ticker]").forEach((card) => {
    card.addEventListener("click", () => renderChart(card.dataset.signalCardTicker));
  });
  document.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      await deleteSignal(button.dataset.deleteId);
    });
  });
}

async function deleteSignal(signalId) {
  if (!window.confirm(t("deleteConfirm"))) {
    return;
  }
  const response = await fetch(`/api/signals/${encodeURIComponent(signalId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    window.alert(t("deleteFailed"));
    return;
  }
  await refresh();
}

async function reopenClosedTrade(exitSignalId) {
  if (!window.confirm(t("reopenPositionConfirm"))) {
    return;
  }
  const response = await fetch(`/api/signals/${encodeURIComponent(exitSignalId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    window.alert(t("reopenPositionFailed"));
    return;
  }
  await refresh();
}

async function loadChartPayload(ticker) {
  const payload = await fetchJson(`/api/chart/${encodeURIComponent(ticker)}`);
  const history = normalizeHistory(payload.history || []);
  return { ...payload, normalizedHistory: history };
}

async function renderChart(ticker) {
  const requestId = ++priceChartState.requestId;
  state.selectedTicker = ticker;
  els.chartTitle.textContent = ticker;
  renderTickerTimeline(ticker);
  let payload;
  try {
    payload = await loadChartPayload(ticker);
  } catch (error) {
    if (requestId === priceChartState.requestId) {
      console.error(`Failed to load chart for ${ticker}`, error);
      clearChart(t("noHistory"));
    }
    return;
  }
  if (requestId !== priceChartState.requestId) return;
  drawCandles(
    payload.normalizedHistory,
    normalizeMarkers(payload.markers || []),
    ticker
  );
}

function renderTickerTimeline(ticker) {
  const normalizedTicker = String(ticker || "").toUpperCase();
  if (!normalizedTicker) {
    els.timelineTitle.textContent = t("noTickerSelected");
    els.tickerTimeline.innerHTML = `<div class="empty">${t("noTickerSelected")}</div>`;
    return;
  }

  els.timelineTitle.textContent = normalizedTicker;
  const timeline = state.signals
    .filter((signal) => String(signal.ticker || "").toUpperCase() === normalizedTicker)
    .sort((left, right) => signalTimeSortValue(right) - signalTimeSortValue(left));

  if (!timeline.length) {
    els.tickerTimeline.innerHTML = `<div class="empty">${t("noTimeline")}</div>`;
    return;
  }

  els.tickerTimeline.innerHTML = timeline
    .slice(0, 30)
    .map((signal) => {
      const action = String(signal.action || "").toLowerCase();
      return `
        <div class="timelineItem">
          <span class="side ${escapeHtml(action)}">${escapeHtml(signal.action || "-")}</span>
          <div>
            <strong>${formatPrice(signal.price)}</strong>
            <span>${escapeHtml(signal.timeframe || "-")} / ${escapeHtml(displayStrategyName(signal.strategy) || "-")}</span>
          </div>
          <time>${formatSignalTime(signal)}</time>
        </div>
      `;
    })
    .join("");
}

function normalizeHistory(history) {
  const rowsByTime = new Map();
  history
    .map((row) => ({
      time: normalizeChartTime(row.time || row.date || row.tradingDate || row.trading_date || ""),
      open: Number(row.open ?? row.Open ?? row.openPrice ?? row.o),
      high: Number(row.high ?? row.High ?? row.highPrice ?? row.h),
      low: Number(row.low ?? row.Low ?? row.lowPrice ?? row.l),
      close: Number(row.close ?? row.Close ?? row.closePrice ?? row.c),
      volume: Number(row.volume ?? row.Volume ?? row.v ?? 0),
    }))
    .filter((row) =>
      row.time && [row.open, row.high, row.low, row.close].every((value) => Number.isFinite(value))
    )
    .forEach((row) => rowsByTime.set(row.time, row));
  return [...rowsByTime.values()].sort((left, right) => left.time.localeCompare(right.time));
}

function normalizeMarkers(markers) {
  return markers
    .map((marker) => ({
      action: (marker.action || "").toLowerCase(),
      price: Number(marker.price),
      strategy: marker.strategy || "",
      time: marker.source_time || marker.received_at || "",
    }))
    .filter((marker) => ["buy", "sell"].includes(marker.action));
}

function drawCandles(rows, markers = [], ticker = "") {
  ensurePriceChart();
  if (!rows.length) {
    clearChart(t("noHistory"));
    return;
  }

  els.chartEmpty.hidden = true;
  priceChartState.candleSeries.setData(rows.map(({ time, open, high, low, close }) => ({
    time,
    open,
    high,
    low,
    close,
  })));
  priceChartState.volumeSeries.setData(rows
    .filter((row) => Number.isFinite(row.volume) && row.volume > 0)
    .map((row) => ({
      time: row.time,
      value: row.volume,
      color: row.close >= row.open
        ? colorWithAlpha(cssVar("--buy") || "#078465", 0.42)
        : colorWithAlpha(cssVar("--sell") || "#c2413a", 0.42),
    })));
  priceChartState.markerPlugin.setMarkers(toSeriesMarkers(markers, rows));

  if (priceChartState.ticker !== ticker) {
    priceChartState.chart.timeScale().fitContent();
  }
  priceChartState.ticker = ticker;
}

function ensurePriceChart() {
  if (priceChartState.chart) return;
  if (!window.LightweightCharts) {
    throw new Error("Lightweight Charts failed to load");
  }

  const chart = window.LightweightCharts.createChart(els.chart, {
    width: Math.max(1, els.chart.clientWidth),
    height: Math.max(1, els.chart.clientHeight),
    localization: { locale: state.language === "vi" ? "vi-VN" : "en-US" },
    rightPriceScale: { borderVisible: false },
    timeScale: {
      borderVisible: false,
      timeVisible: false,
      secondsVisible: false,
      rightOffset: 5,
    },
    crosshair: { mode: window.LightweightCharts.CrosshairMode.MagnetOHLC },
  });
  const candleSeries = chart.addSeries(window.LightweightCharts.CandlestickSeries, {
    upColor: cssVar("--buy") || "#078465",
    downColor: cssVar("--sell") || "#c2413a",
    borderVisible: false,
    wickUpColor: cssVar("--buy") || "#078465",
    wickDownColor: cssVar("--sell") || "#c2413a",
    priceFormat: { type: "price", precision: 2, minMove: 0.01 },
  });
  const volumeSeries = chart.addSeries(window.LightweightCharts.HistogramSeries, {
    priceFormat: { type: "volume" },
    priceScaleId: "volume",
    lastValueVisible: false,
    priceLineVisible: false,
  });
  chart.priceScale("volume").applyOptions({
    scaleMargins: { top: 0.82, bottom: 0 },
  });

  priceChartState.chart = chart;
  priceChartState.candleSeries = candleSeries;
  priceChartState.volumeSeries = volumeSeries;
  priceChartState.markerPlugin = window.LightweightCharts.createSeriesMarkers(candleSeries, []);
  priceChartState.resizeObserver = new ResizeObserver(resizePriceChart);
  priceChartState.resizeObserver.observe(els.chart);
  applyPriceChartTheme();
}

function applyPriceChartTheme() {
  if (!priceChartState.chart) return;
  const buy = cssVar("--buy") || "#078465";
  const sell = cssVar("--sell") || "#c2413a";
  priceChartState.chart.applyOptions({
    layout: {
      background: { type: window.LightweightCharts.ColorType.Solid, color: cssVar("--panel") || "#ffffff" },
      textColor: cssVar("--muted") || "#64748b",
      attributionLogo: false,
    },
    grid: {
      vertLines: { color: cssVar("--line-soft") || "#edf1f6" },
      horzLines: { color: cssVar("--line-soft") || "#edf1f6" },
    },
    localization: { locale: state.language === "vi" ? "vi-VN" : "en-US" },
  });
  priceChartState.candleSeries.applyOptions({
    upColor: buy,
    downColor: sell,
    wickUpColor: buy,
    wickDownColor: sell,
  });
}

function resizePriceChart() {
  if (!priceChartState.chart) return;
  priceChartState.chart.resize(
    Math.max(1, els.chart.clientWidth),
    Math.max(1, els.chart.clientHeight)
  );
}

function toSeriesMarkers(markers, rows) {
  if (!markers.length || !rows.length) return [];
  const availableTimes = rows.map((row) => row.time);
  const availableSet = new Set(availableTimes);
  return markers
    .map((marker) => {
      const requestedTime = normalizeChartTime(marker.time);
      const time = availableSet.has(requestedTime)
        ? requestedTime
        : nearestChartTime(availableTimes, requestedTime);
      if (!time) return null;
      const isBuy = marker.action === "buy";
      return {
        time,
        position: isBuy ? "belowBar" : "aboveBar",
        color: isBuy ? cssVar("--buy") || "#078465" : cssVar("--sell") || "#c2413a",
        shape: isBuy ? "arrowUp" : "arrowDown",
        text: isBuy ? "B" : "S",
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.time.localeCompare(right.time));
}

function nearestChartTime(availableTimes, requestedTime) {
  const target = Date.parse(requestedTime);
  if (!Number.isFinite(target)) return "";
  let nearest = "";
  let distance = Number.POSITIVE_INFINITY;
  availableTimes.forEach((time) => {
    const candidate = Date.parse(time);
    const candidateDistance = Math.abs(candidate - target);
    if (Number.isFinite(candidateDistance) && candidateDistance < distance) {
      nearest = time;
      distance = candidateDistance;
    }
  });
  return nearest;
}

function normalizeChartTime(value) {
  if (!value) return "";
  const text = String(value);
  const datePrefix = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (datePrefix) return datePrefix[1];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function colorWithAlpha(color, alpha) {
  const hex = String(color || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return color;
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function clearChart(message) {
  ensurePriceChart();
  priceChartState.candleSeries.setData([]);
  priceChartState.volumeSeries.setData([]);
  priceChartState.markerPlugin.setMarkers([]);
  priceChartState.ticker = "";
  els.chartEmpty.textContent = message;
  els.chartEmpty.hidden = false;
}

function formatDate(value) {
  if (!value) return "-";
  const date = parseDateValue(value);
  if (!date) return value;
  return date.toLocaleString(state.language === "vi" ? "vi-VN" : "en-US");
}

function signalTimeValue(signal) {
  return signal?.source_time || signal?.received_at || "";
}

function signalTimeSortValue(signal) {
  const parsed = parseDateValue(signalTimeValue(signal));
  return parsed ? parsed.getTime() : 0;
}

function formatSignalTime(signal) {
  return formatDate(signalTimeValue(signal));
}

function formatDateOnly(value) {
  if (!value) return "-";
  const raw = String(value);
  const isoDate = raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (!isoDate) return formatDate(value);
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function formatHoldingDaysBetween(startValue, endValue = null) {
  const start = parseDateValue(startValue);
  const end = endValue ? parseDateValue(endValue) : new Date();
  if (!start || !end) return "-";
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.max(0, Math.floor((end.getTime() - start.getTime()) / dayMs));
  return `${days}d`;
}

function parseDateValue(value) {
  if (!value) return null;
  const raw = String(value);
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  const pineIso = raw.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/);
  if (pineIso) {
    return new Date(`${pineIso[1]}T${pineIso[2]}`);
  }
  const slashDateTime = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i
  );
  if (slashDateTime) {
    const month = Number(slashDateTime[1]);
    const day = Number(slashDateTime[2]);
    const year = Number(slashDateTime[3]);
    let hour = Number(slashDateTime[4]);
    const minute = Number(slashDateTime[5]);
    const second = Number(slashDateTime[6] || 0);
    const meridiem = slashDateTime[7].toUpperCase();
    if (meridiem === "PM" && hour < 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    return new Date(year, month - 1, day, hour, minute, second);
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatPrice(value) {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString(NUMBER_FORMAT_LOCALE, {
    maximumFractionDigits: 3,
  });
}

function formatIntegerThousands(value) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDcaInitialCapitalValue(value) {
  const number = optionalNumber(value);
  if (number === null) return "";
  return formatIntegerThousands(Math.max(0, Math.round(number)));
}

function formatDcaInitialCapitalInput() {
  const input = els.dcaInitialCapital;
  const selection = input.selectionStart ?? input.value.length;
  const digitCountBeforeCursor = input.value.slice(0, selection).replace(/[^\d]/g, "").length;
  input.value = formatIntegerThousands(input.value);
  let nextCursor = input.value.length;
  if (digitCountBeforeCursor > 0) {
    let seenDigits = 0;
    for (let index = 0; index < input.value.length; index += 1) {
      if (/\d/.test(input.value[index])) seenDigits += 1;
      if (seenDigits >= digitCountBeforeCursor) {
        nextCursor = index + 1;
        break;
      }
    }
  } else {
    nextCursor = 0;
  }
  input.setSelectionRange(nextCursor, nextCursor);
}

function normalizeDcaEntryPrice(value) {
  const price = optionalNumber(value);
  if (price === null || price <= 0) return null;
  return price < 1000 ? price * 1000 : price;
}

function rawNumber(value) {
  if (value === null || value === undefined) return "";
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : "";
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = parsePriceInput(value);
  return Number.isFinite(number) ? number : null;
}

function parsePriceInput(value) {
  const raw = String(value).trim();
  if (/^\d{1,3}(\.\d{3}){2,}$/.test(raw)) {
    return Number(raw.replaceAll(".", ""));
  }
  return Number(raw.replaceAll(",", ""));
}

function localDateToIsoDate(value) {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "-";
  const totalMinutes = Math.floor(Number(seconds) / 60);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || !parts.length) parts.push(`${minutes}m`);
  return parts.join(" ");
}

function formatPercent(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toFixed(1)}%`;
}

function formatKellyPercent(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "-";
  return `${Number(value).toFixed(2)}%`;
}

function formatSignedPercent(value) {
  if (value === null || value === undefined) return "-";
  const number = Number(value);
  const className = number >= 0 ? "positive" : "negative";
  const sign = number > 0 ? "+" : "";
  return `<span class="${className}">${sign}${number.toFixed(2)}%</span>`;
}

function formatHitRate(hits, total) {
  if (hits === null || hits === undefined || total === null || total === undefined) return "-";
  const hitCount = Number(hits);
  const totalCount = Number(total);
  if (!Number.isFinite(hitCount) || !Number.isFinite(totalCount) || totalCount <= 0) {
    return "-";
  }
  const rate = hitCount / totalCount * 100;
  return `${hitCount}/${totalCount} (${rate.toFixed(2)}%)`;
}

function formatSignedNumber(value) {
  if (value === null || value === undefined) return "-";
  const number = Number(value);
  const className = number >= 0 ? "positive" : "negative";
  const sign = number > 0 ? "+" : "";
  return `<span class="${className}">${sign}${number.toLocaleString(NUMBER_FORMAT_LOCALE, { maximumFractionDigits: 2 })}</span>`;
}

function formatSignedVnd(value) {
  if (value === null || value === undefined) return "-";
  const number = Number(value);
  const className = number >= 0 ? "positive" : "negative";
  const sign = number > 0 ? "+" : "";
  return `<span class="${className}">${sign}${number.toLocaleString(NUMBER_FORMAT_LOCALE, { maximumFractionDigits: 0 })} đ</span>`;
}

function formatVnd(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toLocaleString(NUMBER_FORMAT_LOCALE, { maximumFractionDigits: 0 })} đ`;
}

function compactVnd(value) {
  return Number(value).toLocaleString(NUMBER_FORMAT_LOCALE, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

function formatRatio(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "-";
  return Number(value).toFixed(3);
}

function formatDrawdownVnd(value) {
  if (value === null || value === undefined) return "-";
  const number = Number(value);
  if (number === 0) return "0 đ";
  return `<span class="negative">-${number.toLocaleString(NUMBER_FORMAT_LOCALE, { maximumFractionDigits: 0 })} đ</span>`;
}

function formatDrawdownPercent(value) {
  if (value === null || value === undefined) return "-";
  const number = Number(value);
  if (number === 0) return "0.00%";
  return `<span class="negative">-${number.toFixed(2)}%</span>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripHtml(value) {
  return String(value).replace(/<[^>]*>/g, "");
}

els.refresh.addEventListener("click", refresh);
els.loginForm.addEventListener("submit", submitLogin);
els.logoutButton.addEventListener("click", logout);
els.userCreateForm.addEventListener("submit", createAdminUser);
els.languageSelect.value = state.language;
els.languageSelect.addEventListener("change", async () => {
  state.language = els.languageSelect.value;
  localStorage.setItem("dashboardLanguage", state.language);
  applyTranslations();
  await refresh();
});
els.themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem("dashboardTheme", state.theme);
  applyTheme();
});
els.tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tabTarget));
});
els.watchlistInput.addEventListener("change", updateWatchlistFromInput);
els.watchlistInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") updateWatchlistFromInput();
});
els.watchlistOnly.addEventListener("change", toggleWatchlistOnly);
els.recentTradeBannerToggle.addEventListener("click", () => {
  state.recentTradeBannerHidden = !state.recentTradeBannerHidden;
  localStorage.setItem("dashboardRecentTradeBannerHidden", String(state.recentTradeBannerHidden));
  renderRecentTradeBanner();
});
els.addTickerToWatchlist.addEventListener("click", addSelectedTickerToWatchlist);
els.openPositionTickerFilter.addEventListener("input", renderOpenPositions);
els.openPositionStrategyFilter.addEventListener("change", renderOpenPositions);
els.openPositionConfirmFilter.addEventListener("change", renderOpenPositions);
els.openPositionSort.addEventListener("change", renderOpenPositions);
els.openPositionRefreshPrices.addEventListener("click", refreshOpenPositionMarketPrices);
els.positionInsightClose.addEventListener("click", closePositionInsight);
els.positionInsightCloseBottom.addEventListener("click", closePositionInsight);
els.positionInsightModal.addEventListener("click", (event) => {
  if (event.target === els.positionInsightModal) closePositionInsight();
});
els.positionInsightChart.addEventListener("click", () => {
  const ticker = els.positionInsightChart.dataset.positionInsightTicker;
  if (!ticker) return;
  closePositionInsight();
  setActiveTab("overview");
  renderChart(ticker);
});
els.performanceTickerFilter.addEventListener("input", refresh);
els.performanceStrategyFilter.addEventListener("change", refresh);
els.performanceSort.addEventListener("change", refresh);
els.backtestStrategyFilter.addEventListener("change", () => renderBacktestStats(filterBacktestStats(state.backtestStats)));
els.backtestTickerSearch.addEventListener("input", () => renderBacktestStats(filterBacktestStats(state.backtestStats)));
els.backtestStatsForm.addEventListener("submit", saveBacktestStats);
els.kellyForm.addEventListener("input", renderKellyCalculator);
els.kellyForm.addEventListener("change", renderKellyCalculator);
els.kellyForm.addEventListener("submit", (event) => event.preventDefault());
els.saveKellyEntry.addEventListener("click", saveCurrentKellyEntry);
els.kellyStrategyFilter.addEventListener("change", renderKellyEntries);
els.kellySearch.addEventListener("input", renderKellyEntries);
els.dcaSizingTicker.addEventListener("change", syncDcaSizingReferences);
els.dcaSizingTicker.addEventListener("input", () => {
  els.dcaSizingTicker.value = els.dcaSizingTicker.value.toUpperCase();
  renderDcaSizing();
});
els.dcaSizingStrategy.addEventListener("change", syncDcaSizingReferences);
[
  els.dcaAllocationPct,
  els.dcaEntryPrice,
  els.dcaDistanceMode,
  els.dcaPriceStepMode,
  els.dcaFixedPriceStep,
  els.dcaMaxLossPct,
  els.dcaRiskLimitPct,
  els.dcaLotSize,
  els.dcaPriceStep,
].forEach((input) => input.addEventListener("input", renderDcaSizing));
els.dcaInitialCapital.addEventListener("input", () => {
  formatDcaInitialCapitalInput();
  renderDcaSizing();
  scheduleDcaInitialCapitalSave();
});
els.dcaInitialCapital.addEventListener("change", () => {
  els.dcaInitialCapital.value = formatDcaInitialCapitalValue(els.dcaInitialCapital.value);
  renderDcaSizing();
  saveDcaInitialCapital();
});
els.dcaEntryPrice.addEventListener("change", () => {
  els.dcaEntryPrice.value = rawNumber(normalizeDcaEntryPrice(els.dcaEntryPrice.value));
  delete els.dcaEntryPrice.dataset.autoFilled;
  renderDcaSizing();
});
els.dcaDistanceMode.addEventListener("change", () => {
  renderDcaPriceStepControls();
  renderDcaSuggestionPreview();
  renderDcaSizing();
});
els.dcaPriceStepMode.addEventListener("change", () => {
  renderDcaPriceStepControls();
  renderDcaSizing();
});
els.dcaCount.addEventListener("change", () => {
  setDcaLevelCount(dcaCount());
  if (els.dcaPreset.value !== "custom") {
    applyDcaPreset(els.dcaPreset.value);
    return;
  }
  renderDcaSuggestionPreview();
  renderDcaSizing();
});
els.dcaPreset.addEventListener("change", () => {
  if (els.dcaPreset.value === "custom") {
    renderDcaSizing();
    return;
  }
  applyDcaPreset(els.dcaPreset.value);
});
els.dcaRiskLimitPct.addEventListener("change", saveDcaRiskLimitPreference);
els.applyDcaHalfSuggestion.addEventListener("click", () => applyDcaSuggestion(0.5));
els.applyDcaSuggestion.addEventListener("click", () => applyDcaSuggestion(1));
els.dcaSizingForm.addEventListener("submit", (event) => event.preventDefault());
els.saveDcaPlan.addEventListener("click", saveCurrentDcaPlan);
els.cancelDcaPlanEdit.addEventListener("click", cancelDcaPlanEdit);
els.dcaPlanClose.addEventListener("click", closeDcaPlanDetail);
els.dcaPlanCloseBottom.addEventListener("click", closeDcaPlanDetail);
els.dcaPlanModal.addEventListener("click", (event) => {
  if (event.target === els.dcaPlanModal) closeDcaPlanDetail();
});
els.clearClosedTradesFilter.addEventListener("click", clearClosedTradeFilter);
els.manualPositionForm.addEventListener("submit", addManualPosition);
els.manualRefreshPrices.addEventListener("click", refreshManualMarketPrices);
els.manualRecordDailyPerformance.addEventListener("click", recordManualDailyPerformance);
els.dividendEventForm.addEventListener("submit", addDividendEvent);
els.derivativeCapitalForm.addEventListener("submit", saveDerivativeCapital);
window.addEventListener("resize", () => {
  resizePriceChart();
  if (state.activeTab === "manualPortfolio") {
    drawManualEquityCurve(state.manualPortfolio.equity_curve || []);
  }
  if (state.activeTab === "derivatives") {
    drawDerivativeEquityCurve(state.derivatives.equity_curve || []);
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.positionInsightModal.hidden) {
    closePositionInsight();
  }
  if (event.key === "Escape" && !els.dcaPlanModal.hidden) {
    closeDcaPlanDetail();
  }
});

applyTheme();
initializeKellyCalculator();
initializeDcaSizingCalculator();
applyTranslations();
updateWatchlistControls();
bootstrapAuth();
setInterval(refresh, 15000);
