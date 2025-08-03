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
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState('target');
  const [currentHoldings, setCurrentHoldings] = useState({});
  const [holdingIntervals, setHoldingIntervals] = useState({});
  const [editingStock, setEditingStock] = useState(null);
  const [totalDividends, setTotalDividends] = useState(0);
  const [dividendsLoading, setDividendsLoading] = useState(false);
  const [targetDividends, setTargetDividends] = useState(0);
  const [targetDividendsLoading, setTargetDividendsLoading] = useState(false);
  const [vkUserInfo, setVkUserInfo] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const loadSavedPortfolio = async (vkUserId, stocksArray = null) => {
    try {
      const savedPortfolio = await loadUserPortfolio(vkUserId);
      if (savedPortfolio && savedPortfolio.investment_amount > 0) {
        const formattedAmount = formatNumberWithSpaces(savedPortfolio.investment_amount.toString());
        setInvestmentAmount(formattedAmount);

        const savedTickers = savedPortfolio.stocks.map(stock => stock.ticker);

        const availableStocks = stocksArray || stocks;

        if (availableStocks.length > 0) {
          const savedStocks = availableStocks.filter(stock => savedTickers.includes(stock.ticker));
          setSelectedStocks(savedStocks);

          const holdings = {};
          savedPortfolio.stocks.forEach(stock => {
            holdings[stock.ticker] = stock.quantity;
          });
          setCurrentHoldings(holdings);

          calculatePortfolioForSavedData(savedStocks, savedPortfolio.investment_amount);

          setCurrentStep(3);

          return true;
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке портфеля:', error);
    }
    return false;
  };

  const calculatePortfolioForSavedData = (savedStocks, investmentAmount) => {
    if (savedStocks.length === 0 || !investmentAmount || investmentAmount <= 0) {
      return;
    }

    const amount = parseFloat(investmentAmount);

    const totalCapitalization = savedStocks.reduce((sum, stock) => {
      return sum + (stock.price * stock.volume);
    }, 0);

    const results = savedStocks.map(stock => {
      const stockCapitalization = stock.price * stock.volume;
      const proportion = stockCapitalization / totalCapitalization;
      const investmentForStock = amount * proportion;
      const idealSharesToBuy = Math.floor(investmentForStock / stock.price);

      const maxAvailableShares = stock.volume;
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

  };

  const savePortfolio = async () => {
    try {
      const vkUserId = getVKUserId();
      if (!vkUserId || !investmentAmount || selectedStocks.length === 0) {
        return;
      }

      await saveUserPortfolio(vkUserId, investmentAmount, selectedStocks, currentHoldings);
    } catch (error) {
      console.error('Ошибка при сохранении портфеля:', error);
    }
  };

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError(null);

        const stocksData = await API.getStocks();

        if (stocksData && stocksData.length > 0) {
          const stocksArray = stocksData.map(stockArray => ({
            ticker: stockArray[0],
            name: stockArray[1],
            price: stockArray[2],
            volume: stockArray[3]
          }));

          const sortedStocks = sortStocksByCapitalization(stocksArray);

          setStocks(sortedStocks);
          setFilteredStocks(sortedStocks);

          const vkUserId = getVKUserId();
          if (vkUserId && isVKApp()) {
            const portfolioLoaded = await loadSavedPortfolio(vkUserId, sortedStocks);
            if (portfolioLoaded) {
            }
          }

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
  }, []);

  useEffect(() => {
    const sendVKParams = async () => {
      try {
        if (isVKApp()) {
          const vkData = await sendVKParamsToBackend();
          setVkUserInfo(vkData);
        } else {
        }
      } catch (error) {
        console.error('Ошибка при отправке VK параметров:', error);
      }
    };

    sendVKParams();
  }, []);

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

  const formatNumberWithSpaces = (value) => {
    const cleanValue = value.replace(/\s/g, '');
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const getNumericValue = (formattedValue) => {
    return formattedValue.replace(/\s/g, '');
  };

  const sortStocksByCapitalization = (stocksArray) => {
    return [...stocksArray].sort((a, b) => {
      const capA = a.price * a.volume;
      const capB = b.price * b.volume;
      return capB - capA;
    });
  };

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

  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

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
    setIsDataLoaded(true);
    Object.values(holdingIntervals).forEach(timeoutId => clearTimeout(timeoutId));
    setHoldingIntervals({});

    const vkUserId = getVKUserId();
    if (vkUserId && vkUserInfo) {
      clearUserPortfolio(vkUserId);
    }
  };

  const clearUserPortfolio = async (vkUserId) => {
    try {
      await saveUserPortfolio(vkUserId, 0, [], {});
    } catch (error) {
      console.error('Ошибка при очистке портфеля:', error);
    }
  };

  const updateCurrentHolding = (ticker, change) => {
    setCurrentHoldings(prev => {
      const currentAmount = prev[ticker] || 0;
      const stock = selectedStocks.find(s => s.ticker === ticker);
      const maxShares = stock ? stock.volume : Infinity;

      const newAmount = Math.max(0, Math.min(maxShares, currentAmount + change));

      if (newAmount === 0) {
        const { [ticker]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ticker]: newAmount };
    });
  };

  const startHolding = (ticker, change) => {
    updateCurrentHolding(ticker, change);

    let count = 0;
    const getDelay = () => {
      if (count < 5) return 200;
      if (count < 15) return 100;
      if (count < 30) return 50;
      return 25;
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

  const calculatePortfolio = () => {
    const numericAmount = getNumericValue(investmentAmount);
    if (selectedStocks.length === 0 || !numericAmount || numericAmount <= 0) {
      return;
    }

    const amount = parseFloat(numericAmount);

    const totalCapitalization = selectedStocks.reduce((sum, stock) => {
      return sum + (stock.price * stock.volume);
    }, 0);

    const results = selectedStocks.map(stock => {
      const stockCapitalization = stock.price * stock.volume;
      const proportion = stockCapitalization / totalCapitalization;
      const investmentForStock = amount * proportion;
      const idealSharesToBuy = Math.floor(investmentForStock / stock.price);

      const maxAvailableShares = stock.volume;
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

    setCurrentStep(3);
  };

  const calculateTargetDividends = async () => {
    if (!portfolioResults || portfolioResults.stocks.length === 0) {
      setTargetDividends(0);
      return;
    }

    setTargetDividendsLoading(true);
    try {
      let totalTargetDividends = 0;

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

  const calculateTotalDividends = async () => {
    if (Object.keys(currentHoldings).length === 0) {
      setTotalDividends(0);
      return;
    }

    setDividendsLoading(true);
    try {
      let totalDividendsAmount = 0;

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

  useEffect(() => {
    calculateTotalDividends();
  }, [currentHoldings]);

  useEffect(() => {
    calculateTargetDividends();
  }, [portfolioResults]);

  useEffect(() => {
    if (vkUserInfo && investmentAmount && selectedStocks.length > 0 && isDataLoaded) {
      const timeoutId = setTimeout(() => {
        savePortfolio();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
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
                <span className="vk-text-primary">
                  <strong>{stock.name}</strong>: {stock.ticker}
                </span>
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
