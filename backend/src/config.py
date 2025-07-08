import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).parent.parent.parent
ENV_FILE_PATH = ROOT_DIR / ".env"

class Settings(BaseSettings):
    DATABASE: str

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH)
    )


settings = Settings()