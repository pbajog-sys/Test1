"""Tray-Symbol, Menü und die abendliche Erinnerung."""

from __future__ import annotations

import sys
from datetime import date, datetime
from pathlib import Path

from PySide6.QtCore import QDir, QLocale, QLockFile, QPointF, QStandardPaths, Qt, QTimer, QUrl
from PySide6.QtGui import QAction, QColor, QDesktopServices, QIcon, QPainter, QPen, QPixmap
from PySide6.QtWidgets import QApplication, QMenu, QMessageBox, QSystemTrayIcon

from checkin_app import APP_NAME, APP_TITLE, autostart
from checkin_app.config import Settings, default_config_path
from checkin_app.dialogs import CheckinDialog, SettingsDialog, WeekDialog
from checkin_app.storage import StorageError, XlsxStore

REMINDER_CHECK_MS = 30_000


def make_icon() -> QIcon:
    icon = QIcon()
    for size in (16, 24, 32, 48, 64, 256):
        pm = QPixmap(size, size)
        pm.fill(Qt.transparent)
        p = QPainter(pm)
        p.setRenderHint(QPainter.Antialiasing)
        p.setPen(Qt.NoPen)
        p.setBrush(QColor("#2a7f8f"))
        p.drawEllipse(0, 0, size, size)
        pen = QPen(QColor("white"), max(2.0, size * 0.12), Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin)
        p.setPen(pen)
        p.drawPolyline([QPointF(size * 0.27, size * 0.52), QPointF(size * 0.44, size * 0.69),
                        QPointF(size * 0.74, size * 0.34)])
        p.end()
        icon.addPixmap(pm)
    return icon


def default_data_file() -> Path:
    docs = QStandardPaths.writableLocation(QStandardPaths.DocumentsLocation) or str(Path.home())
    return Path(docs) / APP_NAME / "checkin.xlsx"


class TrayApp:
    def __init__(self, app: QApplication, config_path: Path):
        self.app = app
        self.config_path = config_path
        self.settings = Settings.load(config_path)
        if not self.settings.data_file:
            self.settings.data_file = str(default_data_file())
            self.settings.save(config_path)
        self.store = XlsxStore(Path(self.settings.data_file))
        self._reminded_on: date | None = None
        self._open: dict[str, object] = {}

        self.tray = QSystemTrayIcon(make_icon())
        self.tray.setToolTip(APP_TITLE)
        menu = QMenu()
        self._add_action(menu, "Check-in jetzt", self.open_checkin, bold=True)
        self._add_action(menu, "Wochenansicht", self.open_week)
        menu.addSeparator()
        self._add_action(menu, "Excel-Datei öffnen", self.open_data_file)
        self._add_action(menu, "Einstellungen …", self.open_settings)
        menu.addSeparator()
        self._add_action(menu, "Beenden", app.quit)
        self.menu = menu  # Referenz halten
        self.tray.setContextMenu(menu)
        self.tray.activated.connect(self._on_activated)
        self.tray.messageClicked.connect(self.open_checkin)
        self.tray.show()

        self.timer = QTimer()
        self.timer.timeout.connect(self.check_reminder)
        self.timer.start(REMINDER_CHECK_MS)
        QTimer.singleShot(3000, self.check_reminder)

    @staticmethod
    def _add_action(menu: QMenu, text: str, slot, bold: bool = False) -> None:
        action = QAction(text, menu)
        if bold:
            font = action.font()
            font.setBold(True)
            action.setFont(font)
        action.triggered.connect(slot)
        menu.addAction(action)

    def _on_activated(self, reason) -> None:
        if reason in (QSystemTrayIcon.Trigger, QSystemTrayIcon.DoubleClick):
            self.open_checkin()

    def _show(self, key: str, factory) -> None:
        """Pro Fenstertyp höchstens ein offenes Fenster."""
        dlg = self._open.get(key)
        if dlg is not None and dlg.isVisible():
            dlg.raise_()
            dlg.activateWindow()
            return
        dlg = factory()
        dlg.setAttribute(Qt.WA_DeleteOnClose)
        dlg.destroyed.connect(lambda *_, d=dlg: self._open.get(key) is d and self._open.pop(key))
        self._open[key] = dlg
        dlg.show()
        dlg.raise_()
        dlg.activateWindow()

    # -- Menüaktionen ----------------------------------------------------------

    def open_checkin(self) -> None:
        def factory():
            dlg = CheckinDialog(self.store, self.settings)
            dlg.accepted.connect(self._refresh_week)
            return dlg

        self._show("checkin", factory)

    def _refresh_week(self) -> None:
        week = self._open.get("week")
        if week is not None:
            week.refresh()

    def open_week(self) -> None:
        self._show("week", lambda: WeekDialog(self.store, self.settings))

    def open_data_file(self) -> None:
        path = self.store.path
        target = path if path.exists() else path.parent
        if not target.exists():
            QMessageBox.information(None, APP_TITLE, "Noch keine Daten – die Datei entsteht beim ersten Check-in.")
            return
        QDesktopServices.openUrl(QUrl.fromLocalFile(str(target)))

    def open_settings(self) -> None:
        dlg = SettingsDialog(self.settings)
        if dlg.exec() != SettingsDialog.Accepted:
            return
        new = dlg.result_settings()
        if not new.data_file:
            new.data_file = str(default_data_file())
        self.settings = new
        self.settings.save(self.config_path)
        self.store = XlsxStore(Path(new.data_file))
        self._reminded_on = None  # neue Uhrzeit soll heute noch greifen
        if autostart.is_supported():
            try:
                autostart.set_enabled(dlg.wants_autostart())
            except OSError as exc:
                QMessageBox.warning(None, APP_TITLE, f"Autostart konnte nicht geändert werden:\n{exc}")
        # Offene Fenster mit alten Einstellungen schließen
        for d in list(self._open.values()):
            d.close()

    # -- Erinnerung ------------------------------------------------------------

    def check_reminder(self) -> None:
        s = self.settings
        today = date.today()
        if not s.reminder_enabled or self._reminded_on == today:
            return
        if datetime.now().time() < s.reminder_time_value():
            return
        try:
            done = self.store.get(today) is not None
        except StorageError:
            done = False
        self._reminded_on = today
        if not done:
            self.tray.showMessage(
                APP_TITLE,
                "Zeit für dein Check-in – dauert keine 30 Sekunden. Hier klicken zum Öffnen.",
                QSystemTrayIcon.Information,
                20_000,
            )


def main() -> int:
    QLocale.setDefault(QLocale(QLocale.German, QLocale.Germany))
    app = QApplication(sys.argv)
    app.setApplicationName(APP_NAME)
    app.setApplicationDisplayName(APP_TITLE)
    app.setQuitOnLastWindowClosed(False)
    app.setWindowIcon(make_icon())

    lock = QLockFile(QDir.temp().filePath(f"{APP_NAME}.lock"))
    if not lock.tryLock(100):
        QMessageBox.information(None, APP_TITLE, "Tages-Check-in läuft bereits (Symbol im Infobereich).")
        return 0

    if not QSystemTrayIcon.isSystemTrayAvailable():
        QMessageBox.critical(None, APP_TITLE, "Kein Infobereich (System Tray) verfügbar.")
        return 1

    tray_app = TrayApp(app, default_config_path())  # noqa: F841 – muss am Leben bleiben
    return app.exec()
