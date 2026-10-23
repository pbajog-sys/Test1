"""Einstellungen als kleine JSON-Datei unter %APPDATA%\\TagesCheckin."""

from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, fields
from datetime import time
from pathlib import Path

from checkin_app import APP_NAME


def config_dir() -> Path:
    base = os.environ.get("APPDATA") or (Path.home() / ".config")
    return Path(base) / APP_NAME


def default_config_path() -> Path:
    return config_dir() / "settings.json"


@dataclass
class Settings:
    reminder_enabled: bool = True
    reminder_time: str = "20:30"  # HH:MM
    data_file: str = ""  # leer = Standardpfad, wird beim ersten Start gesetzt
    run_goal_minutes: int = 90  # Wochenziel Lauf, 0 = kein Ziel
    goal1_name: str = "Fokus 1"
    goal1_minutes: int = 180  # Wochenziel Fokusziel 1
    goal2_name: str = ""  # leer = Fokusziel 2 nicht genutzt
    goal2_minutes: int = 0

    def reminder_time_value(self) -> time:
        try:
            hh, mm = self.reminder_time.split(":")
            return time(int(hh), int(mm))
        except (ValueError, AttributeError):
            return time(20, 30)

    def active_goals(self) -> list[tuple[int, str, int]]:
        """(Slot, Name, Wochenziel) für die benannten Fokusziele (max. 2)."""
        goals = []
        if self.goal1_name.strip():
            goals.append((1, self.goal1_name.strip(), self.goal1_minutes))
        if self.goal2_name.strip():
            goals.append((2, self.goal2_name.strip(), self.goal2_minutes))
        return goals

    @classmethod
    def load(cls, path: Path) -> "Settings":
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return cls()
        known = {f.name: f.type for f in fields(cls)}
        defaults = cls()
        kwargs = {}
        for name in known:
            if name not in raw:
                continue
            value = raw[name]
            expected = type(getattr(defaults, name))
            if isinstance(value, expected) and not (expected is int and isinstance(value, bool)):
                kwargs[name] = value
        return cls(**kwargs)

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(asdict(self), indent=2, ensure_ascii=False), encoding="utf-8")
        os.replace(tmp, path)
