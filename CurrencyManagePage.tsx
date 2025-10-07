import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Star, StarOff, Eye, EyeOff, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { CURRENCY_SYMBOLS, CURRENCY_NAMES, DEFAULT_CURRENCIES } from '../constants/currencies';
import { toast } from 'sonner';

export const CurrencyManagePage: React.FC = () => {
  const {
    currencies,
    settings,
    addCurrency,
    removeCurrency,
    updateCurrencyOrder,
    updateSettings,
  } = useCurrencyStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // 过滤可添加的货币
  const availableCurrencies = DEFAULT_CURRENCIES.filter(
    currency => !currencies.some(c => c.code === currency.code)
  ).filter(currency =>
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    CURRENCY_NAMES[currency.code]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 处理拖拽排序
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(currencies);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedCurrencyObjects = items.map(item => 
      currencies.find(c => c.code === item.code) || item
    );
    updateCurrencyOrder(reorderedCurrencyObjects);
  };

  // 添加货币
  const handleAddCurrency = (currencyCode: string) => {
    const currency = DEFAULT_CURRENCIES.find(c => c.code === currencyCode);
    if (currency) {
      addCurrency({
        ...currency,
        isActive: true,
        isFavorite: false,
      });
      toast.success(`已添加 ${currency.code}`);
    }
  };

  // 移除货币
  const handleRemoveCurrency = (currencyCode: string) => {
    if (currencies.length <= 2) {
      toast.error('至少需要保留两种货币');
      return;
    }
    removeCurrency(currencyCode);
    toast.success(`已移除 ${currencyCode}`);
  };

  // 切换收藏状态
  const handleToggleFavorite = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      const updatedCurrencies = currencies.map(c =>
        c.code === currencyCode ? { ...c, isFavorite: !c.isFavorite } : c
      );
      // 这里需要更新货币列表，但当前store没有这个方法，我们可以通过移除再添加来实现
      removeCurrency(currencyCode);
      addCurrency({ ...currency, isFavorite: !currency.isFavorite });
    }
  };

  // 切换显示状态
  const handleToggleActive = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (currency) {
      removeCurrency(currencyCode);
      addCurrency({ ...currency, isActive: !currency.isActive });
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
                货币管理
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                管理您的货币列表和显示偏好
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>添加货币</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 当前货币列表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              当前货币列表 ({currencies.length})
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              拖拽可调整显示顺序
            </p>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="currency-list">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`
                    transition-colors duration-200
                    ${snapshot.isDraggingOver ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                  `}
                >
                  <AnimatePresence>
                    {currencies.map((currency, index) => (
                      <Draggable
                        key={currency.code}
                        draggableId={currency.code}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`
                              flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0
                              ${snapshot.isDragging ? 'bg-white dark:bg-gray-800 shadow-lg rounded-lg z-50' : ''}
                              transition-all duration-200
                            `}
                            style={{
                              ...provided.draggableProps.style,
                              transform: snapshot.isDragging 
                                ? `${provided.draggableProps.style?.transform} scale(1.02)`
                                : provided.draggableProps.style?.transform,
                            }}
                          >
                            <div className="flex items-center space-x-4">
                              {/* 拖拽手柄 */}
                              <div
                                {...provided.dragHandleProps}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>

                              {/* 货币信息 */}
                              <div className="flex items-center space-x-3">
                                <div className="text-2xl">
                                  {CURRENCY_SYMBOLS[currency.code] || currency.code}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {currency.code}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {CURRENCY_NAMES[currency.code] || currency.code}
                                  </div>
                                </div>
                              </div>

                              {/* 状态标签 */}
                              <div className="flex items-center space-x-2">
                                {currency.isFavorite && (
                                  <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                                    收藏
                                  </span>
                                )}
                                {!currency.isActive && (
                                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                    已隐藏
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex items-center space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleToggleFavorite(currency.code)}
                                className={`
                                  p-2 rounded-lg transition-colors
                                  ${currency.isFavorite
                                    ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-50 dark:bg-yellow-900/30'
                                    : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                                  }
                                `}
                              >
                                {currency.isFavorite ? (
                                  <Star className="w-4 h-4 fill-current" />
                                ) : (
                                  <StarOff className="w-4 h-4" />
                                )}
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleToggleActive(currency.code)}
                                className={`
                                  p-2 rounded-lg transition-colors
                                  ${currency.isActive
                                    ? 'text-green-600 hover:text-green-700 bg-green-50 dark:bg-green-900/30'
                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                                  }
                                `}
                              >
                                {currency.isActive ? (
                                  <Eye className="w-4 h-4" />
                                ) : (
                                  <EyeOff className="w-4 h-4" />
                                )}
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleRemoveCurrency(currency.code)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </AnimatePresence>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </motion.div>
      </div>

      {/* 添加货币模态框 */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-96 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  添加货币
                </h3>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索货币..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {availableCurrencies.map((currency) => (
                  <motion.button
                    key={currency.code}
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                    onClick={() => {
                      handleAddCurrency(currency.code);
                      setShowAddModal(false);
                      setSearchTerm('');
                    }}
                    className="w-full flex items-center space-x-3 px-6 py-3 text-left hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    <div className="text-xl">
                      {CURRENCY_SYMBOLS[currency.code] || currency.code}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {currency.code}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {CURRENCY_NAMES[currency.code] || currency.code}
                      </div>
                    </div>
                  </motion.button>
                ))}

                {availableCurrencies.length === 0 && (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? '未找到匹配的货币' : '所有货币都已添加'}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};