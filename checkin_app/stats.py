"""Wochenauswertung (Mo–So): Gewichtsmittel, Trend, Summen und Ampel."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from checkin_app.config import Settings
from checkin_app.storage import Entry

GREEN, YELLOW, RED, NONE = "grün", "gelb", "rot", "–"

# Ab diesem Anteil des Solls gibt es Gelb statt Rot.
YELLOW_RATIO = 0.7


def week_start(day: date) -> date:
    return day - timedelta(days=day.weekday())


def days_elapsed(start: date, today: date, today_recorded: bool) -> int:
    """Wie viele Tage der Woche zählen schon fürs Soll.

    Der heutige Tag zählt erst, wenn er erfasst ist – sonst wäre man
    morgens schon "im Rückstand".
    """
    end = start + timedelta(days=6)
    if today > end:
        return 7
    if today < start:
        return 0
    return (today - start).days + (1 if today_recorded else 0)


def traffic_light(actual: int, expected: float) -> str:
    if expected <= 0:
        return NONE
    if actual >= expected:
        return GREEN
    if actual >= YELLOW_RATIO * expected:
        return YELLOW
    return RED


@dataclass
class GoalStatus:
    label: str
    actual: int
    target: int  # Wochenziel
    expected: float  # Soll bis heute (anteilig)
    light: str


@dataclass
class WeekSummary:
    start: date
    days: list[Entry | None]  # Mo..So
    weight_avg: float | None
    weight_count: int
    prev_weight_avg: float | None
    goals: list[GoalStatus]
    complete: bool  # Woche ist vorbei

    @property
    def end(self) -> date:
        return self.start + timedelta(days=6)

    @property
    def weight_delta(self) -> float | None:
        if self.weight_avg is None or self.prev_weight_avg is None:
            return None
        return self.weight_avg - self.prev_weight_avg


def _weight_avg(entries: dict[date, Entry], start: date) -> tuple[float | None, int]:
    weights = [
        e.weight
        for i in range(7)
        if (e := entries.get(start + timedelta(days=i))) is not None and e.weight is not None
    ]
    if not weights:
        return None, 0
    return sum(weights) / len(weights), len(weights)


def summarize_week(entries: dict[date, Entry], start: date, settings: Settings, today: date) -> WeekSummary:
    start = week_start(start)
    days = [entries.get(start + timedelta(days=i)) for i in range(7)]
    present = [e for e in days if e is not None]

    elapsed = days_elapsed(start, today, today in entries)

    def status(label: str, actual: int, target: int) -> GoalStatus:
        target = max(0, target)
        expected = target * elapsed / 7
        return GoalStatus(label, actual, target, expected, traffic_light(actual, expected))

    goals = [status("Lauf", sum(e.counted_run_minutes for e in present), settings.run_goal_minutes)]
    for slot, name, target in settings.active_goals():
        attr = "goal1_minutes" if slot == 1 else "goal2_minutes"
        goals.append(status(name, sum(getattr(e, attr) for e in present), target))

    avg, count = _weight_avg(entries, start)
    prev_avg, _ = _weight_avg(entries, start - timedelta(days=7))
    return WeekSummary(
        start=start,
        days=days,
        weight_avg=avg,
        weight_count=count,
        prev_weight_avg=prev_avg,
        goals=goals,
        complete=today > start + timedelta(days=6),
    )
