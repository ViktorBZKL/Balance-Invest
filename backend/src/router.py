from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from typing import Optional

from src.init import cmc_client
from src.database import get_db
from src.schemas import PortfolioSave, PortfolioResponse, SaveResponse
from src.crud import save_user_portfolio, get_user_portfolio

moex_router = APIRouter(
    prefix="/stocks"
)

vk_router = APIRouter(
    prefix="/vk"
)

# Роутер для работы с портфелем пользователя
portfolio_router = APIRouter(
    prefix="/portfolio"
)


@moex_router.get("")
async def get_stocks():
    return await cmc_client.get_stocks()


@moex_router.get("/{ticker}")
async def get_stock(ticker: str):
    return await cmc_client.get_stock(ticker)

@moex_router.get("/dividends/{ticker}")
async def get_dividends(ticker: str):
    return await cmc_client.get_dividends(ticker)

@vk_router.get("/user")
async def get_vk_user_info(request: Request):
    """
    Получение информации о пользователе VK из query параметров
    """
    query_params = dict(request.query_params)

    vk_user_id = query_params.get("vk_user_id")

    if not vk_user_id:
        return {"error": "vk_user_id not found in query parameters"}

    print(f"Получен запрос для пользователя VK с ID: {vk_user_id}")

    return vk_user_id


@portfolio_router.post("/save", response_model=SaveResponse)
async def save_portfolio(portfolio: PortfolioSave, db: Session = Depends(get_db)):
    """
    Сохранение портфеля пользователя (сумма инвестиций + выбранные акции)
    """
    # Преобразуем данные акций в нужный формат
    stocks_data = []
    for stock in portfolio.stocks:
        stocks_data.append({
            "ticker": stock.ticker,
            "quantity": stock.quantity
        })

    result = save_user_portfolio(db, portfolio.vk_user_id, portfolio.investment_amount, stocks_data)
    return result

@portfolio_router.get("/{vk_user_id}", response_model=PortfolioResponse)
async def get_portfolio(vk_user_id: int, db: Session = Depends(get_db)):
    """
    Получение сохраненного портфеля пользователя
    """
    portfolio_data = get_user_portfolio(db, vk_user_id)

    # Преобразуем в нужный формат
    stocks = []
    for stock_data in portfolio_data["stocks"]:
        stocks.append({
            "ticker": stock_data["ticker"],
            "quantity": stock_data["quantity"]
        })

    return PortfolioResponse(
        vk_user_id=portfolio_data["vk_user_id"],
        investment_amount=portfolio_data["investment_amount"],
        stocks=stocks
    )