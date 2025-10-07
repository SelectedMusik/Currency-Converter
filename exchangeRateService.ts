import axios from 'axios';
import { ExchangeRateData, ChartDataPoint, ExchangeRateResponse, HistoricalRateResponse } from '../types';
import { API_CONFIG } from '../constants/currencies';

class ExchangeRateService {
  private apiClient;

  constructor() {
    this.apiClient = axios.create({
      timeout: API_CONFIG.TIMEOUT,
    });
  }

  // 获取最新汇率
  async getLatestRates(baseCurrency: string = 'USD'): Promise<ExchangeRateData> {
    try {
      // 尝试使用免费的汇率API
      const response = await this.apiClient.get(
        `${API_CONFIG.BASE_URL}/latest/${baseCurrency}`
      ) as { data: ExchangeRateResponse };

      if (response.data) {
        return {
          base: response.data.base,
          rates: response.data.rates,
          timestamp: response.data.timestamp * 1000, // 转换为毫秒
          source: 'Exchange Rate API',
        };
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.warn('Primary API failed, using fallback data:', error);
      return this.getFallbackRates(baseCurrency);
    }
  }

  // 获取历史汇率数据
  async getHistoricalRates(
    baseCurrency: string,
    targetCurrency: string,
    days: number
  ): Promise<ChartDataPoint[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const promises: Promise<ChartDataPoint>[] = [];
      
      // 生成日期范围内的数据点
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        promises.push(this.getHistoricalRateForDate(baseCurrency, targetCurrency, date));
      }

      const results = await Promise.allSettled(promises);
      
      return results
        .filter((result): result is PromiseFulfilledResult<ChartDataPoint> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value)
        .sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.warn('Historical data API failed, using mock data:', error);
      return this.generateMockHistoricalData(baseCurrency, targetCurrency, days);
    }
  }

  // 获取特定日期的汇率
  private async getHistoricalRateForDate(
    baseCurrency: string,
    targetCurrency: string,
    date: Date
  ): Promise<ChartDataPoint> {
    const dateString = date.toISOString().split('T')[0];
    
    try {
      const response = await this.apiClient.get(
        `${API_CONFIG.BASE_URL}/${dateString}/${baseCurrency}`
      ) as { data: HistoricalRateResponse };

      const rate = response.data.rates[targetCurrency];
      
      return {
        date: dateString,
        rate: rate || 1,
        timestamp: date.getTime(),
      };
    } catch (error) {
      // 如果API失败，生成模拟数据
      return this.generateMockDataPoint(baseCurrency, targetCurrency, date);
    }
  }

  // 备用汇率数据（当API不可用时使用）
  private getFallbackRates(baseCurrency: string): ExchangeRateData {
    // 模拟汇率数据，实际应用中可以从本地缓存或其他数据源获取
    const mockRates: Record<string, Record<string, number>> = {
      USD: {
        CNY: 7.2456,
        EUR: 0.8829,
        GBP: 0.7892,
        JPY: 149.32,
        AUD: 1.5234,
        HKD: 7.8123,
        TWD: 31.456,
        KRW: 1342.56,
        SGD: 1.3456,
        CAD: 1.3678,
        CHF: 0.8934,
        SEK: 10.234,
        NOK: 10.567,
        DKK: 6.789,
        NZD: 1.6234,
        THB: 35.678,
        MYR: 4.6789,
        INR: 83.234,
        RUB: 92.345,
      },
      CNY: {
        USD: 0.1381,
        EUR: 0.1219,
        GBP: 0.1090,
        JPY: 20.612,
        AUD: 0.2103,
        HKD: 1.0789,
        TWD: 4.3456,
        KRW: 185.34,
        SGD: 0.1858,
        CAD: 0.1888,
        CHF: 0.1234,
        SEK: 1.4123,
        NOK: 1.4589,
        DKK: 0.9367,
        NZD: 0.2241,
        THB: 4.9234,
        MYR: 0.6456,
        INR: 11.489,
        RUB: 12.745,
      },
    };

    const rates = mockRates[baseCurrency] || mockRates.USD;
    
    return {
      base: baseCurrency,
      rates,
      timestamp: Date.now(),
      source: 'Fallback Data',
    };
  }

  // 生成模拟历史数据
  private generateMockHistoricalData(
    baseCurrency: string,
    targetCurrency: string,
    days: number
  ): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];
    const baseRate = this.getMockBaseRate(baseCurrency, targetCurrency);
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // 生成带有随机波动的汇率
      const volatility = 0.02; // 2% 波动率
      const randomFactor = 1 + (Math.random() - 0.5) * volatility;
      const rate = baseRate * randomFactor;
      
      data.push({
        date: date.toISOString().split('T')[0],
        rate: Number(rate.toFixed(6)),
        timestamp: date.getTime(),
      });
    }
    
    return data;
  }

  // 生成单个模拟数据点
  private generateMockDataPoint(
    baseCurrency: string,
    targetCurrency: string,
    date: Date
  ): ChartDataPoint {
    const baseRate = this.getMockBaseRate(baseCurrency, targetCurrency);
    const volatility = 0.01;
    const randomFactor = 1 + (Math.random() - 0.5) * volatility;
    const rate = baseRate * randomFactor;
    
    return {
      date: date.toISOString().split('T')[0],
      rate: Number(rate.toFixed(6)),
      timestamp: date.getTime(),
    };
  }

  // 获取模拟基准汇率
  private getMockBaseRate(baseCurrency: string, targetCurrency: string): number {
    const rates: Record<string, Record<string, number>> = {
      USD: { CNY: 7.2456, EUR: 0.8829, GBP: 0.7892, JPY: 149.32 },
      CNY: { USD: 0.1381, EUR: 0.1219, GBP: 0.1090, JPY: 20.612 },
      EUR: { USD: 1.1326, CNY: 8.2034, GBP: 0.8943, JPY: 169.23 },
      GBP: { USD: 1.2671, CNY: 9.1823, EUR: 1.1182, JPY: 189.34 },
      JPY: { USD: 0.0067, CNY: 0.0485, EUR: 0.0059, GBP: 0.0053 },
    };
    
    return rates[baseCurrency]?.[targetCurrency] || 1;
  }

  // 获取支持的货币列表
  async getSupportedCurrencies(): Promise<Record<string, string>> {
    try {
      const response = await this.apiClient.get(`${API_CONFIG.BASE_URL}/currencies`);
      return response.data.currencies || {};
    } catch (error) {
      console.warn('Failed to fetch currencies, using fallback:', error);
      return {
        CNY: 'Chinese Yuan',
        USD: 'US Dollar',
        EUR: 'Euro',
        GBP: 'British Pound',
        JPY: 'Japanese Yen',
        AUD: 'Australian Dollar',
        HKD: 'Hong Kong Dollar',
        TWD: 'Taiwan Dollar',
        KRW: 'South Korean Won',
        SGD: 'Singapore Dollar',
        CAD: 'Canadian Dollar',
        CHF: 'Swiss Franc',
        SEK: 'Swedish Krona',
        NOK: 'Norwegian Krone',
        DKK: 'Danish Krone',
        NZD: 'New Zealand Dollar',
        THB: 'Thai Baht',
        MYR: 'Malaysian Ringgit',
        INR: 'Indian Rupee',
        RUB: 'Russian Ruble',
      };
    }
  }
}

export const exchangeRateService = new ExchangeRateService();