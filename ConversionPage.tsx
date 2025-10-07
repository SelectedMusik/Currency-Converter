import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, Clock, Settings } from 'lucide-react';
import { CurrencyGrid } from '../components/CurrencyGrid';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { exchangeRateService } from '../services/exchangeRateService';
import { toast } from 'sonner';

export const ConversionPage: React.FC = () => {
  const {
    currencies,
    exchangeRates,
    amounts,
    isLoading,
    error,
    setExchangeRates,
    setAmount,
    convertCurrency,
    addConversionRecord,
    setLoading,
    setError,
    updateCurrencyOrder,
  } = useCurrencyStore();

  const [activeCurrency, setActiveCurrency] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const rates = await exchangeRateService.getLatestRates();
        setExchangeRates(rates);
        setError(null);
      } catch (err) {
        setError('获取汇率数据失败');
        toast.error('获取汇率数据失败，使用模拟数据');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [setExchangeRates, setLoading, setError]);

  // 处理货币激活
  const handleCurrencyActivate = (code: string) => {
    setActiveCurrency(activeCurrency === code ? null : code);
  };

  // 处理金额变化
  const handleAmountChange = (currency: string, amount: number) => {
    setAmount(currency, amount);
    
    if (amount > 0) {
      // 转换到其他货币
      const baseCurrency = currencies.find(c => c.code === currency);
      if (baseCurrency) {
        currencies.forEach(targetCurrency => {
          if (targetCurrency.code !== currency) {
            convertCurrency(currency, targetCurrency.code, amount);
          }
        });

        // 添加到历史记录
        addConversionRecord({
          id: Date.now().toString(),
          fromCurrency: currency,
          toCurrency: 'ALL',
          fromAmount: amount,
          toAmount: 0,
          exchangeRate: exchangeRates?.rates[currency] || 1,
          timestamp: Date.now(),
          source: exchangeRates?.source || 'Unknown',
        });
      }
    }
  };

  // 刷新汇率
  const handleRefreshRates = async () => {
    setRefreshing(true);
    try {
      const rates = await exchangeRateService.getLatestRates();
      setExchangeRates(rates);
      toast.success('汇率数据已更新');
      setError(null);
    } catch (err) {
      toast.error('刷新汇率失败');
      setError('刷新汇率失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 处理货币重新排序
  const handleCurrencyReorder = (reorderedCurrencies: any[]) => {
    updateCurrencyOrder(reorderedCurrencies.map(c => c.code));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 头部状态栏 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* 状态信息 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>
                  {exchangeRates 
                    ? `更新于 ${new Date(exchangeRates.timestamp).toLocaleTimeString()}`
                    : '暂未更新'
                  }
                </span>
              </div>
              
              {error && (
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-red-600 dark:text-red-400">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="truncate">{error}</span>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefreshRates}
                disabled={refreshing || isLoading}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{refreshing ? '刷新中...' : '刷新汇率'}</span>
                <span className="sm:hidden">刷新</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            货币转换器
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            实时汇率，精准转换
          </p>
        </motion.div>

        {/* 加载状态 */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
              <span className="text-lg text-gray-600 dark:text-gray-400">
                正在加载汇率数据...
              </span>
            </div>
          </motion.div>
        )}

        {/* 货币网格 */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CurrencyGrid
              currencies={currencies}
              activeCurrency={activeCurrency}
              amounts={amounts}
              onCurrencyActivate={handleCurrencyActivate}
              onAmountChange={handleAmountChange}
              onCurrencyReorder={handleCurrencyReorder}
            />
          </motion.div>
        )}

        {/* 汇率趋势提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">
              查看详细图表和历史数据
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};