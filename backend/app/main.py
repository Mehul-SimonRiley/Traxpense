from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Try to auto-create tables on startup, but do not crash the server if DB is offline
    try:
        from app.db.base import Base
        from app.db.database import engine
        
        # Import models to register them on Base metadata
        from app.models.user import User
        from app.models.category import Category
        from app.models.transaction import Transaction
        from app.models.budget import Budget
        from app.models.settings import Settings
        from app.models.email_verification import EmailVerification
        
        Base.metadata.create_all(bind=engine)
        print("Database tables initialized successfully.")
    except Exception as e:
        print(f"WARNING: Could not connect to database on startup. Please ensure your database server is running. Error: {e}")
    yield

# Import routers
from app.api.routes import auth, users, budgets, categories, transactions, settings_route, dashboard, reports, insights

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["budgets"])
app.include_router(settings_route.router, prefix="/api/settings", tags=["settings"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(insights.router, prefix="/api/insights", tags=["insights"])

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}
