import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ConversionPage } from './pages/ConversionPage';
import { ChartsPage } from './pages/ChartsPage';
import { CurrencyManagePage } from './pages/CurrencyManagePage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { useCurrencyStore } from './store/useCurrencyStore';

function App() {
  const { settings } = useCurrencyStore();

  // 应用主题设置
  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
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
  }, [settings.theme]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ConversionPage />} />
        <Route path="charts" element={<ChartsPage />} />
        <Route path="manage" element={<CurrencyManagePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
