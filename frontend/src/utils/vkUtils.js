import API from '../services/api';

/**
 * Извлекает VK параметры из URL
 */
export const getVKParamsFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const vkParams = {};

  // Извлекаем все VK параметры
  for (const [key, value] of urlParams.entries()) {
    if (key.startsWith('vk_') || key === 'sign') {
      vkParams[key] = value;
    }
  }

  return vkParams;
};

/**
 * Отправляет VK параметры на бэкенд
 */
export const sendVKParamsToBackend = async () => {
  try {
    const vkParams = getVKParamsFromURL();

    // Проверяем, есть ли vk_user_id
    if (!vkParams.vk_user_id) {
      console.warn('vk_user_id не найден в URL параметрах');
      return null;
    }

    const response = await API.validateVKParams(vkParams);

    return response;

  } catch (error) {
    console.error('Ошибка при отправке VK параметров:', error);
    throw error;
  }
};

/**
 * Получает только vk_user_id из URL
 */
export const getVKUserId = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('vk_user_id');
};

/**
 * Проверяет, запущено ли приложение в VK
 */
export const isVKApp = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('vk_user_id') && urlParams.has('vk_app_id');
};

/**
 * Сохраняет портфель пользователя на бэкенде
 */
export const saveUserPortfolio = async (vkUserId, investmentAmount, selectedStocks, currentHoldings) => {
  try {
    // Подготавливаем данные акций - сохраняем ВСЕ выбранные акции, включая с количеством 0
    const stocks = selectedStocks.map(stock => ({
      ticker: stock.ticker,
      quantity: currentHoldings[stock.ticker] || 0
    }));

    // Убираем пробелы из суммы инвестиций и преобразуем в число
    const amount = parseInt(investmentAmount.replace(/\s/g, '')) || 0;

    const portfolioData = {
      vk_user_id: parseInt(vkUserId),
      investment_amount: amount,
      stocks: stocks
    };

    const response = await API.savePortfolio(portfolioData);

    return response;

  } catch (error) {
    console.error('Ошибка при сохранении портфеля:', error);
    throw error;
  }
};

/**
 * Загружает сохраненный портфель пользователя с бэкенда
 */
export const loadUserPortfolio = async (vkUserId) => {
  try {
    const response = await API.getPortfolio(vkUserId);

    if (response) {
      return response;
    } else {
      return null;
    }

  } catch (error) {
    console.error('Ошибка при загрузке портфеля:', error);
    throw error;
  }
};
