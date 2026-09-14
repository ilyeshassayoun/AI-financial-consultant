import os
from pathlib import Path
import sqlite3
import subprocess
import sys


BACKEND_ROOT = Path(__file__).resolve().parents[1]


def _run_alembic(database_path: Path, command: str, revision: str) -> None:
    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite+aiosqlite:///{database_path.as_posix()}"
    subprocess.run(
        [sys.executable, "-m", "alembic", "-c", "alembic.ini", command, revision],
        cwd=BACKEND_ROOT,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )


def test_initial_migration_upgrades_and_rolls_back(tmp_path):
    database_path = tmp_path / "migration.db"
    _run_alembic(database_path, "upgrade", "head")

    with sqlite3.connect(database_path) as connection:
        tables = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    assert {"alembic_version", "users", "profile_snapshots", "refresh_token_sessions"}.issubset(tables)

    _run_alembic(database_path, "downgrade", "base")
    with sqlite3.connect(database_path) as connection:
        tables = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    assert "users" not in tables
    assert "profile_snapshots" not in tables
    assert "refresh_token_sessions" not in tables
