# БаланИнвест
Приложение для VK Mini Apps, с помощью которого можно рассчитать доли компаний, исходя из их капитализации, для своего инвестиционного портфеля. Приложение доступно здесь: https://vk.com/app53856554

### Инструкции
Для запуска приложения необходимо произвести следующие действия:

#### Backend
Создать файл .env и прописать в нем параметры аналогично .env.example:

```bash
POSTGRES_DB=database
POSTGRES_USER=user
POSTGRES_PASSWORD=password
```

После чего ввести в терминале команду: `docker compose up --build -d`

#### Frontend

**Важно:** Для работы VK Mini App требуется HTTPS-домен и настроенный прокси через nginx.

1. **Настройка переменных окружения**

   Создайте файл `frontend/.env` с указанием домена вашего API:
   ```bash
   REACT_APP_API_BASE_URL=https://your-domain.com/api
   ```

   Замените `your-domain.com` на ваш реальный домен с SSL-сертификатом.

2. **Настройка VK Mini App**

   В файлах `frontend/vk-tunnel-config.json` и `frontend/vk-hosting-config.json` укажите `app_id` вашего приложения из VK Mini Apps.

3. **Настройка Nginx**

   Убедитесь, что nginx настроен для проксирования API запросов:
   - Все запросы к `/api/` должны проксироваться на backend (порт 8000)
   - Статические файлы frontend должны обслуживаться с корня домена
   - Настроен SSL-сертификат (рекомендуется Let's Encrypt)

4. **Сборка и деплой**

   Выполните команды в папке `frontend/`:
   ```bash
   npm install
   npm run build
   npm run deploy
   ```
