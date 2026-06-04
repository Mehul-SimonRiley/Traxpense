from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, Text, Date, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db.base import Base

class Settings(Base):
    __tablename__ = 'settings'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('user.id'), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    date_of_birth = mapped_column(Date, nullable=True)
    occupation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location: Mapped[str | None] = mapped_column(String(100), nullable=True)
    profile_picture: Mapped[str | None] = mapped_column(String(200), nullable=True)
    two_factor_enabled: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    login_notifications: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    session_timeout: Mapped[int | None] = mapped_column(Integer, nullable=True)
    language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    date_format: Mapped[str | None] = mapped_column(String(20), nullable=True)
    time_format: Mapped[str | None] = mapped_column(String(10), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    primary_currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    currency_display: Mapped[str | None] = mapped_column(String(10), nullable=True)
    decimal_separator: Mapped[str | None] = mapped_column(String(1), nullable=True)
    thousands_separator: Mapped[str | None] = mapped_column(String(1), nullable=True)
    decimal_places: Mapped[int | None] = mapped_column(Integer, nullable=True)
    show_currency_symbol: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    email_notifications = mapped_column(JSON, nullable=True)
    push_notifications = mapped_column(JSON, nullable=True)
    notification_frequency: Mapped[str | None] = mapped_column(String(20), nullable=True)
    quiet_hours = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user: Mapped["User"] = relationship("User", back_populates="settings")
