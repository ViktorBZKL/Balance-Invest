import React from 'react';
import { Button, Input } from '@vkontakte/vkui';

const StockQuantityEditor = ({
  stock,
  currentAmount,
  editingStock,
  setEditingStock,
  startHolding,
  stopHolding,
  handleDirectInput,
  maxShares
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Button
        size="s"
        mode="secondary"
        onMouseDown={() => startHolding(stock.ticker, -1)}
        onMouseUp={() => stopHolding(stock.ticker)}
        onMouseLeave={() => stopHolding(stock.ticker)}
        onTouchStart={() => startHolding(stock.ticker, -1)}
        onTouchEnd={() => stopHolding(stock.ticker)}
        disabled={currentAmount <= 0}
        style={{ minWidth: '32px' }}
      >
        −
      </Button>

      {editingStock === stock.ticker ? (
        <Input
          type="number"
          value={currentAmount || ''}
          max={maxShares}
          onChange={(e) => handleDirectInput(stock.ticker, e.target.value)}
          onBlur={() => setEditingStock(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setEditingStock(null);
            }
          }}
          style={{
            width: '60px',
            textAlign: 'center',
            fontSize: '14px',
            padding: '4px'
          }}
          autoFocus
        />
      ) : (
        <div
          onClick={() => setEditingStock(stock.ticker)}
          style={{
            minWidth: '60px',
            textAlign: 'center',
            padding: '6px 8px',
            border: '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#000',
            backgroundColor: '#f0f0f0',
            ':hover': { backgroundColor: '#e0e0e0' }
          }}
        >
          {currentAmount}
        </div>
      )}

      <Button
        size="s"
        mode="secondary"
        onMouseDown={() => startHolding(stock.ticker, 1)}
        onMouseUp={() => stopHolding(stock.ticker)}
        onMouseLeave={() => stopHolding(stock.ticker)}
        onTouchStart={() => startHolding(stock.ticker, 1)}
        onTouchEnd={() => stopHolding(stock.ticker)}
        disabled={currentAmount >= maxShares}
        style={{ minWidth: '32px' }}
      >
        +
      </Button>
    </div>
  );
};

export default StockQuantityEditor;
