import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./yearbook.db")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
