import os
from app import app, maybe_start_telegram

if __name__ == "__main__":
    # Ensure Telegram polling starts
    maybe_start_telegram()

    host = os.environ.get('WEB_SERVER_HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', os.environ.get('WEB_SERVER_PORT', 5000)))

    # Prefer eventlet/gevent if available for better SSE handling, else default
    use_eventlet = os.environ.get('FLASK_ASYNC', '0') in ('1','true','True')
    if use_eventlet:
        try:
            import eventlet  # type: ignore[reportMissingImports]
            eventlet.monkey_patch()
            from flask import Flask
            # Run with eventlet WSGI server
            eventlet.wsgi.server(eventlet.listen((host, port)), app)
        except Exception:
            # Fallback to built-in
            app.run(host=host, port=port)
    else:
        app.run(host=host, port=port)
