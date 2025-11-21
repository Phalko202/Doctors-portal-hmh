Doctor Schedule Board (Minimal deps)

Quick Start (Windows)
---------------------
- Double‑click: `Run App (No Telegram).bat` to start the server locally.
   - Then open http://127.0.0.1:5000/display for the TV view
   - Admin: http://127.0.0.1:5000/ (login page creates default Admin/1234 if none exists)
- To run with Telegram, double‑click: `Run App (With Telegram).bat`
   - It will prompt for your bot token and group id, then start the app.
   - Logs go to `data/telegram.log`.
- For network access across hospital PCs, double‑click: `Run App (Network).bat`
   - Prints your LAN IP and URLs to open from other PCs/TVs.

If startup fails, install dependencies once:

```powershell
pip install -r requirements.txt
```

- Python 3.10+
- Third-party packages: Flask (required), eventlet (optional)

Run (Option A: main.py recommended)
1) Configure via environment variables (recommended). We no longer keep secrets in `config.py`.
   Use a `.env` file or set variables on the host. See sections below.
2) Windows PowerShell example:
   $env:CONFIG_PATH = "C:\Users\User\Documents\AAAA coding\mauroof sir project for Telegram stat hosting\telegram-tv-display btgpt5"
   $env:ENABLE_TELEGRAM = "true"  # start polling thread
   pip install -r requirements.txt
   python main.py
3) Open:
   - http://localhost:5000/display
   - http://localhost:5000/  (admin)

Run (Option B: flask run)
- A VS Code Task exists: "Run Flask app (eventlet)". This starts the server with FLASK_APP=app.py and also starts the Telegram thread automatically on first request.

Production hosting (Windows, recommended): Waitress + Scheduled Task
-------------------------------------------------------------------
Waitress is a robust WSGI server that runs well on Windows. This repo includes a production entrypoint and scripts.

1) Configure environment variables (.env or system-wide). See section above.
2) Install dependencies:

```powershell
pip install -r requirements.txt
```

3) Test locally in foreground:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-waitress.ps1 -Host "0.0.0.0" -Port 5000
```

4) Install as a Windows Scheduled Task (auto-start on boot):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-scheduled-task.ps1 -TaskName "DoctorSchedule" -WorkingDir "C:\\path\\to\\repo" -Port 5000 -Host "0.0.0.0"
```

This avoids shipping extra service wrappers and works on stock Windows Server. Optionally, you can place IIS/ARR in front as a reverse proxy to serve on port 80/443.

LAN-only hosting (inside hospital Wi‑Fi only)
--------------------------------------------
You can keep this service available only inside your hospital network (not the public internet):

1) Bind to the server’s LAN IP (optional):
   - Find your LAN IP (e.g., 192.168.1.50) and run the app with `-ListenHost 192.168.1.50` (or set `HOST` in `.env`).
   - The app will then listen only on that interface.

2) Restrict Windows Firewall to LAN only:
   - Create an inbound rule that allows TCP 5000 on the Private profile and only from the local subnet:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-firewall.ps1 -Port 5000 -Profile Private -RemoteAddress LocalSubnet
```

   - Alternatively, lock to a specific subnet range:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-firewall.ps1 -Port 5000 -RemoteAddress 192.168.0.0/16
```

3) Do NOT port‑forward this machine on your router. Without port‑forward, it’s not reachable from the internet.

4) (Optional) Use internal DNS: Create an A record like `schedule.hospital.local` pointing to the server’s LAN IP and use that URL on the TVs.

5) (Optional) IIS/ARR reverse proxy: If you prefer port 80/443 internally, publish only on the LAN IP with IIS URL Rewrite and keep bindings off Public profiles.

Open to all profiles (optional, for IT)
--------------------------------------
If your policy is to allow inbound on all Windows Firewall profiles for this server, use:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/open-firewall-all.ps1 -Port 5000
```

This opens TCP 5000 on Domain/Private/Public. Prefer restricting to LAN when possible.

Configuration via environment variables (production)
---------------------------------------------------
The app reads configuration from environment variables and also supports a `.env` file (loaded automatically). Prefer environment variables for production.

Create a `.env` from `.env.example` or set variables on the host:

- `SECRET_KEY` – required for session cookies (use a long random string)
- `FLASK_APP=app.py` – required for `flask run`
- `ADMIN_TOKEN` – optional admin override token
- `ENABLE_TELEGRAM` – `true/false` to enable Telegram bot
- `TELEGRAM_BOT_TOKEN` – bot token (required if Telegram enabled)
- `TELEGRAM_GROUP_ID` – numeric chat id to allowlist (required if Telegram enabled unless `TELEGRAM_ACCEPT_FROM_ANY=true`)
- `TELEGRAM_ACCEPT_FROM_ANY` – `true` to accept messages from any chat (not recommended)
- `TELEGRAM_CHAT_IDS` – additional allowed chat ids, comma separated

Windows helper script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-env.ps1 -EnableTelegram:$false
# Or with Telegram enabled
powershell -ExecutionPolicy Bypass -File scripts/setup-env.ps1 -EnableTelegram:$true -BotToken "xxxxx" -GroupId "-123456789"
```

Enable Telegram: step‑by‑step
------------------------------
1) Edit `.env` (or set env vars) with:

```
ENABLE_TELEGRAM=true
TELEGRAM_BOT_TOKEN=1234567890:ABCDEF_real_token
TELEGRAM_GROUP_ID=-123456789
```

2) Open a NEW terminal and start the app:

```
python -m flask run --host=0.0.0.0 --port=5000
```

3) Verify:
   - Admin: GET `/api/telegram/status` should show `enabled: true`, `running: true`.
   - Check `data/telegram.log` for polling logs.
   - If you change tokens while running, either POST `/api/telegram/restart` (admin) or restart the app.

How to get the group id
-----------------------
- Add @RawDataBot to your Telegram group, send any message, copy `chat.id` (e.g., `-123456789`). Remove the bot after if you like.

Configuration via environment variables (production)
---------------------------------------------------
The app reads configuration from environment variables and also supports a local `config.py` for development. Prefer environment variables for production.

Create a `.env` from `.env.example` or set variables on the host:

- SECRET_KEY – required for session cookies (use a long random string)
- FLASK_APP=app.py – required for `flask run`
- ADMIN_TOKEN – optional admin override token
- ENABLE_TELEGRAM – true/false to enable Telegram bot
- TELEGRAM_BOT_TOKEN – bot token (required if Telegram enabled)
- TELEGRAM_GROUP_ID – numeric chat id to allowlist (required if Telegram enabled unless TELEGRAM_ACCEPT_FROM_ANY=true)
- TELEGRAM_ACCEPT_FROM_ANY – true to accept messages from any chat (not recommended)
- TELEGRAM_CHAT_IDS – additional allowed chat ids, comma separated

Windows helper script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-env.ps1 -EnableTelegram:$false
# Or with Telegram enabled
powershell -ExecutionPolicy Bypass -File scripts/setup-env.ps1 -EnableTelegram:$true -BotToken "xxxxx" -GroupId "-123456789"
```

Notes
- Live updates use Server-Sent Events (SSE), with automatic polling fallback in the UI.
- Photos saved as uploaded, single current image per doctor id.
- To show LEAVE/SICK on display add ?showHidden=1 to URL.
- Telegram/debug logs are also persisted to data/telegram.log and surfaced in Admin > Telegram Logs.

Rich Telegram message format (multi-line)
----------------------------------------
You can send a single formatted message and the app will parse it into the display. You do not need to include the specialty in the message — the specialty is fixed when you add the doctor in Admin. The Designation line is optional.

Example message:

DATE: 17/09/2025
NAME: Dr. Asish
Designation: Orthopaedician
Starting time: 10:00
NO OF PATIENTS: 35 pts

Before break OPD- 10:00-11:00- 20 pts
BREAK- 11:00-12:00
After break OPD- 13:00-14:00- 15 pts

Rendering on display
- PATIENTS: 35 pts
- BEFORE BREAK OPD: 10:00-11:00 • 20
- BREAK: 11:00-12:00
- AFTER BREAK OPD: 13:00-14:00 • 15

Tips
- NAME is matched to an existing doctor (fuzzy). Ensure the doctor exists in Admin first.
- If Designation is omitted, the UI shows the stored specialty under the name.
- “NO OF PATIENTS” sets the total count for the day.
- Multiple breaks are supported with additional BREAK lines.
