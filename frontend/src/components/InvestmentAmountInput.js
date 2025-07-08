import React from 'react';
import { FormItem, Input } from '@vkontakte/vkui';

const InvestmentAmountInput = ({ value, onChange, formatNumberWithSpaces }) => {
  const handleChange = (e) => {
    const inputValue = e.target.value;
    // Разрешаем только цифры и пробелы
    if (/^[\d\s]*$/.test(inputValue)) {
      const formattedValue = formatNumberWithSpaces(inputValue);
      onChange(formattedValue);
    }
  };

  return (
    <FormItem>
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Введите сумму в рублях"
        suffix="₽"
      />
    </FormItem>
  );
};

export default InvestmentAmountInput;
