import React from 'react';
import { AppRoot, ConfigProvider } from '@vkontakte/vkui';
import StockMenu from './components/StockMenu';
import VKTestComponent from './components/VKTestComponent';
import '@vkontakte/vkui/dist/vkui.css';

export default function App() {
  // Показываем тестовый компонент VK, если в URL есть параметр ?test=vk
  const showVKTest = new URLSearchParams(window.location.search).get('test') === 'vk';

  return (
    <ConfigProvider>
      <AppRoot>
        {showVKTest ? <VKTestComponent /> : <StockMenu id="main" />}
      </AppRoot>
    </ConfigProvider>
  );
}
