import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Filter, Download, Trash2, Search, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { CURRENCY_SYMBOLS, CURRENCY_NAMES } from '../constants/currencies';
import { toast } from 'sonner';

type SortField = 'timestamp' | 'fromAmount' | 'toAmount' | 'rate';
type SortOrder = 'asc' | 'desc';

export const HistoryPage: React.FC = () => {
  const { conversionHistory, clearHistory } = useCurrencyStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 过滤和排序历史记录
  const filteredAndSortedHistory = useMemo(() => {
    let filtered = [...conversionHistory];

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.fromCurrency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.toCurrency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        CURRENCY_NAMES[record.fromCurrency]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        CURRENCY_NAMES[record.toCurrency]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 货币过滤
    if (selectedCurrency !== 'all') {
      filtered = filtered.filter(record =>
        record.fromCurrency === selectedCurrency || record.toCurrency === selectedCurrency
      );
    }

    // 日期范围过滤
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (dateRange) {
      case 'today':
        filtered = filtered.filter(record => new Date(record.timestamp) >= today);
        break;
      case 'week':
        filtered = filtered.filter(record => new Date(record.timestamp) >= weekAgo);
        break;
      case 'month':
        filtered = filtered.filter(record => new Date(record.timestamp) >= monthAgo);
        break;
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'fromAmount':
          aValue = a.fromAmount;
          bValue = b.fromAmount;
          break;
        case 'toAmount':
          aValue = a.toAmount;
          bValue = b.toAmount;
          break;
        case 'rate':
          aValue = a.exchangeRate;
          bValue = b.exchangeRate;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [conversionHistory, searchTerm, selectedCurrency, dateRange, sortField, sortOrder]);

  // 获取唯一货币列表
  const uniqueCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    conversionHistory.forEach(record => {
      currencies.add(record.fromCurrency);
      if (record.toCurrency !== 'ALL') {
        currencies.add(record.toCurrency);
      }
    });
    return Array.from(currencies).sort();
  }, [conversionHistory]);

  // 处理排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 导出历史记录
  const handleExportHistory = () => {
    if (filteredAndSortedHistory.length === 0) {
      toast.error('暂无数据可导出');
      return;
    }

    const csvContent = [
      ['时间', '源货币', '目标货币', '源金额', '目标金额', '汇率'].join(','),
      ...filteredAndSortedHistory.map(record => [
        format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        record.fromCurrency,
        record.toCurrency,
        record.fromAmount.toString(),
        record.toAmount.toString(),
        record.exchangeRate.toString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `conversion_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('历史记录导出成功');
  };

  // 清空历史记录
  const handleClearHistory = () => {
    if (window.confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
      clearHistory();
      toast.success('历史记录已清空');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 页面头部 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                转换历史
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                查看和管理您的货币转换记录
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportHistory}
                disabled={filteredAndSortedHistory.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>导出</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearHistory}
                disabled={conversionHistory.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>清空</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 过滤器 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              筛选条件
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索货币..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* 货币选择 */}
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">所有货币</option>
              {uniqueCurrencies.map(currency => (
                <option key={currency} value={currency}>
                  {currency} - {CURRENCY_NAMES[currency] || currency}
                </option>
              ))}
            </select>

            {/* 日期范围 */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">所有时间</option>
              <option value="today">今天</option>
              <option value="week">最近7天</option>
              <option value="month">最近30天</option>
            </select>

            {/* 排序 */}
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortField(field as SortField);
                setSortOrder(order as SortOrder);
              }}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="timestamp-desc">时间 (新到旧)</option>
              <option value="timestamp-asc">时间 (旧到新)</option>
              <option value="fromAmount-desc">金额 (高到低)</option>
              <option value="fromAmount-asc">金额 (低到高)</option>
              <option value="rate-desc">汇率 (高到低)</option>
              <option value="rate-asc">汇率 (低到高)</option>
            </select>
          </div>
        </motion.div>

        {/* 历史记录列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                转换记录 ({filteredAndSortedHistory.length})
              </h2>
              {filteredAndSortedHistory.length !== conversionHistory.length && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  共 {conversionHistory.length} 条记录
                </span>
              )}
            </div>
          </div>

          {filteredAndSortedHistory.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                暂无转换记录
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {conversionHistory.length === 0 
                  ? '开始使用货币转换器来创建您的第一条记录'
                  : '没有符合筛选条件的记录'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('timestamp')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>时间</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      转换
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('fromAmount')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>金额</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('rate')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>汇率</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <AnimatePresence>
                    {filteredAndSortedHistory.map((record, index) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {format(new Date(record.timestamp), 'MM/dd HH:mm', { locale: zhCN })}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(record.timestamp), 'yyyy年', { locale: zhCN })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-lg">
                                {CURRENCY_SYMBOLS[record.fromCurrency] || record.fromCurrency}
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {record.fromCurrency}
                              </span>
                            </div>
                            <span className="text-gray-400">→</span>
                            <div className="flex items-center space-x-1">
                              <span className="text-lg">
                                {record.toCurrency === 'ALL' 
                                  ? '🌐' 
                                  : CURRENCY_SYMBOLS[record.toCurrency] || record.toCurrency
                                }
                              </span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {record.toCurrency === 'ALL' ? '全部' : record.toCurrency}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {record.fromAmount.toLocaleString()}
                          </div>
                          {record.toCurrency !== 'ALL' && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              = {record.toAmount.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {record.exchangeRate.toFixed(4)}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};