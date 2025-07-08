import React from 'react';
import { Header, SimpleCell, Button } from '@vkontakte/vkui';

const SelectedStocks = ({ selectedStocks, onStockRemove, onNext }) => {
  if (selectedStocks.length === 0) return null;

  return (
    <>
      <Header mode="secondary">Выбранные акции ({selectedStocks.length})</Header>
      <div style={{
        maxHeight: '150px',
        overflowY: 'auto',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fff'
      }}>
        {selectedStocks.map(stock => (
          <SimpleCell
            key={stock.ticker}
            removable
            onRemove={() => onStockRemove(stock)}
          >
            <strong>{stock.name}</strong>: {stock.ticker}
          </SimpleCell>
        ))}
      </div>
      <Button
        size="m"
        stretched
        onClick={onNext}
        disabled={selectedStocks.length === 0}
        style={{ marginTop: '16px' }}
      >
        Указать сумму вложений
      </Button>
    </>
  );
};

export default SelectedStocks;
