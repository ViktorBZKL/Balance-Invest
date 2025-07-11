import React from 'react';
import { Header, SimpleCell } from '@vkontakte/vkui';

const TargetPortfolio = ({ portfolioResults, formatPrice, targetDividends, targetDividendsLoading }) => {
  return (
    <>
      <Header mode="secondary">Рекомендуемое распределение</Header>
      {portfolioResults.stocks.map(result => (
        <SimpleCell
          key={result.ticker}
          before={
            <div className="portfolio-container">
              <span className="stock-name">{result.name}</span>
              <span className="stock-details">
                Доля: {result.proportion.toFixed(1)}% • {formatPrice(result.actualInvestment)}
              </span>
            </div>
          }
          after={
            <div style={{ textAlign: 'right' }}>
              <div className="total-value">
                {result.sharesToBuy} шт.
              </div>
            </div>
          }
        />
      ))}

      <SimpleCell
        before={
          <div>
            <div className="stock-name">Итого инвестировано</div>
            <div className="stock-details">
              Остаток: {formatPrice(portfolioResults.totalRemainder)}
            </div>
          </div>
        }
        after={
          <div className="total-value">
            {formatPrice(portfolioResults.totalActualInvestment)}
          </div>
        }
      />

      {/* Целевые дивиденды */}
      <SimpleCell
        before={
          <div>
            <div className="stock-name">
              {targetDividendsLoading ? 'Расчет дивидендов...' : 'Годовые дивиденды'}
            </div>
            <div className="stock-details">
              {targetDividendsLoading ? 'Ожидаемая выплата' :
                `Доходность: ${portfolioResults.totalActualInvestment > 0 ?
                  ((targetDividends / portfolioResults.totalActualInvestment) * 100).toFixed(2) : 0}%`
              }
            </div>
          </div>
        }
        after={
          <div className="total-value">
            {targetDividendsLoading ? '...' : formatPrice(targetDividends)}
          </div>
        }
      />
    </>
  );
};

export default TargetPortfolio;
