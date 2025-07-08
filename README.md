# БаланИнвест
Приложение для VK Mini Apps, с помощью которого можно рассчитать доли компаний, исходя из их капитализации, для своего инвестиционного портфеля.

### Инструкции
#### Backend
- `python3 -m venv venv`
- `. venv/bin/activate` или `.\venv\Scripts\activate.bat`
- `pip install -r requirements.txt`
- `uvicorn src.main:app --reload --host 0.0.0.0 --port 8000` (обязательно находясь внутри папки backend)

#### Frontend
- `npm install`
- `npm start`

- `npm run tunnel`