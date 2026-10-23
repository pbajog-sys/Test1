from datetime import date, timedelta

from checkin_app.config import Settings
from checkin_app.stats import GREEN, NONE, RED, YELLOW, days_elapsed, summarize_week, traffic_light
from checkin_app.storage import Entry

MON = date(2026, 10, 19)


def test_traffic_light():
    assert traffic_light(100, 100) == GREEN
    assert traffic_light(70, 100) == YELLOW
    assert traffic_light(69, 100) == RED
    assert traffic_light(0, 0) == NONE


def test_days_elapsed_counts_today_only_when_recorded():
    assert days_elapsed(MON, MON, False) == 0
    assert days_elapsed(MON, MON, True) == 1
    assert days_elapsed(MON, MON + timedelta(days=3), False) == 3
    assert days_elapsed(MON, MON + timedelta(days=10), False) == 7
    assert days_elapsed(MON, MON - timedelta(days=1), True) == 0


def test_week_summary():
    s = Settings(run_goal_minutes=70, goal1_name="Python", goal1_minutes=140,
                 goal2_name="Englisch", goal2_minutes=0)
    entries = {
        MON - timedelta(days=7): Entry(day=MON - timedelta(days=7), weight=83.0),
        MON - timedelta(days=6): Entry(day=MON - timedelta(days=6), weight=84.0),
        MON: Entry(day=MON, weight=82.0, movement="Lauf", run_minutes=30, goal1_minutes=20),
        MON + timedelta(days=1): Entry(day=MON + timedelta(days=1), weight=83.0, goal1_minutes=20),
        MON + timedelta(days=6): Entry(day=MON + timedelta(days=6), movement="Lauf", run_minutes=40),
        MON + timedelta(days=7): Entry(day=MON + timedelta(days=7), movement="Lauf", run_minutes=500),
    }
    w = summarize_week(entries, MON + timedelta(days=2), s, today=date(2026, 11, 1))
    assert w.start == MON and w.complete
    assert w.weight_avg == 82.5 and w.weight_count == 2
    assert w.prev_weight_avg == 83.5 and w.weight_delta == -1.0
    run, g1, g2 = w.goals
    assert (run.label, run.actual, run.light) == ("Lauf", 70, GREEN)
    assert (g1.label, g1.actual, g1.light) == ("Python", 40, RED)
    assert (g2.label, g2.light) == ("Englisch", NONE)

    # laufende Woche: Mittwoch, heute noch nicht erfasst -> Soll = 2/7
    w = summarize_week(entries, MON, s, today=MON + timedelta(days=2))
    assert w.goals[1].expected == 40 and w.goals[1].light == GREEN
