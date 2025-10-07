import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CurrencyStore, Currency, ExchangeRateData, ConversionRecord, UserSettings, ChartDataPoint } from '../types';
import { DEFAULT_CURRENCIES, DEFAULT_SETTINGS, STORAGE_KEYS } from '../constants/currencies';
import { exchangeRateService } from '../services/exchangeRateService';

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      currencies: DEFAULT_CURRENCIES,
      activeCurrency: null,
      exchangeRates: null,
      amounts: {},
      conversionHistory: [],
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      error: null,
      chartData: {},

      // 货币操作
      setCurrencies: (currencies: Currency[]) => {
        set({ currencies });
      },

      setActiveCurrency: (code: string | null) => {
        set({ activeCurrency: code });
      },

      addCurrency: (currency: Currency) => {
        const { currencies } = get();
        const exists = currencies.find(c => c.code === currency.code);
        if (!exists) {
          set({ currencies: [...currencies, currency] });
        }
      },

      removeCurrency: (code: string) => {
        const { currencies, settings } = get();
        const updatedCurrencies = currencies.filter(c => c.code !== code);
        const updatedPreferred = settings.preferredCurrencies.filter(c => c !== code);
        
        set({ 
          currencies: updatedCurrencies,
          settings: { ...settings, preferredCurrencies: updatedPreferred }
        });
      },

      updateCurrencyOrder: (currencies: Currency[]) => {
        set({ currencies });
      },

      // 汇率操作
      setExchangeRates: (rates: ExchangeRateData) => {
        set({ exchangeRates: rates });
      },

      refreshExchangeRates: async () => {
        const { settings } = get();
        set({ isLoading: true, error: null });
        
        try {
          const rates = await exchangeRateService.getLatestRates(settings.defaultBaseCurrency);
          set({ exchangeRates: rates, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '获取汇率失败',
            isLoading: false 
          });
        }
      },

      // 转换操作
      setAmount: (currency: string, amount: number) => {
        const { amounts, exchangeRates, settings } = get();
        const newAmounts = { ...amounts, [currency]: amount };
        
        // 如果有汇率数据，自动计算其他货币的金额
        if (exchangeRates && amount > 0) {
          const baseCurrency = exchangeRates.base;
          const baseRate = currency === baseCurrency ? 1 : exchangeRates.rates[currency];
          
          if (baseRate) {
            // 计算基准货币金额
            const baseAmount = currency === baseCurrency ? amount : amount / baseRate;
            
            // 计算其他货币金额
            Object.keys(exchangeRates.rates).forEach(code => {
              if (code !== currency) {
                const rate = exchangeRates.rates[code];
                newAmounts[code] = Number((baseAmount * rate).toFixed(settings.decimalPlaces));
              }
            });
            
            // 设置基准货币金额
            if (currency !== baseCurrency) {
              newAmounts[baseCurrency] = Number(baseAmount.toFixed(settings.decimalPlaces));
            }
          }
        }
        
        set({ amounts: newAmounts });
      },

      convertCurrency: (fromCurrency: string, toCurrency: string, amount: number) => {
        const { exchangeRates, settings } = get();
        
        if (!exchangeRates) return;
        
        const fromRate = fromCurrency === exchangeRates.base ? 1 : exchangeRates.rates[fromCurrency];
        const toRate = toCurrency === exchangeRates.base ? 1 : exchangeRates.rates[toCurrency];
        
        if (fromRate && toRate) {
          const baseAmount = fromCurrency === exchangeRates.base ? amount : amount / fromRate;
          const convertedAmount = toCurrency === exchangeRates.base ? baseAmount : baseAmount * toRate;
          const exchangeRate = toRate / fromRate;
          
          // 添加转换记录
          const record: ConversionRecord = {
            id: Date.now().toString(),
            fromCurrency,
            toCurrency,
            fromAmount: amount,
            toAmount: Number(convertedAmount.toFixed(settings.decimalPlaces)),
            exchangeRate,
            timestamp: Date.now(),
            source: exchangeRates.source,
          };
          
          get().addConversionRecord(record);
        }
      },

      addConversionRecord: (record: ConversionRecord) => {
        const { conversionHistory } = get();
        const newHistory = [record, ...conversionHistory].slice(0, 100); // 保留最近100条记录
        set({ conversionHistory: newHistory });
      },

      clearConversionHistory: () => {
        set({ conversionHistory: [] });
      },

      clearHistory: () => {
        set({ conversionHistory: [] });
      },

      // 设置操作
      updateSettings: (newSettings: Partial<UserSettings>) => {
        const { settings } = get();
        const updatedSettings = { ...settings, ...newSettings };
        set({ settings: updatedSettings });
        
        // 如果基准货币改变，重新获取汇率
        if (newSettings.defaultBaseCurrency && newSettings.defaultBaseCurrency !== settings.defaultBaseCurrency) {
          get().refreshExchangeRates();
        }
      },

      // UI 操作
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      // 图表操作
      setChartData: (currencyPair: string, data: ChartDataPoint[]) => {
        const { chartData } = get();
        set({ chartData: { ...chartData, [currencyPair]: data } });
      },

      fetchHistoricalData: async (baseCurrency: string, targetCurrency: string, timeRange: '1D' | '7D' | '30D' | '90D' | '1Y') => {
        const currencyPair = `${baseCurrency}/${targetCurrency}`;
        set({ isLoading: true, error: null });
        
        try {
          // 将时间范围转换为天数
          const daysMap = {
            '1D': 1,
            '7D': 7,
            '30D': 30,
            '90D': 90,
            '1Y': 365
          };
          const days = daysMap[timeRange];
          
          const data = await exchangeRateService.getHistoricalRates(baseCurrency, targetCurrency, days);
          get().setChartData(currencyPair, data);
          set({ isLoading: false });
          return data;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '获取历史数据失败',
            isLoading: false 
          });
          throw error;
        }
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      partialize: (state) => ({
        currencies: state.currencies,
        conversionHistory: state.conversionHistory,
        settings: state.settings,
        chartData: state.chartData,
      }),
    }
  )
);