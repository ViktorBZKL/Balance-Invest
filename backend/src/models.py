from sqlalchemy import Column, Integer, String, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from src.database import Base

class UserMoney(Base):
    """
    Модель для хранения суммы вложений.
    """
    __tablename__ = "user_money"
    vk_user_id = Column(BigInteger, primary_key=True)
    amount_of_money = Column(BigInteger, nullable=True)

    # Связь с UserStocks
    user_stocks = relationship("UserStocks", back_populates="user_money")

class UserStocks(Base):
    """
    Модель для хранения акций пользователя.
    """
    __tablename__ = "user_stocks"
    id = Column(Integer, primary_key=True, autoincrement=True)
    vk_user_id = Column(BigInteger, ForeignKey("user_money.vk_user_id"), nullable=False)
    ticker = Column(String, nullable=True)
    stock_quantity = Column(BigInteger, nullable=True)

    # Связь с UserMoney
    user_money = relationship("UserMoney", back_populates="user_stocks")
