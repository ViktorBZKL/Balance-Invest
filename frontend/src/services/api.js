import axios from 'axios';
import API_CONFIG from '../config/api';

// Создаем единый API клиент
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API сервис - все запросы к backend в одном месте
export const API = {
  // Получить список всех акций
  getStocks: async () => {
    try {
      const response = await apiClient.get('/stocks');
      return response.data;
    } catch (error) {
      throw new Error(`Не удалось загрузить данные об акциях: ${error.message}`);
    }
  },

  // Получить дивиденды по тикеру
  getDividends: async (ticker) => {
    try {
      const response = await apiClient.get(`/stocks/dividends/${ticker}`);
      return response.data || 0;
    } catch (error) {
      console.warn(`Не удалось получить дивиденды для ${ticker}:`, error);
      return 0;
    }
  },

  // Валидация VK параметров
  validateVKParams: async (vkParams) => {
    try {
      const queryString = new URLSearchParams(vkParams).toString();
      const response = await apiClient.get(`/vk/user?${queryString}`);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка валидации VK параметров: ${error.message}`);
    }
  },

  // Сохранить портфель пользователя
  savePortfolio: async (portfolioData) => {
    try {
      const response = await apiClient.post('/portfolio/save', portfolioData);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка при сохранении портфеля: ${error.message}`);
    }
  },

  // Получить портфель пользователя
  getPortfolio: async (vkUserId) => {
    try {
      const response = await apiClient.get(`/portfolio/${vkUserId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // Портфель не найден
      }
      throw new Error(`Ошибка при загрузке портфеля: ${error.message}`);
    }
  },
};

export default API;
