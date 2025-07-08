from sqlalchemy.orm import Session
from typing import List, Optional
from src.models import UserStocks, UserMoney
from src.schemas import Stocks, UserMoney as UserMoneySchema

def get_user_money(db: Session, vk_user_id: int) -> Optional[UserMoney]:
    """Получить информацию о деньгах пользователя"""
    return db.query(UserMoney).filter(UserMoney.vk_user_id == vk_user_id).first()

def create_or_update_user_money(db: Session, user_money: UserMoneySchema) -> UserMoney:
    """Создать или обновить информацию о деньгах пользователя"""
    db_user_money = get_user_money(db, user_money.vk_user_id)
    if db_user_money:
        # Обновляем существующую запись
        db_user_money.amount_of_money = user_money.amount_of_money
    else:
        # Создаем новую запись
        db_user_money = UserMoney(
            vk_user_id=user_money.vk_user_id,
            amount_of_money=user_money.amount_of_money
        )
        db.add(db_user_money)

    db.commit()
    db.refresh(db_user_money)
    return db_user_money

def get_user_stocks(db: Session, vk_user_id: int) -> List[UserStocks]:
    """Получить все акции пользователя"""
    return db.query(UserStocks).filter(UserStocks.vk_user_id == vk_user_id).all()

def create_user_stock(db: Session, stock: Stocks) -> UserStocks:
    """Создать новую акцию пользователя"""
    db_stock = UserStocks(
        vk_user_id=stock.vk_user_id,
        ticker=stock.ticker,
        stock_quantity=stock.stock_quantity
    )
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    return db_stock

def update_user_stock(db: Session, vk_user_id: int, ticker: str, quantity: int) -> Optional[UserStocks]:
    """Обновить количество акций пользователя"""
    db_stock = db.query(UserStocks).filter(
        UserStocks.vk_user_id == vk_user_id,
        UserStocks.ticker == ticker
    ).first()

    if db_stock:
        db_stock.stock_quantity = quantity
        db.commit()
        db.refresh(db_stock)

    return db_stock

def delete_user_stock(db: Session, vk_user_id: int, ticker: str) -> bool:
    """Удалить акцию пользователя"""
    db_stock = db.query(UserStocks).filter(
        UserStocks.vk_user_id == vk_user_id,
        UserStocks.ticker == ticker
    ).first()

    if db_stock:
        db.delete(db_stock)
        db.commit()
        return True
    return False

def clear_user_stocks(db: Session, vk_user_id: int) -> bool:
    """Очистить все акции пользователя"""
    deleted_count = db.query(UserStocks).filter(UserStocks.vk_user_id == vk_user_id).delete()
    db.commit()
    return deleted_count > 0

def save_user_portfolio(db: Session, vk_user_id: int, investment_amount: int, stocks_data: List[dict]) -> dict:
    """Сохранить весь портфель пользователя (деньги + акции)"""
    try:
        # Сохраняем сумму инвестиций
        user_money = UserMoneySchema(vk_user_id=vk_user_id, amount_of_money=investment_amount)
        create_or_update_user_money(db, user_money)

        # Очищаем старые акции
        clear_user_stocks(db, vk_user_id)

        # Добавляем новые акции (включая с количеством 0)
        for stock_data in stocks_data:
            stock = Stocks(
                vk_user_id=vk_user_id,
                ticker=stock_data['ticker'],
                stock_quantity=stock_data['quantity']
            )
            create_user_stock(db, stock)

        return {"success": True, "message": "Портфель сохранен успешно"}

    except Exception as e:
        db.rollback()
        return {"success": False, "message": f"Ошибка при сохранении: {str(e)}"}

def get_user_portfolio(db: Session, vk_user_id: int) -> dict:
    """Получить весь портфель пользователя"""
    user_money = get_user_money(db, vk_user_id)
    user_stocks = get_user_stocks(db, vk_user_id)

    stocks_list = []
    for stock in user_stocks:
        stocks_list.append({
            "ticker": stock.ticker,
            "quantity": stock.stock_quantity
        })

    return {
        "vk_user_id": vk_user_id,
        "investment_amount": user_money.amount_of_money if user_money else 0,
        "stocks": stocks_list
    }
