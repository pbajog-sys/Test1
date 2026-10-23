"""Die drei Fenster: Check-in, Wochenansicht, Einstellungen."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from pathlib import Path

from PySide6.QtCore import QDate, QRegularExpression, Qt, QTime
from PySide6.QtGui import QRegularExpressionValidator
from PySide6.QtWidgets import (
    QButtonGroup, QCheckBox, QDateEdit, QDialog, QDialogButtonBox, QFileDialog,
    QFormLayout, QGridLayout, QGroupBox, QHBoxLayout, QHeaderView, QLabel,
    QLineEdit, QMessageBox, QPushButton, QRadioButton, QSpinBox, QTableWidget,
    QTableWidgetItem, QTimeEdit, QVBoxLayout, QWidget,
)

from checkin_app import APP_TITLE, autostart
from checkin_app.config import Settings
from checkin_app.stats import GREEN, RED, YELLOW, summarize_week, week_start
from checkin_app.storage import MOVEMENTS, Entry, FileLockedError, StorageError, XlsxStore

LIGHT_COLORS = {GREEN: "#2e9d4f", YELLOW: "#e0a800", RED: "#d23c3c"}
WEEKDAYS = ("Mo", "Di", "Mi", "Do", "Fr", "Sa", "So")


def _fmt_num(value: float, digits: int = 1) -> str:
    return f"{value:.{digits}f}".replace(".", ",")


def _minutes_spin(maximum: int = 1440) -> QSpinBox:
    spin = QSpinBox()
    spin.setRange(0, maximum)
    spin.setSingleStep(5)
    spin.setSuffix(" min")
    spin.setAccelerated(True)
    spin.setMaximumWidth(120)
    return spin


def show_storage_error(parent: QWidget, exc: Exception) -> None:
    if isinstance(exc, FileLockedError):
        text = ("Die Datei ist gerade in Excel (oder einem anderen Programm) geöffnet.\n"
                "Bitte dort schließen und noch einmal versuchen.")
    else:
        text = str(exc)
    QMessageBox.warning(parent, APP_TITLE, text)


# --------------------------------------------------------------------------
# Check-in
# --------------------------------------------------------------------------

class CheckinDialog(QDialog):
    def __init__(self, store: XlsxStore, settings: Settings, parent=None):
        super().__init__(parent)
        self.store = store
        self.settings = settings
        self._existing: Entry | None = None
        self.setWindowTitle(APP_TITLE)
        self.setWindowFlag(Qt.WindowStaysOnTopHint, True)

        form = QFormLayout()
        form.setLabelAlignment(Qt.AlignRight)

        self.date_edit = QDateEdit(QDate.currentDate())
        self.date_edit.setCalendarPopup(True)
        self.date_edit.setDisplayFormat("ddd, dd.MM.yyyy")
        self.date_edit.setMaximumDate(QDate.currentDate())
        self.date_edit.dateChanged.connect(self._load_day)
        form.addRow("Tag:", self.date_edit)

        self.weight = QLineEdit()
        self.weight.setPlaceholderText("optional, z. B. 82,4")
        self.weight.setValidator(QRegularExpressionValidator(QRegularExpression(r"^\d{0,3}([.,]\d{0,2})?$")))
        self.weight.setMaximumWidth(140)
        form.addRow("Gewicht (kg):", self.weight)

        move_row = QHBoxLayout()
        self.move_group = QButtonGroup(self)
        self.move_buttons: dict[str, QRadioButton] = {}
        for i, name in enumerate(MOVEMENTS):
            btn = QRadioButton(name)
            self.move_group.addButton(btn, i)
            self.move_buttons[name] = btn
            move_row.addWidget(btn)
        self.run_minutes = _minutes_spin(600)
        self.run_minutes.setEnabled(False)
        move_row.addWidget(self.run_minutes)
        move_row.addStretch()
        self.move_group.idToggled.connect(self._movement_changed)
        form.addRow("Bewegung:", move_row)

        self.goal_spins: dict[int, QSpinBox] = {}
        goals = settings.active_goals()
        if goals:
            for slot, name, _target in goals:
                spin = _minutes_spin()
                self.goal_spins[slot] = spin
                form.addRow(f"Lernzeit {name}:", spin)
        else:
            hint = QLabel("Keine Fokusziele benannt – siehe Einstellungen.")
            hint.setStyleSheet("color: gray")
            form.addRow("Lernzeit:", hint)

        self.note = QLineEdit()
        self.note.setPlaceholderText("optional")
        form.addRow("Notiz:", self.note)

        self.status = QLabel()
        self.status.setStyleSheet("color: gray")

        buttons = QDialogButtonBox(QDialogButtonBox.Save | QDialogButtonBox.Cancel)
        buttons.button(QDialogButtonBox.Save).setText("Speichern")
        buttons.button(QDialogButtonBox.Cancel).setText("Abbrechen")
        buttons.accepted.connect(self._save)
        buttons.rejected.connect(self.reject)

        layout = QVBoxLayout(self)
        layout.addLayout(form)
        layout.addWidget(self.status)
        layout.addWidget(buttons)

        self._load_day(self.date_edit.date())
        self.weight.setFocus()

    def _movement_changed(self, button_id: int, checked: bool) -> None:
        if checked:
            is_run = MOVEMENTS[button_id] == "Lauf"
            self.run_minutes.setEnabled(is_run)
            if is_run:
                self.run_minutes.setFocus()
                self.run_minutes.selectAll()

    def _load_day(self, qdate: QDate) -> None:
        day = qdate.toPython()
        try:
            entry = self.store.get(day)
        except StorageError as exc:
            show_storage_error(self, exc)
            entry = None
        self._existing = entry
        e = entry or Entry(day=day)
        self.weight.setText("" if e.weight is None else _fmt_num(e.weight))
        self.move_buttons[e.movement].setChecked(True)
        self.run_minutes.setValue(e.run_minutes)
        self.run_minutes.setEnabled(e.movement == "Lauf")
        for slot, spin in self.goal_spins.items():
            spin.setValue(e.goal1_minutes if slot == 1 else e.goal2_minutes)
        self.note.setText(e.note)
        self.status.setText("Für diesen Tag gibt es schon einen Eintrag – Speichern überschreibt ihn."
                            if entry else "")

    def _save(self) -> None:
        day = self.date_edit.date().toPython()
        text = self.weight.text().strip().replace(",", ".")
        weight = None
        if text:
            try:
                weight = float(text)
            except ValueError:
                weight = -1
            if not 20 <= weight <= 400:
                QMessageBox.warning(self, APP_TITLE, "Bitte ein Gewicht zwischen 20 und 400 kg eingeben.")
                self.weight.setFocus()
                return

        movement = MOVEMENTS[self.move_group.checkedId()]
        old = self._existing or Entry(day=day)
        entry = Entry(
            day=day,
            weight=weight,
            movement=movement,
            run_minutes=self.run_minutes.value() if movement == "Lauf" else 0,
            # Nicht angezeigte Fokusziele behalten ihren bisherigen Wert.
            goal1_name=old.goal1_name,
            goal1_minutes=old.goal1_minutes,
            goal2_name=old.goal2_name,
            goal2_minutes=old.goal2_minutes,
            note=self.note.text().strip(),
            recorded_at=datetime.now(),
        )
        for slot, name, _target in self.settings.active_goals():
            if slot == 1:
                entry.goal1_name, entry.goal1_minutes = name, self.goal_spins[1].value()
            else:
                entry.goal2_name, entry.goal2_minutes = name, self.goal_spins[2].value()

        try:
            self.store.save(entry)
        except StorageError as exc:
            show_storage_error(self, exc)
            return
        self.accept()


# --------------------------------------------------------------------------
# Wochenansicht
# --------------------------------------------------------------------------

class WeekDialog(QDialog):
    def __init__(self, store: XlsxStore, settings: Settings, parent=None):
        super().__init__(parent)
        self.store = store
        self.settings = settings
        self.start = week_start(date.today())
        self.setWindowTitle(f"{APP_TITLE} – Woche")
        self.resize(560, 470)

        nav = QHBoxLayout()
        prev_btn = QPushButton("◀")
        next_btn = QPushButton("▶")
        today_btn = QPushButton("Diese Woche")
        for b in (prev_btn, next_btn):
            b.setFixedWidth(36)
        prev_btn.clicked.connect(lambda: self._shift(-7))
        next_btn.clicked.connect(lambda: self._shift(7))
        today_btn.clicked.connect(self._this_week)
        self.title = QLabel()
        self.title.setAlignment(Qt.AlignCenter)
        self.title.setStyleSheet("font-weight: bold; font-size: 11pt")
        nav.addWidget(prev_btn)
        nav.addWidget(self.title, 1)
        nav.addWidget(next_btn)
        nav.addWidget(today_btn)

        weight_box = QGroupBox("Gewicht (Mittel Mo–So)")
        self.weight_label = QLabel()
        QVBoxLayout(weight_box).addWidget(self.weight_label)

        goals_box = QGroupBox("Wochenziele")
        self.goals_grid = QGridLayout(goals_box)
        self.goals_grid.setColumnStretch(1, 1)

        self.table = QTableWidget(7, 5)
        self.table.setHorizontalHeaderLabels(["Tag", "Gewicht", "Bewegung", "Lernen", "Notiz"])
        self.table.verticalHeader().setVisible(False)
        self.table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.table.setSelectionMode(QTableWidget.NoSelection)
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(4, QHeaderView.Stretch)

        layout = QVBoxLayout(self)
        layout.addLayout(nav)
        layout.addWidget(weight_box)
        layout.addWidget(goals_box)
        layout.addWidget(self.table, 1)

        self.refresh()

    def _shift(self, days: int) -> None:
        self.start += timedelta(days=days)
        self.refresh()

    def _this_week(self) -> None:
        self.start = week_start(date.today())
        self.refresh()

    def refresh(self) -> None:
        try:
            entries = self.store.load_all()
        except StorageError as exc:
            show_storage_error(self, exc)
            entries = {}
        today = date.today()
        s = summarize_week(entries, self.start, self.settings, today)
        kw = s.start.isocalendar()[1]
        self.title.setText(f"KW {kw}  ·  {s.start:%d.%m.} – {s.end:%d.%m.%Y}")

        # Gewicht
        if s.weight_avg is None:
            text = "Keine Gewichtswerte in dieser Woche."
        else:
            text = f"<b>{_fmt_num(s.weight_avg)} kg</b> (aus {s.weight_count} Wert{'en' if s.weight_count != 1 else ''})"
            delta = s.weight_delta
            if delta is None:
                text += "  ·  Vorwoche: keine Werte"
            else:
                arrow = "→" if abs(delta) < 0.05 else ("↑" if delta > 0 else "↓")
                sign = "+" if delta > 0 else ""
                text += (f"  ·  Vorwoche {_fmt_num(s.prev_weight_avg)} kg  ·  "
                         f"<b>{arrow} {sign}{_fmt_num(delta)} kg</b>")
        self.weight_label.setText(text)

        # Ziele mit Ampel
        while self.goals_grid.count():
            item = self.goals_grid.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        running = s.start <= today <= s.end
        for row, g in enumerate(s.goals):
            dot = QLabel()
            dot.setFixedSize(16, 16)
            color = LIGHT_COLORS.get(g.light, "#bbbbbb")
            dot.setStyleSheet(f"background:{color}; border-radius:8px")
            name = QLabel(f"<b>{g.label}</b>")
            if g.target <= 0:
                detail = f"{g.actual} min  (kein Wochenziel gesetzt)"
            else:
                pct = round(100 * g.actual / g.target)
                detail = f"{g.actual} / {g.target} min  ({pct} %)"
                if running:
                    detail += f"  ·  Soll bis heute: {round(g.expected)} min"
            light = QLabel(g.light)
            self.goals_grid.addWidget(dot, row, 0)
            self.goals_grid.addWidget(name, row, 1)
            self.goals_grid.addWidget(QLabel(detail), row, 2)
            self.goals_grid.addWidget(light, row, 3)

        # Tage
        for i, e in enumerate(s.days):
            day = s.start + timedelta(days=i)
            cells = [f"{WEEKDAYS[i]} {day:%d.%m.}"]
            if e is None:
                cells += ["", "", "", ""]
            else:
                move = e.movement
                if e.movement == "Lauf" and e.run_minutes:
                    move += f" {e.run_minutes} min"
                cells += [
                    "" if e.weight is None else _fmt_num(e.weight),
                    move,
                    f"{e.learn_minutes} min" if e.learn_minutes else "",
                    e.note,
                ]
            for col, value in enumerate(cells):
                self.table.setItem(i, col, QTableWidgetItem(value))


# --------------------------------------------------------------------------
# Einstellungen
# --------------------------------------------------------------------------

class SettingsDialog(QDialog):
    def __init__(self, settings: Settings, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"{APP_TITLE} – Einstellungen")
        s = settings

        reminder_box = QGroupBox("Erinnerung")
        rf = QFormLayout(reminder_box)
        self.reminder_on = QCheckBox("Abends per Windows-Benachrichtigung erinnern")
        self.reminder_on.setChecked(s.reminder_enabled)
        t = s.reminder_time_value()
        self.reminder_time = QTimeEdit(QTime(t.hour, t.minute))
        self.reminder_time.setDisplayFormat("HH:mm")
        self.reminder_on.toggled.connect(self.reminder_time.setEnabled)
        self.reminder_time.setEnabled(s.reminder_enabled)
        rf.addRow(self.reminder_on)
        rf.addRow("Uhrzeit:", self.reminder_time)

        goals_box = QGroupBox("Wochenziele")
        gf = QFormLayout(goals_box)
        self.run_goal = _minutes_spin(3000)
        self.run_goal.setValue(s.run_goal_minutes)
        gf.addRow("Lauf pro Woche:", self.run_goal)
        self.g1_name = QLineEdit(s.goal1_name)
        self.g1_name.setPlaceholderText("leer = nicht genutzt")
        self.g1_min = _minutes_spin(5000)
        self.g1_min.setValue(s.goal1_minutes)
        self.g2_name = QLineEdit(s.goal2_name)
        self.g2_name.setPlaceholderText("leer = nicht genutzt")
        self.g2_min = _minutes_spin(5000)
        self.g2_min.setValue(s.goal2_minutes)
        for label, name, spin in (("Fokusziel 1:", self.g1_name, self.g1_min),
                                  ("Fokusziel 2:", self.g2_name, self.g2_min)):
            row = QHBoxLayout()
            row.addWidget(name, 1)
            row.addWidget(QLabel("pro Woche"))
            row.addWidget(spin)
            gf.addRow(label, row)

        file_box = QGroupBox("Datei und Start")
        ff = QFormLayout(file_box)
        self.data_file = QLineEdit(s.data_file)
        browse = QPushButton("…")
        browse.setFixedWidth(32)
        browse.clicked.connect(self._browse)
        row = QHBoxLayout()
        row.addWidget(self.data_file, 1)
        row.addWidget(browse)
        ff.addRow("Excel-Datei:", row)
        hint = QLabel("Eine vorhandene Datei wird beim Wechsel nicht verschoben.")
        hint.setStyleSheet("color: gray")
        ff.addRow("", hint)
        self.autostart = QCheckBox("Beim Windows-Start automatisch starten")
        self.autostart.setEnabled(autostart.is_supported())
        self.autostart.setChecked(autostart.is_enabled())
        ff.addRow(self.autostart)

        buttons = QDialogButtonBox(QDialogButtonBox.Save | QDialogButtonBox.Cancel)
        buttons.button(QDialogButtonBox.Save).setText("Speichern")
        buttons.button(QDialogButtonBox.Cancel).setText("Abbrechen")
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)

        layout = QVBoxLayout(self)
        for w in (reminder_box, goals_box, file_box):
            layout.addWidget(w)
        layout.addWidget(buttons)

    def _browse(self) -> None:
        path, _ = QFileDialog.getSaveFileName(
            self, "Excel-Datei wählen", self.data_file.text(), "Excel-Arbeitsmappe (*.xlsx)",
            options=QFileDialog.DontConfirmOverwrite,
        )
        if path:
            if not path.lower().endswith(".xlsx"):
                path += ".xlsx"
            self.data_file.setText(str(Path(path)))

    def result_settings(self) -> Settings:
        return Settings(
            reminder_enabled=self.reminder_on.isChecked(),
            reminder_time=self.reminder_time.time().toString("HH:mm"),
            data_file=self.data_file.text().strip(),
            run_goal_minutes=self.run_goal.value(),
            goal1_name=self.g1_name.text().strip(),
            goal1_minutes=self.g1_min.value(),
            goal2_name=self.g2_name.text().strip(),
            goal2_minutes=self.g2_min.value(),
        )

    def wants_autostart(self) -> bool:
        return self.autostart.isChecked()
