import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, LineChart, TrendingUp, Download, Settings } from 'lucide-react';
import { ExchangeRateChart } from '../components/ExchangeRateChart';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import { CurrencyPairSelector } from '../components/CurrencyPairSelector';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { exchangeRateService } from '../services/exchangeRateService';
import { toast } from 'sonner';
import { ChartDataPoint } from '../types';

export const ChartsPage: React.FC = () => {
  const {
    currencies,
    chartData,
    isLoading,
    setChartData,
    setLoading,
    fetchHistoricalData,
  } = useCurrencyStore();

  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('CNY');
  const [timeRange, setTimeRange] = useState<'1D' | '7D' | '30D' | '90D' | '1Y'>('7D');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  // 获取当前货币对的图表数据
  const currentChartData: ChartDataPoint[] = chartData[`${baseCurrency}/${targetCurrency}`] || [];

  // 获取历史数据
  useEffect(() => {
    const loadHistoricalData = async () => {
      setLoading(true);
      try {
        const data = await fetchHistoricalData(baseCurrency, targetCurrency, timeRange);
        // fetchHistoricalData 已经在内部调用了 setChartData，所以这里不需要再调用
      } catch (error) {
        toast.error('获取历史数据失败');
        console.error('Failed to load historical data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalData();
  }, [baseCurrency, targetCurrency, timeRange, fetchHistoricalData, setLoading]);

  // 处理货币交换
  const handleSwapCurrencies = () => {
    const temp = baseCurrency;
    setBaseCurrency(targetCurrency);
    setTargetCurrency(temp);
  };

  // 导出图表数据
  const handleExportData = () => {
    if (currentChartData.length === 0) {
      toast.error('暂无数据可导出');
      return;
    }

    const csvContent = [
      ['日期', '汇率'].join(','),
      ...currentChartData.map(point => [
        new Date(point.timestamp).toISOString().split('T')[0],
        point.rate.toString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${baseCurrency}_${targetCurrency}_${timeRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('数据导出成功');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 页面头部 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                汇率图表
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                实时汇率走势和历史数据分析
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* 图表类型切换 */}
              <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setChartType('area')}
                  className={`
                    p-2 rounded-md transition-colors
                    ${chartType === 'area'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <BarChart3 className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setChartType('line')}
                  className={`
                    p-2 rounded-md transition-colors
                    ${chartType === 'line'
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <LineChart className="w-4 h-4" />
                </motion.button>
              </div>

              {/* 导出按钮 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportData}
                disabled={currentChartData.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>导出数据</span>
              </motion.button>

              {/* 设置按钮 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧控制面板 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 货币对选择器 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CurrencyPairSelector
                baseCurrency={baseCurrency}
                targetCurrency={targetCurrency}
                currencies={currencies}
                onBaseCurrencyChange={setBaseCurrency}
                onTargetCurrencyChange={setTargetCurrency}
                onSwapCurrencies={handleSwapCurrencies}
              />
            </motion.div>

            {/* 时间范围选择器 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                时间范围
              </h3>
              <TimeRangeSelector
                selectedRange={timeRange}
                onRangeChange={setTimeRange}
                disabled={isLoading}
              />
            </motion.div>

            {/* 统计信息 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                统计信息
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">数据点</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {currentChartData.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">最高值</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {currentChartData.length > 0 
                      ? Math.max(...currentChartData.map(d => d.rate)).toFixed(4)
                      : '--'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">最低值</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {currentChartData.length > 0 
                      ? Math.min(...currentChartData.map(d => d.rate)).toFixed(4)
                      : '--'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">平均值</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {currentChartData.length > 0 
                      ? (currentChartData.reduce((sum, d) => sum + d.rate, 0) / currentChartData.length).toFixed(4)
                      : '--'
                    }
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 右侧图表区域 */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ExchangeRateChart
                data={currentChartData}
                baseCurrency={baseCurrency}
                targetCurrency={targetCurrency}
                timeRange={timeRange}
                chartType={chartType}
                showTrend={true}
              />
            </motion.div>

            {/* 图表说明 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    图表说明
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>• 图表显示 {baseCurrency} 对 {targetCurrency} 的汇率走势</p>
                    <p>• 数据来源于实时汇率API，每小时更新一次</p>
                    <p>• 鼠标悬停可查看具体时间点的汇率数据</p>
                    <p>• 支持导出CSV格式的历史数据</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};