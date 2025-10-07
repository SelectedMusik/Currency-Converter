import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Moon, 
  Sun, 
  Globe, 
  Bell, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw,
  Shield,
  Database,
  Palette,
  Clock
} from 'lucide-react';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { storageService } from '../utils/storage';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, clearHistory } = useCurrencyStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // 主题切换
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
    
    // 应用主题
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // 系统主题
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    
    toast.success('主题设置已更新');
  };

  // 语言切换
  const handleLanguageChange = (language: 'zh' | 'en') => {
    updateSettings({ language });
    toast.success('语言设置已更新');
  };

  // 通知设置
  const handleNotificationChange = (notifications: boolean) => {
    updateSettings({ notifications });
    toast.success(notifications ? '通知已开启' : '通知已关闭');
  };

  // 自动刷新设置
  const handleAutoRefreshChange = (autoRefresh: boolean) => {
    updateSettings({ autoRefresh });
    toast.success(autoRefresh ? '自动刷新已开启' : '自动刷新已关闭');
  };

  // 刷新间隔设置
  const handleRefreshIntervalChange = (refreshInterval: number) => {
    updateSettings({ refreshInterval });
    toast.success(`刷新间隔已设置为 ${refreshInterval} 分钟`);
  };

  // 默认货币设置
  const handleDefaultCurrencyChange = (defaultCurrency: string) => {
    updateSettings({ defaultCurrency });
    toast.success(`默认货币已设置为 ${defaultCurrency}`);
  };

  // 导出数据
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = storageService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `currency-converter-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('数据导出成功');
    } catch (error) {
      toast.error('数据导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  // 导入数据
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        storageService.importData(data);
        toast.success('数据导入成功，请刷新页面');
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        toast.error('数据导入失败，请检查文件格式');
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  // 清除所有数据
  const handleClearAllData = () => {
    if (window.confirm('确定要清除所有数据吗？此操作不可撤销，包括设置、历史记录和缓存数据。')) {
      storageService.clearAllData();
      clearHistory();
      toast.success('所有数据已清除');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  // 获取存储使用情况
  const getStorageUsage = () => {
    try {
      return storageService.getStorageUsage();
    } catch {
      return { used: 0, total: 0, percentage: 0 };
    }
  };

  const storageUsage = getStorageUsage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 页面头部 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              设置
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              个性化您的货币转换器体验
            </p>
          </div>
        </div>
      </motion.div>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 外观设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Palette className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              外观设置
            </h2>
          </div>

          <div className="space-y-4">
            {/* 主题设置 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                主题模式
              </label>
              <div className="flex space-x-3">
                {[
                  { value: 'light', label: '浅色', icon: Sun },
                  { value: 'dark', label: '深色', icon: Moon },
                  { value: 'system', label: '跟随系统', icon: Globe },
                ].map(({ value, label, icon: Icon }) => (
                  <motion.button
                    key={value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleThemeChange(value as any)}
                    className={`
                      flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all
                      ${settings.theme === value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* 语言设置 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                语言
              </label>
              <div className="flex space-x-3">
                {[
                  { value: 'zh', label: '中文' },
                  { value: 'en', label: 'English' },
                ].map(({ value, label }) => (
                  <motion.button
                    key={value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLanguageChange(value as any)}
                    className={`
                      px-4 py-2 rounded-lg border-2 transition-all
                      ${settings.language === value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 功能设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Clock className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              功能设置
            </h2>
          </div>

          <div className="space-y-6">
            {/* 通知设置 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    推送通知
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    接收汇率变动和更新通知
                  </div>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNotificationChange(!settings.notifications)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.notifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.notifications ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </motion.button>
            </div>

            {/* 自动刷新设置 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    自动刷新汇率
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    定期自动更新汇率数据
                  </div>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAutoRefreshChange(!settings.autoRefresh)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${settings.autoRefresh ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.autoRefresh ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </motion.button>
            </div>

            {/* 刷新间隔设置 */}
            {settings.autoRefresh && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  刷新间隔 ({settings.refreshInterval} 分钟)
                </label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={settings.refreshInterval}
                  onChange={(e) => handleRefreshIntervalChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1分钟</span>
                  <span>60分钟</span>
                </div>
              </div>
            )}

            {/* 默认货币设置 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                默认基础货币
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => handleDefaultCurrencyChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {settings.preferredCurrencies.map(currency => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* 数据管理 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Database className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              数据管理
            </h2>
          </div>

          <div className="space-y-6">
            {/* 存储使用情况 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  存储使用情况
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {(storageUsage.used / 1024).toFixed(1)} KB / {(storageUsage.total / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* 数据操作按钮 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportData}
                disabled={isExporting}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? '导出中...' : '导出数据'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleImportData}
                disabled={isImporting}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>{isImporting ? '导入中...' : '导入数据'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClearAllData}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>清除数据</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* 隐私与安全 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              隐私与安全
            </h2>
          </div>

          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" />
              <p>所有数据均存储在您的本地设备上，不会上传到任何服务器</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" />
              <p>汇率数据来源于公开的API接口，仅用于货币转换计算</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" />
              <p>您可以随时导出或删除所有个人数据</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" />
              <p>应用不会收集任何个人身份信息</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};