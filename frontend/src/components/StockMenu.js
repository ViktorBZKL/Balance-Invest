import React, { useState, useEffect } from 'react';
import {
  Panel,
  PanelHeader,
  Group,
  Header,
  SimpleCell,
  Button,
  Tabs,
  TabsItem
} from '@vkontakte/vkui';
import StockList from './StockList';
import SelectedStocks from './SelectedStocks';
import InvestmentAmountInput from './InvestmentAmountInput';
import TargetPortfolio from './TargetPortfolio';
import CurrentPortfolio from './CurrentPortfolio';
import { sendVKParamsToBackend, getVKUserId, isVKApp, saveUserPortfolio, loadUserPortfolio } from '../utils/vkUtils';
import API from '../services/api';

const StockMenu = ({ id }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [portfolioResults, setPortfolioResults] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: выбор акций, 2: ввод суммы, 3: результаты
  const [activeTab, setActiveTab] = useState('target'); // 'target' или 'current'
  const [currentHoldings, setCurrentHoldings] = useState({}); // {ticker: количество}
  const [holdingIntervals, setHoldingIntervals] = useState({}); // для зажатия кнопок
  const [editingStock, setEditingStock] = useState(null); // редактируемая акция
  const [totalDividends, setTotalDividends] = useState(0); // общая сумма дивидендов
  const [dividendsLoading, setDividendsLoading] = useState(false); // загрузка дивидендов
  const [targetDividends, setTargetDividends] = useState(0); // дивиденды для целевого портфеля
  const [targetDividendsLoading, setTargetDividendsLoading] = useState(false); // загрузка дивидендов для целевого портфеля
  const [vkUserInfo, setVkUserInfo] = useState(null); // информация о VK пользователе
  const [isDataLoaded, setIsDataLoaded] = useState(false); // флаг завершения загрузки данных
  // Функция для загрузки сохраненного портфеля
  const loadSavedPortfolio = async (vkUserId, stocksArray = null) => {
    try {
      const savedPortfolio = await loadUserPortfolio(vkUserId);
      if (savedPortfolio && savedPortfolio.investment_amount > 0) {
        console.log('Загружаем сохраненный портфель:', savedPortfolio);

        // Устанавливаем сумму инвестиций
        const formattedAmount = formatNumberWithSpaces(savedPortfolio.investment_amount.toString());
        setInvestmentAmount(formattedAmount);

        // Нужно сначала найти соответствующие акции из списка всех акций
        const savedTickers = savedPortfolio.stocks.map(stock => stock.ticker);

        // Используем переданный массив акций или текущее состояние
        const availableStocks = stocksArray || stocks;

        if (availableStocks.length > 0) {
          const savedStocks = availableStocks.filter(stock => savedTickers.includes(stock.ticker));
          setSelectedStocks(savedStocks);

          // Устанавливаем текущие позиции
          const holdings = {};
          savedPortfolio.stocks.forEach(stock => {
            holdings[stock.ticker] = stock.quantity;
          });
          setCurrentHoldings(holdings);

          // Рассчитываем портфель автоматически
          calculatePortfolioForSavedData(savedStocks, savedPortfolio.investment_amount);

          // Переходим сразу к шагу 3 (результаты)
          setCurrentStep(3);

          console.log('Портфель загружен успешно, переходим к результатам');
          return true;
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке портфеля:', error);
    }
    return false;
  };

  // Функция для расчета портфеля для сохраненных данных
  const calculatePortfolioForSavedData = (savedStocks, investmentAmount) => {
    if (savedStocks.length === 0 || !investmentAmount || investmentAmount <= 0) {
      return;
    }

    const amount = parseFloat(investmentAmount);

    // Считаем общую капитализацию выбранных акций
    const totalCapitalization = savedStocks.reduce((sum, stock) => {
      return sum + (stock.price * stock.volume);
    }, 0);

    // Рассчитываем пропорции и количество акций для покупки
    const results = savedStocks.map(stock => {
      const stockCapitalization = stock.price * stock.volume;
      const proportion = stockCapitalization / totalCapitalization;
      const investmentForStock = amount * proportion;
      const idealSharesToBuy = Math.floor(investmentForStock / stock.price);

      // Ограничиваем количество акций размером эмиссии (ISSUESIZE)
      const maxAvailableShares = stock.volume; // volume - это ISSUESIZE
      const sharesToBuy = Math.min(idealSharesToBuy, maxAvailableShares);
      const actualInvestment = sharesToBuy * stock.price;

      return {
        ...stock,
        proportion: proportion * 100,
        investmentAmount: investmentForStock,
        sharesToBuy,
        actualInvestment,
        remainder: investmentForStock - actualInvestment
      };
    });

    const totalActualInvestment = results.reduce((sum, result) => sum + result.actualInvestment, 0);
    const totalRemainder = amount - totalActualInvestment;

    setPortfolioResults({
      stocks: results,
      totalInvestment: amount,
      totalActualInvestment,
      totalRemainder,
      totalCapitalization
    });

    console.log('Портфель рассчитан для загруженных данных');
  };

  // Функция для сохранения портфеля
  const savePortfolio = async () => {
    try {
      const vkUserId = getVKUserId();
      if (!vkUserId || !investmentAmount || selectedStocks.length === 0) {
        return;
      }

      await saveUserPortfolio(vkUserId, investmentAmount, selectedStocks, currentHoldings);
      console.log('Портфель автоматически сохранен');
    } catch (error) {
      console.error('Ошибка при сохранении портфеля:', error);
    }
  };

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Начинаем загрузку данных...');
        const stocksData = await API.getStocks();
        console.log('Данные получены:', stocksData);

        if (stocksData && stocksData.length > 0) {
          // Преобразуем массив массивов в массив объектов
          const stocksArray = stocksData.map(stockArray => ({
            ticker: stockArray[0],
            name: stockArray[1],
            price: stockArray[2],
            volume: stockArray[3]
          }));

          // Сортируем по капитализации
          const sortedStocks = sortStocksByCapitalization(stocksArray);
          console.log('Обработанные и отсортированные акции:', sortedStocks);

          setStocks(sortedStocks);
          setFilteredStocks(sortedStocks);

          // После загрузки акций пытаемся загрузить сохраненный портфель
          const vkUserId = getVKUserId();
          if (vkUserId && isVKApp()) {
            const portfolioLoaded = await loadSavedPortfolio(vkUserId, sortedStocks);
            if (portfolioLoaded) {
              console.log('Портфель загружен, остаемся на шаге 3');
            }
          }

          // Устанавливаем флаг завершения загрузки
          setIsDataLoaded(true);
        } else {
          setError('Нет данных об акциях');
          setIsDataLoaded(true);
        }
      } catch (err) {
        console.error('Ошибка при загрузке акций:', err);
        setError(`Не удалось загрузить данные об акциях: ${err.message}`);
        setIsDataLoaded(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Отправка VK параметров на бэкенд при загрузке компонента
  useEffect(() => {
    const sendVKParams = async () => {
      try {
        if (isVKApp()) {
          console.log('Приложение запущено в VK, отправляем параметры на бэкенд...');
          const vkData = await sendVKParamsToBackend();
          setVkUserInfo(vkData);
          console.log('VK пользователь:', vkData);
        } else {
          console.log('Приложение запущено вне VK');
        }
      } catch (error) {
        console.error('Ошибка при отправке VK параметров:', error);
      }
    };

    sendVKParams();
  }, []);

  // Очистка интервалов при размонтировании компонента
  useEffect(() => {
    return () => {
      Object.values(holdingIntervals).forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, [holdingIntervals]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 3
    }).format(price);
  };

  const formatVolume = (volume) => {
    return new Intl.NumberFormat('ru-RU').format(volume);
  };

  // Функция для форматирования числа с пробелами
  const formatNumberWithSpaces = (value) => {
    // Убираем все пробелы и оставляем только цифры
    const cleanValue = value.replace(/\s/g, '');
    // Добавляем пробелы каждые 3 цифры
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Функция для получения числового значения из отформатированной строки
  const getNumericValue = (formattedValue) => {
    return formattedValue.replace(/\s/g, '');
  };

  // Функция для сортировки по капитализации (цена × объем) по убыванию
  const sortStocksByCapitalization = (stocksArray) => {
    return [...stocksArray].sort((a, b) => {
      const capA = a.price * a.volume;
      const capB = b.price * b.volume;
      return capB - capA; // по убыванию
    });
  };

  // Функция для фильтрации акций по поисковому запросу
  const filterStocks = (stocksArray, searchTerm) => {
    if (!searchTerm.trim()) return stocksArray;

    return stocksArray.filter(stock =>
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.ticker.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    const sortedStocks = sortStocksByCapitalization(stocks);
    const filtered = filterStocks(sortedStocks, value);
    setFilteredStocks(filtered);
  };

  // Обработчик выбора/отмены выбора акции
  const handleStockToggle = (stock) => {
    setSelectedStocks(prevSelected => {
      const isAlreadySelected = prevSelected.some(s => s.ticker === stock.ticker);
      if (isAlreadySelected) {
        return prevSelected.filter(s => s.ticker !== stock.ticker);
      } else {
        return [...prevSelected, stock];
      }
    });
  };

  // Переход к следующему шагу
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Переход к предыдущему шагу
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Начать сначала
  const resetProcess = () => {
    setCurrentStep(1);
    setSelectedStocks([]);
    setInvestmentAmount('');
    setPortfolioResults(null);
    setCurrentHoldings({});
    setActiveTab('target');
    setEditingStock(null);
    setTotalDividends(0);
    setTargetDividends(0);
    setIsDataLoaded(true); // Сбрасываем флаг загрузки
    // Очищаем все интервалы
    Object.values(holdingIntervals).forEach(timeoutId => clearTimeout(timeoutId));
    setHoldingIntervals({});

    // Очищаем данные в базе данных
    const vkUserId = getVKUserId();
    if (vkUserId && vkUserInfo) {
      clearUserPortfolio(vkUserId);
    }
  };

  // Функция для очистки портфеля в базе данных
  const clearUserPortfolio = async (vkUserId) => {
    try {
      await saveUserPortfolio(vkUserId, 0, [], {});
      console.log('Портфель очищен в базе данных');
    } catch (error) {
      console.error('Ошибка при очистке портфеля:', error);
    }
  };

  // Обновление текущих позиций с проверкой лимитов
  const updateCurrentHolding = (ticker, change) => {
    setCurrentHoldings(prev => {
      const currentAmount = prev[ticker] || 0;
      const stock = selectedStocks.find(s => s.ticker === ticker);
      const maxShares = stock ? stock.volume : Infinity; // volume = ISSUESIZE

      const newAmount = Math.max(0, Math.min(maxShares, currentAmount + change));

      if (newAmount === 0) {
        const { [ticker]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ticker]: newAmount };
    });
  };

  // Функции для зажатия кнопок с ускорением
  const startHolding = (ticker, change) => {
    updateCurrentHolding(ticker, change);

    let count = 0;
    const getDelay = () => {
      if (count < 5) return 200;      // Первые 5 нажатий - медленно
      if (count < 15) return 100;     // Следующие 10 - быстрее
      if (count < 30) return 50;      // Еще быстрее
      return 25;                      // Максимальная скорость
    };

    const acceleratingInterval = () => {
      count++;
      updateCurrentHolding(ticker, change);
      const delay = getDelay();
      const timeoutId = setTimeout(acceleratingInterval, delay);
      setHoldingIntervals(prev => ({ ...prev, [ticker]: timeoutId }));
    };

    const initialTimeoutId = setTimeout(acceleratingInterval, getDelay());
    setHoldingIntervals(prev => ({ ...prev, [ticker]: initialTimeoutId }));
  };

  const stopHolding = (ticker) => {
    const timeoutId = holdingIntervals[ticker];
    if (timeoutId) {
      clearTimeout(timeoutId);
      setHoldingIntervals(prev => {
        const { [ticker]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  // Прямое изменение количества акций с проверкой лимитов
  const handleDirectInput = (ticker, value) => {
    const numericValue = parseInt(value) || 0;
    const stock = selectedStocks.find(s => s.ticker === ticker);
    const maxShares = stock ? stock.volume : Infinity;

    const validValue = Math.max(0, Math.min(maxShares, numericValue));

    if (validValue === 0) {
      const { [ticker]: removed, ...rest } = currentHoldings;
      setCurrentHoldings(rest);
    } else {
      setCurrentHoldings(prev => ({ ...prev, [ticker]: validValue }));
    }
  };

  // Расчет портфеля на основе капитализации
  const calculatePortfolio = () => {
    const numericAmount = getNumericValue(investmentAmount);
    if (selectedStocks.length === 0 || !numericAmount || numericAmount <= 0) {
      return;
    }

    const amount = parseFloat(numericAmount);

    // Считаем общую капитализацию выбранных акций
    const totalCapitalization = selectedStocks.reduce((sum, stock) => {
      return sum + (stock.price * stock.volume);
    }, 0);

    // Рассчитываем пропорции и количество акций для покупки
    const results = selectedStocks.map(stock => {
      const stockCapitalization = stock.price * stock.volume;
      const proportion = stockCapitalization / totalCapitalization;
      const investmentForStock = amount * proportion;
      const idealSharesToBuy = Math.floor(investmentForStock / stock.price);

      // Ограничиваем количество акций размером эмиссии (ISSUESIZE)
      const maxAvailableShares = stock.volume; // volume - это ISSUESIZE
      const sharesToBuy = Math.min(idealSharesToBuy, maxAvailableShares);
      const actualInvestment = sharesToBuy * stock.price;

      return {
        ...stock,
        proportion: proportion * 100,
        investmentAmount: investmentForStock,
        sharesToBuy,
        actualInvestment,
        remainder: investmentForStock - actualInvestment
      };
    });

    const totalActualInvestment = results.reduce((sum, result) => sum + result.actualInvestment, 0);
    const totalRemainder = amount - totalActualInvestment;

    setPortfolioResults({
      stocks: results,
      totalInvestment: amount,
      totalActualInvestment,
      totalRemainder,
      totalCapitalization
    });

    setCurrentStep(3); // Переходим к результатам
  };

  // Функция для расчета дивидендов для целевого портфеля
  const calculateTargetDividends = async () => {
    if (!portfolioResults || portfolioResults.stocks.length === 0) {
      setTargetDividends(0);
      return;
    }

    setTargetDividendsLoading(true);
    try {
      let totalTargetDividends = 0;

      // Получаем дивиденды для каждой акции в целевом портфеле
      for (const result of portfolioResults.stocks) {
        if (result.sharesToBuy > 0) {
          const dividendPerShare = await API.getDividends(result.ticker);
          totalTargetDividends += dividendPerShare * result.sharesToBuy;
        }
      }

      setTargetDividends(totalTargetDividends);
    } catch (error) {
      console.error('Ошибка при расчете целевых дивидендов:', error);
      setTargetDividends(0);
    } finally {
      setTargetDividendsLoading(false);
    }
  };

  // Функция для расчета дивидендов
  const calculateTotalDividends = async () => {
    if (Object.keys(currentHoldings).length === 0) {
      setTotalDividends(0);
      return;
    }

    setDividendsLoading(true);
    try {
      let totalDividendsAmount = 0;

      // Получаем дивиденды для каждой акции в текущих позициях
      for (const [ticker, amount] of Object.entries(currentHoldings)) {
        if (amount > 0) {
          const dividendPerShare = await API.getDividends(ticker);
          totalDividendsAmount += dividendPerShare * amount;
        }
      }

      setTotalDividends(totalDividendsAmount);
    } catch (error) {
      console.error('Ошибка при расчете дивидендов:', error);
      setTotalDividends(0);
    } finally {
      setDividendsLoading(false);
    }
  };

  // Пересчитываем дивиденды при изменении текущих позиций
  useEffect(() => {
    calculateTotalDividends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHoldings]);

  // Пересчитываем целевые дивиденды при изменении результатов портфеля
  useEffect(() => {
    calculateTargetDividends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioResults]);

  // Автосохранение портфеля при изменении данных
  useEffect(() => {
    // Сохраняем только если есть VK пользователь, данные для сохранения и загрузка завершена
    if (vkUserInfo && investmentAmount && selectedStocks.length > 0 && isDataLoaded) {
      const timeoutId = setTimeout(() => {
        savePortfolio();
      }, 2000); // Сохраняем через 2 секунды после последнего изменения

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investmentAmount, currentHoldings, selectedStocks, vkUserInfo, isDataLoaded]);

  if (loading) {
    return (
      <Panel id={id}>
        <PanelHeader>Акции</PanelHeader>
        <Group>
          <div className="loading-container">
            <p>Загрузка данных...</p>
          </div>
        </Group>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel id={id}>
        <PanelHeader>Акции</PanelHeader>
        <Group>
          <div className="empty-state">
            <p>Ошибка: {error}</p>
          </div>
        </Group>
      </Panel>
    );
  }

  return (
    <Panel id={id}>
      <PanelHeader>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div className="vk-text-primary">
            Балансировка портфеля
            <span className="currency-text">
              (Шаг {currentStep} из 3)
            </span>
          </div>
        </div>
      </PanelHeader>

      {/* Шаг 1: Выбор акций */}
      {currentStep === 1 && (
        <>
          <Group>
            <Header mode="secondary">Шаг 1: Выберите акции</Header>
            <StockList
              stocks={filteredStocks}
              searchValue={searchValue}
              onSearchChange={handleSearchChange}
              selectedStocks={selectedStocks}
              onStockToggle={handleStockToggle}
              formatVolume={formatVolume}
            />
          </Group>

          {selectedStocks.length > 0 && (
            <Group>
              <SelectedStocks
                selectedStocks={selectedStocks}
                onStockRemove={handleStockToggle}
                onNext={goToNextStep}
              />
            </Group>
          )}
        </>
      )}

      {/* Шаг 2: Ввод суммы */}
      {currentStep === 2 && (
        <>
          <Group>
            <Header mode="secondary">Шаг 2: Укажите сумму</Header>
            <InvestmentAmountInput
              value={investmentAmount}
              onChange={setInvestmentAmount}
              formatNumberWithSpaces={formatNumberWithSpaces}
            />
          </Group>

          <Group>
            <Header mode="secondary">Выбранные акции ({selectedStocks.length})</Header>
            {selectedStocks.map(stock => (
              <SimpleCell key={stock.ticker}>
                <strong>{stock.name}</strong>: {stock.ticker}
              </SimpleCell>
            ))}
          </Group>

          <Group>
            <Button
              size="m"
              stretched
              onClick={calculatePortfolio}
              disabled={!investmentAmount || getNumericValue(investmentAmount) <= 0}
              style={{ marginBottom: '8px' }}
            >
              Рассчитать распределение
            </Button>
            <Button
              size="m"
              stretched
              mode="secondary"
              onClick={goToPreviousStep}
            >
              Назад
            </Button>
          </Group>
        </>
      )}

      {/* Шаг 3: Результаты */}
      {currentStep === 3 && portfolioResults && (
        <>
          <Group className="portfolio-summary">
            <div className="portfolio-summary-card" style={{
              backgroundColor: '#FFF3CD',
              border: '1px solid #FFEAA7',
              color: '#856404',
              textAlign: 'center'
            }}>
              ⚠️ Результаты расчёта программы не являются индивидуальной инвестиционной рекомендацией. Все инвестиционные решения принимаются на ваш страх и риск.
            </div>
          </Group>


          <Group>
            <Tabs>
              <TabsItem
                selected={activeTab === 'target'}
                onClick={() => setActiveTab('target')}
              >
                Целевое распределение
              </TabsItem>
              <TabsItem
                selected={activeTab === 'current'}
                onClick={() => setActiveTab('current')}
              >
                Текущее распределение
              </TabsItem>
            </Tabs>
          </Group>

          {/* Вкладка: Целевое распределение */}
          {activeTab === 'target' && (
            <Group>
              <TargetPortfolio
                portfolioResults={portfolioResults}
                formatPrice={formatPrice}
                targetDividends={targetDividends}
                targetDividendsLoading={targetDividendsLoading}
              />
            </Group>
          )}

          {/* Вкладка: Текущее распределение */}
          {activeTab === 'current' && (
            <Group>
              <CurrentPortfolio
                selectedStocks={selectedStocks}
                portfolioResults={portfolioResults}
                currentHoldings={currentHoldings}
                editingStock={editingStock}
                setEditingStock={setEditingStock}
                startHolding={startHolding}
                stopHolding={stopHolding}
                handleDirectInput={handleDirectInput}
                formatPrice={formatPrice}
                totalDividends={totalDividends}
                dividendsLoading={dividendsLoading}
              />
            </Group>
          )}

          <Group>
            <Button
              size="m"
              stretched
              mode="secondary"
              onClick={() => setCurrentStep(2)}
              style={{ marginBottom: '8px' }}
            >
              Изменить сумму
            </Button>
            <Button
              size="m"
              stretched
              mode="secondary"
              onClick={() => setCurrentStep(1)}
              style={{ marginBottom: '8px' }}
            >
              Изменить акции
            </Button>
            <Button
              size="m"
              stretched
              mode="outline"
              onClick={resetProcess}
            >
              Начать сначала
            </Button>
          </Group>
        </>
      )}
    </Panel>
  );
};

export default StockMenu;
