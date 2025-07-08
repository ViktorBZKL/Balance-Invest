import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy_utils import database_exists, create_database

from src.config import settings

# Определение базовой директории
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# URL базы данных PostgreSQL
DATABASE = settings.DATABASE

# Создание движка базы данных
engine = create_engine(DATABASE)

if not database_exists(engine.url):
    create_database(engine.url)

# Создание локальной сессии
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для декларативных классов
Base = declarative_base()

# Функция для получения сессии базы данных
def get_db():
    """Функция-генератор для получения сессии базы данных"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
