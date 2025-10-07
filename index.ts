// 用户设置
export interface UserSettings {
  preferredCurrencies: string[];
  defaultBaseCurrency: string;
  defaultCurrency: string;
  decimalPlaces: number;
  theme: 'light' | 'dark' | 'system';
  autoRefresh: boolean;
  refreshInterval: number; // 分钟
  dataSource: 'openexchange' | 'central_bank' | 'bis';
  notifications: boolean;
  language: 'zh' | 'en';
}

// 转换历史记录
export interface ConversionRecord {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  timestamp: number;
  source: string;
}

// 货币信息
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flagUrl?: string;
  isActive: boolean;
  isFavorite?: boolean;
}

// 汇率数据
export interface ExchangeRateData {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
  source: string;
}

// 图表数据点
export interface ChartDataPoint {
  date: string;
  rate: number;
  timestamp: number;
}

// API 响应类型
export interface ExchangeRateResponse {
  success: boolean;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
  source: string;
}

// 历史汇率响应
export interface HistoricalRateResponse {
  success: boolean;
  historical: boolean;
  date: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

// 货币列表响应
export interface CurrenciesResponse {
  success: boolean;
  currencies: Record<string, string>;
}

// 应用状态类型
export interface AppState {
  // 货币相关
  currencies: Currency[];
  activeCurrency: string | null;
  exchangeRates: ExchangeRateData | null;
  
  // 转换相关
  amounts: Record<string, number>;
  conversionHistory: ConversionRecord[];
  
  // 用户设置
  settings: UserSettings;
  
  // UI 状态
  isLoading: boolean;
  error: string | null;
  
  // 图表数据
  chartData: Record<string, ChartDataPoint[]>;
}

// 动作类型
export interface AppActions {
  // 货币操作
  setCurrencies: (currencies: Currency[]) => void;
  setActiveCurrency: (code: string | null) => void;
  addCurrency: (currency: Currency) => void;
  removeCurrency: (code: string) => void;
  updateCurrencyOrder: (currencies: Currency[]) => void;
  
  // 汇率操作
  setExchangeRates: (rates: ExchangeRateData) => void;
  refreshExchangeRates: () => Promise<void>;
  
  // 转换操作
  setAmount: (currency: string, amount: number) => void;
  convertCurrency: (fromCurrency: string, toCurrency: string, amount: number) => void;
  addConversionRecord: (record: ConversionRecord) => void;
  clearConversionHistory: () => void;
  clearHistory: () => void;
  
  // 设置操作
  updateSettings: (settings: Partial<UserSettings>) => void;
  
  // UI 操作
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 图表操作
  setChartData: (currencyPair: string, data: ChartDataPoint[]) => void;
  fetchHistoricalData: (baseCurrency: string, targetCurrency: string, timeRange: '1D' | '7D' | '30D' | '90D' | '1Y') => Promise<ChartDataPoint[]>;
}

// 完整的 Store 类型
export type CurrencyStore = AppState & AppActions;