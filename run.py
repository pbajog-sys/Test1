"""Einstiegspunkt für PyInstaller und für den direkten Start (python run.py)."""

from checkin_app.app import main

if __name__ == "__main__":
    raise SystemExit(main())
