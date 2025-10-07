import { UserSettings, ConversionRecord, Currency, ExchangeRateData, ChartDataPoint } from '../types';
import { STORAGE_KEYS } from '../constants/currencies';

// 本地存储工具类
class StorageService {
  // 通用存储方法
  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
    }
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  private removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error);
    }
  }

  // 用户设置
  saveSettings(settings: UserSettings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  loadSettings(): UserSettings | null {
    const settings = this.getItem<UserSettings | null>(STORAGE_KEYS.SETTINGS, null);
    return settings;
  }

  // 转换历史
  saveHistory(history: ConversionRecord[]): void {
    this.setItem(STORAGE_KEYS.HISTORY, history);
  }

  loadHistory(): ConversionRecord[] {
    return this.getItem<ConversionRecord[]>(STORAGE_KEYS.HISTORY, []);
  }

  clearHistory(): void {
    this.removeItem(STORAGE_KEYS.HISTORY);
  }

  // 货币列表
  saveCurrencies(currencies: Currency[]): void {
    this.setItem(STORAGE_KEYS.CURRENCIES, currencies);
  }

  loadCurrencies(): Currency[] | null {
    return this.getItem<Currency[] | null>(STORAGE_KEYS.CURRENCIES, null);
  }

  // 汇率数据缓存
  saveExchangeRates(rates: ExchangeRateData): void {
    this.setItem(STORAGE_KEYS.EXCHANGE_RATES, {
      ...rates,
      cachedAt: Date.now(),
    });
  }

  loadExchangeRates(): ExchangeRateData | null {
    const cached = this.getItem<any>(STORAGE_KEYS.EXCHANGE_RATES, null);
    
    if (!cached) return null;
    
    // 检查缓存是否过期（30分钟）
    const cacheExpiry = 30 * 60 * 1000; // 30分钟
    if (Date.now() - cached.cachedAt > cacheExpiry) {
      this.removeItem(STORAGE_KEYS.EXCHANGE_RATES);
      return null;
    }
    
    return {
      base: cached.base,
      rates: cached.rates,
      timestamp: cached.timestamp,
      source: cached.source,
    };
  }

  // 图表数据缓存
  saveChartData(currencyPair: string, data: ChartDataPoint[]): void {
    const allChartData = this.getItem<Record<string, any>>(STORAGE_KEYS.CHART_DATA, {});
    allChartData[currencyPair] = {
      data,
      cachedAt: Date.now(),
    };
    this.setItem(STORAGE_KEYS.CHART_DATA, allChartData);
  }

  loadChartData(currencyPair: string): ChartDataPoint[] | null {
    const allChartData = this.getItem<Record<string, any>>(STORAGE_KEYS.CHART_DATA, {});
    const cached = allChartData[currencyPair];
    
    if (!cached) return null;
    
    // 检查缓存是否过期（1小时）
    const cacheExpiry = 60 * 60 * 1000; // 1小时
    if (Date.now() - cached.cachedAt > cacheExpiry) {
      delete allChartData[currencyPair];
      this.setItem(STORAGE_KEYS.CHART_DATA, allChartData);
      return null;
    }
    
    return cached.data;
  }

  // 清除所有缓存
  clearAllCache(): void {
    this.removeItem(STORAGE_KEYS.EXCHANGE_RATES);
    this.removeItem(STORAGE_KEYS.CHART_DATA);
  }

  // 清除所有数据
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeItem(key);
    });
  }

  // 获取存储使用情况
  getStorageUsage(): { used: number; total: number; percentage: number } {
    let used = 0;
    
    try {
      // 计算已使用的存储空间
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }
      
      // 估算总可用空间（通常为5-10MB）
      const total = 5 * 1024 * 1024; // 5MB
      const percentage = (used / total) * 100;
      
      return { used, total, percentage };
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  // 导出数据
  exportData(): any {
    const data = {
      settings: this.loadSettings(),
      history: this.loadHistory(),
      currencies: this.loadCurrencies(),
      exportedAt: new Date().toISOString(),
    };
    
    return data;
  }

  // 导入数据
  importData(data: any): boolean {
    try {
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      
      if (data.history) {
        this.saveHistory(data.history);
      }
      
      if (data.currencies) {
        this.saveCurrencies(data.currencies);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();