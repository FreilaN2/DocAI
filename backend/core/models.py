from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, DECIMAL, TIMESTAMP, text
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    price = Column(DECIMAL(10, 2), default=0.00)
    max_docs_per_month = Column(Integer, default=3)
    has_ai_analysis = Column(Boolean, default=False)
    has_watermark = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(20))
    password_hash = Column(String(255), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), default=1)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
    
    plan = relationship("Plan")

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(500), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

class ProcessedDocument(Base):
    __tablename__ = "processed_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    apa_version = Column(String(10), nullable=False)
    download_url = Column(String(500))
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

class UserUsage(Base):
    __tablename__ = "user_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    month_year = Column(String(7), nullable=False) # '2024-04'
    docs_count = Column(Integer, default=0)
