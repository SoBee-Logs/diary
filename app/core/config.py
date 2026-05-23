from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Sobee FastAPI"
    OPENAI_API_KEY: str = ""
    MYSQL_URL: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()