"""
Production entrypoint: Serve the Flask app with Waitress (Windows-friendly).

Reads HOST/PORT from environment variables in this order:
- PORT or FLASK_RUN_PORT (default 5000)
- HOST or FLASK_RUN_HOST (default 0.0.0.0)

Usage:
  python run_waitress.py
"""
import os
from waitress import serve

# Import the Flask app instance
from app import app, maybe_start_telegram

HOST = os.environ.get('HOST') or os.environ.get('FLASK_RUN_HOST') or '0.0.0.0'
PORT = int(os.environ.get('PORT') or os.environ.get('FLASK_RUN_PORT') or 5000)
THREADS = int(os.environ.get('THREADS') or 8)

# Ensure Telegram thread starts if enabled
try:
    maybe_start_telegram()
except Exception:
    pass

if __name__ == '__main__':
    # waitress serve
    serve(app, host=HOST, port=PORT, threads=THREADS, ident='doctor-schedule')
