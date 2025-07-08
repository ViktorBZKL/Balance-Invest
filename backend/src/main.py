from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.router import moex_router, vk_router, portfolio_router
from src.models import UserMoney, UserStocks
from src.database import engine, Base

app = FastAPI()

# Создание всех таблиц в базе данных
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(moex_router)
app.include_router(vk_router)
app.include_router(portfolio_router)
