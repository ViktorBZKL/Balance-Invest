import React from 'react';
import { Header, Search, Checkbox } from '@vkontakte/vkui';

const StockList = ({
  stocks,
  searchValue,
  onSearchChange,
  selectedStocks,
  onStockToggle,
  formatVolume
}) => {
  return (
    <>
      <Search
        value={searchValue}
        onChange={onSearchChange}
        placeholder="Поиск по названию или тикеру..."
      />
      <Header mode="secondary" style={{ marginTop: '16px' }}>
        Список акций ({stocks.length})
        {searchValue && (
          <span className="currency-text">
            найдено
          </span>
        )}
      </Header>
      <div className="vk-card" style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        maxHeight: '200px',
        overflowY: 'auto'
      }}>
        {stocks.length > 0 ? (
          stocks.map((stock) => {
            const isSelected = selectedStocks.some(s => s.ticker === stock.ticker);
            return (
              <div
                key={stock.ticker}
                style={{
                  padding: '8px 16px',
                  borderBottom: '1px solid #e0e0e0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onClick={() => onStockToggle(stock)}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => onStockToggle(stock)}
                  style={{ marginRight: '12px' }}
                />
                <span className="vk-text-primary">
                  <strong>{stock.name}</strong>: {stock.ticker}
                </span>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            Ничего не найдено
          </div>
        )}
      </div>
    </>
  );
};

export default StockList;
