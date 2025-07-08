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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 'bold', color: '#000000' }}>{result.name}</span>
              <span style={{ fontSize: '12px', color: '#818C99' }}>
                Доля: {result.proportion.toFixed(1)}% • {formatPrice(result.actualInvestment)}
              </span>
            </div>
          }
          after={
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#000000' }}>
                {result.sharesToBuy} шт.
              </div>
            </div>
          }
        />
      ))}

      <SimpleCell
        before={
          <div>
            <div style={{ fontWeight: 'bold', color: '#000000' }}>Итого инвестировано</div>
            <div style={{ fontSize: '12px', color: '#818C99' }}>
              Остаток: {formatPrice(portfolioResults.totalRemainder)}
            </div>
          </div>
        }
        after={
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#000000' }}>
            {formatPrice(portfolioResults.totalActualInvestment)}
          </div>
        }
      />

      {/* Целевые дивиденды */}
      <SimpleCell
        before={
          <div>
            <div style={{ fontWeight: 'bold', color: '#000000' }}>
              {targetDividendsLoading ? 'Расчет дивидендов...' : 'Годовые дивиденды'}
            </div>
            <div style={{ fontSize: '12px', color: '#818C99' }}>
              {targetDividendsLoading ? 'Ожидаемая выплата' :
                `Доходность: ${portfolioResults.totalActualInvestment > 0 ?
                  ((targetDividends / portfolioResults.totalActualInvestment) * 100).toFixed(2) : 0}%`
              }
            </div>
          </div>
        }
        after={
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#000000' }}>
            {targetDividendsLoading ? '...' : formatPrice(targetDividends)}
          </div>
        }
      />
    </>
  );
};

export default TargetPortfolio;
