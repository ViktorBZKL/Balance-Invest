import React from 'react';
import { Header, SimpleCell } from '@vkontakte/vkui';
import StockQuantityEditor from './StockQuantityEditor';

const CurrentPortfolio = ({
  selectedStocks,
  portfolioResults,
  currentHoldings,
  editingStock,
  setEditingStock,
  startHolding,
  stopHolding,
  handleDirectInput,
  formatPrice,
  totalDividends,
  dividendsLoading
}) => {
  return (
    <>
      <Header mode="secondary">Укажите текущие позиции</Header>
      {selectedStocks.map(stock => {
        const currentAmount = currentHoldings[stock.ticker] || 0;
        const targetResult = portfolioResults.stocks.find(r => r.ticker === stock.ticker);
        const targetAmount = targetResult ? targetResult.sharesToBuy : 0;
        const difference = targetAmount - currentAmount;
        const maxShares = stock.volume; // ISSUESIZE

        return (
          <SimpleCell
            key={stock.ticker}
            before={
              <div className="portfolio-container">
                <span className="stock-name">{stock.name}</span>
                <div className="stock-details">
                  <div>{stock.ticker} • {formatPrice(stock.price)}</div>
                  {difference > 0 ? (
                    <div className="profit-text">
                      Купить еще: {difference} шт.
                    </div>
                  ) : difference < 0 ? (
                    <div className="price-text">
                      Целевое распределение достигнуто
                    </div>
                  ) : currentAmount > 0 ? (
                    <div className="price-text">
                      Целевое распределение достигнуто
                    </div>
                  ) : null}
                </div>
              </div>
            }
            after={
              <StockQuantityEditor
                stock={stock}
                currentAmount={currentAmount}
                editingStock={editingStock}
                setEditingStock={setEditingStock}
                startHolding={startHolding}
                stopHolding={stopHolding}
                handleDirectInput={handleDirectInput}
                maxShares={maxShares}
              />
            }
          />
        );
      })}

      {/* Итоговая стоимость текущих позиций */}
      {Object.keys(currentHoldings).length > 0 && (
        <SimpleCell
          before={
            <div>
              <div className="stock-name">Стоимость позиций</div>
              <div className="stock-details">
                Текущий портфель
              </div>
            </div>
          }
          after={
            <div className="total-value">
              {formatPrice(
                selectedStocks.reduce((total, stock) => {
                  const amount = currentHoldings[stock.ticker] || 0;
                  return total + (stock.price * amount);
                }, 0)
              )}
            </div>
          }
        />
      )}

      {/* Сумма дивидендов */}
      {Object.keys(currentHoldings).length > 0 && (
        <SimpleCell
          before={
            <div>
              <div className="stock-name">
                {dividendsLoading ? 'Расчет дивидендов...' : 'Годовые дивиденды'}
              </div>
              <div className="stock-details">
                {dividendsLoading ? 'Ожидаемая выплата' : (() => {
                  const currentPortfolioValue = selectedStocks.reduce((total, stock) => {
                    const amount = currentHoldings[stock.ticker] || 0;
                    return total + (stock.price * amount);
                  }, 0);
                  const yieldPercent = currentPortfolioValue > 0 ?
                    ((totalDividends / currentPortfolioValue) * 100).toFixed(2) : 0;
                  return `Доходность: ${yieldPercent}%`;
                })()}
              </div>
            </div>
          }
          after={
            <div className="total-value">
              {dividendsLoading ? '...' : formatPrice(totalDividends)}
            </div>
          }
        />
      )}
    </>
  );
};

export default CurrentPortfolio;
