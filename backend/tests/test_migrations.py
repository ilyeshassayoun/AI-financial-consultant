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
    assert {
        "alembic_version",
        "users",
        "profile_snapshots",
        "refresh_token_sessions",
        "profile_events",
    }.issubset(tables)

    with sqlite3.connect(database_path) as connection:
        event_columns = {
            row[1] for row in connection.execute("PRAGMA table_info(profile_events)")
        }
        unique_indexes = {
            row[1]
            for row in connection.execute("PRAGMA index_list(profile_events)")
            if row[2]
        }
    assert {
        "profile_id",
        "user_id",
        "sequence_number",
        "delta_payload",
        "snapshot_checksum",
    }.issubset(event_columns)
    assert unique_indexes

    _run_alembic(database_path, "downgrade", "base")
    with sqlite3.connect(database_path) as connection:
        tables = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    assert "users" not in tables
    assert "profile_snapshots" not in tables
    assert "refresh_token_sessions" not in tables
    assert "profile_events" not in tables
