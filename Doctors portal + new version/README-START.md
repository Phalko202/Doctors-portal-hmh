# One-line start command (PowerShell)

Use this command in Windows PowerShell from the project folder to start the app with Telegram enabled:

```powershell
$env:ENABLE_TELEGRAM='true'; $env:TELEGRAM_BOT_TOKEN='7818849417:AAEqh9mBNxV02C_ZgR_7EbZiVSkWNkbLCg8'; $env:TELEGRAM_GROUP_ID='-4971636946'; python run_waitress.py
```

Notes:
- Make sure you run this inside the project directory (same folder as `run_waitress.py`).
- To stop the app, press Ctrl+C in the same PowerShell window.
- If you prefer to disable Telegram for a run, omit the three `$env:` variables and run only `python run_waitress.py`.
