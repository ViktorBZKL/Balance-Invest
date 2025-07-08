import React, { useState } from 'react';
import { Button, Group, Header, SimpleCell } from '@vkontakte/vkui';
import { sendVKParamsToBackend, getVKParamsFromURL, getVKUserId, isVKApp } from '../utils/vkUtils';

const VKTestComponent = () => {
  const [vkData, setVkData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTestVKParams = async () => {
    setLoading(true);
    try {
      const data = await sendVKParamsToBackend();
      setVkData(data);
    } catch (error) {
      console.error('Ошибка:', error);
      setVkData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleShowURLParams = () => {
    const params = getVKParamsFromURL();
    setVkData({ url_params: params });
  };

  return (
    <Group>
      <Header mode="secondary">Тестирование VK интеграции</Header>

      <SimpleCell>
        VK App: {isVKApp() ? 'Да' : 'Нет'}
      </SimpleCell>

      <SimpleCell>
        VK User ID: {getVKUserId() || 'Не найден'}
      </SimpleCell>

      <Button
        size="m"
        stretched
        onClick={handleTestVKParams}
        disabled={loading}
        style={{ marginBottom: '8px' }}
      >
        {loading ? 'Отправка...' : 'Отправить VK параметры на бэкенд'}
      </Button>

      <Button
        size="m"
        stretched
        mode="secondary"
        onClick={handleShowURLParams}
        style={{ marginBottom: '8px' }}
      >
        Показать VK параметры из URL
      </Button>

      {vkData && (
        <Group>
          <Header mode="secondary">Результат:</Header>
          <div style={{
            padding: '12px',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            whiteSpace: 'pre-wrap'
          }}>
            {JSON.stringify(vkData, null, 2)}
          </div>
        </Group>
      )}
    </Group>
  );
};

export default VKTestComponent;
