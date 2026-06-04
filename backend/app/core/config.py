import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Traxpense 2.0"
    
    # Generate SQLite URL if DATABASE_URL is not provided or is invalid
    _db_url = os.environ.get("DATABASE_URL")
    if _db_url and _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
        
    DATABASE_URL: str = _db_url or "mysql+pymysql://root:@localhost:3306/traxpense"
    
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret-key")
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

settings = Settings()
