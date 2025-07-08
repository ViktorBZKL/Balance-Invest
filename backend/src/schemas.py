from pydantic import BaseModel
from typing import Optional, List

class Stocks(BaseModel):
    vk_user_id: int
    ticker: Optional[str] = None
    stock_quantity: Optional[int] = None

class UserMoney(BaseModel):
    vk_user_id: int
    amount_of_money: Optional[int] = None

class StockData(BaseModel):
    ticker: str
    quantity: int

class PortfolioSave(BaseModel):
    vk_user_id: int
    investment_amount: int
    stocks: List[StockData]

class PortfolioResponse(BaseModel):
    vk_user_id: int
    investment_amount: int
    stocks: List[StockData]

class SaveResponse(BaseModel):
    success: bool
    message: str