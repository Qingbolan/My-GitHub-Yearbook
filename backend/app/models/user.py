from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    bio: Mapped[str | None] = mapped_column(Text)
    company: Mapped[str | None] = mapped_column(String(200))
    location: Mapped[str | None] = mapped_column(String(200))
    followers: Mapped[int] = mapped_column(Integer, default=0)
    following: Mapped[int] = mapped_column(Integer, default=0)
    public_repos: Mapped[int] = mapped_column(Integer, default=0)
    # GitHub Token (encrypted or hashed in production)
    github_token: Mapped[str | None] = mapped_column(String(500))
    token_type: Mapped[str | None] = mapped_column(String(50))  # 'classic' or 'fine-grained'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class YearbookStats(Base):
    __tablename__ = "yearbook_stats"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(100), index=True)
    year: Mapped[int] = mapped_column(Integer, index=True)

    # User profile info
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    bio: Mapped[str | None] = mapped_column(Text)
    company: Mapped[str | None] = mapped_column(String(200))
    location: Mapped[str | None] = mapped_column(String(200))
    followers: Mapped[int] = mapped_column(Integer, default=0)
    following: Mapped[int] = mapped_column(Integer, default=0)

    # Contribution stats
    total_contributions: Mapped[int] = mapped_column(Integer, default=0)
    total_commits: Mapped[int] = mapped_column(Integer, default=0)
    pull_requests: Mapped[int] = mapped_column(Integer, default=0)
    pull_request_reviews: Mapped[int] = mapped_column(Integer, default=0)
    issues: Mapped[int] = mapped_column(Integer, default=0)

    # Streak stats
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    active_days: Mapped[int] = mapped_column(Integer, default=0)

    # Repo stats
    repo_count: Mapped[int] = mapped_column(Integer, default=0)
    public_repo_count: Mapped[int] = mapped_column(Integer, default=0)
    private_repo_count: Mapped[int] = mapped_column(Integer, default=0)
    total_repo_count: Mapped[int] = mapped_column(Integer, default=0)

    # JSON data
    daily_contributions: Mapped[dict | None] = mapped_column(JSON)
    language_stats: Mapped[dict | None] = mapped_column(JSON)
    top_repos: Mapped[dict | None] = mapped_column(JSON)
    organizations: Mapped[dict | None] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class VisitLog(Base):
    """访问记录表"""
    __tablename__ = "visit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    # 被访问的用户
    target_username: Mapped[str] = mapped_column(String(100), index=True)
    target_year: Mapped[int] = mapped_column(Integer)
    # 访问者信息
    visitor_ip: Mapped[str | None] = mapped_column(String(50))
    visitor_fingerprint: Mapped[str | None] = mapped_column(String(64), index=True)  # SHA-256 hash
    visitor_country: Mapped[str | None] = mapped_column(String(100))
    visitor_city: Mapped[str | None] = mapped_column(String(100))
    visitor_lat: Mapped[float | None] = mapped_column()
    visitor_lng: Mapped[float | None] = mapped_column()
    visitor_user_agent: Mapped[str | None] = mapped_column(String(500))
    referer: Mapped[str | None] = mapped_column(String(500))
    # 时间
    visited_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class UserToken(Base):
    """用户 Token 存储表 (从前端传入)"""
    __tablename__ = "user_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    # Token 信息 (生产环境应加密存储)
    github_token: Mapped[str] = mapped_column(String(500))
    token_type: Mapped[str | None] = mapped_column(String(50))  # 'classic' or 'fine-grained'
    scopes: Mapped[str | None] = mapped_column(String(500))  # 逗号分隔的 scope 列表
    # 验证状态
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True)
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime)
    # 时间
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
