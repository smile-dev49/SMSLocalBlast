# SMS LocalBlast Android Gateway

Android app that polls the API for pending messages, sends them via the device's native SMS, and reports status.

## Requirements

- Android Studio (Arctic Fox or newer)
- Android 9+ (API 28+)
- Device/emulator with SMS capability (real device for actual sending)

## Setup

1. Open **Android Studio** → **Open** → select the `android` folder.
2. Wait for Gradle sync.
3. Edit `app/src/main/res/values/config.xml` (or build.gradle) to set your API base URL if needed.
4. For **emulator** testing with local server: use `http://10.0.2.2:3000` (10.0.2.2 = host machine localhost).
5. For **real device** on same Wi‑Fi: use `http://YOUR_PC_IP:3000` (e.g. `http://192.168.1.100:3000`).
6. Build → Run on device/emulator.

## Usage

1. **Login**: Enter API URL, email, password → **Sign in**.
2. **Start**: Tap **Start gateway** to begin polling.
3. The app polls `POST /api/messages/claim-next` every 15 seconds.
4. When a message is claimed, it sends via `SmsManager` and calls `PATCH /api/messages/:id/status` with `"sent"`.
5. **Multi-device**: Run the app on multiple phones with the same account — each gets different messages (load balancing). Devices register automatically; active devices show in the admin dashboard.
6. Messages with `media_url` are attempted as MMS; on most devices this falls back to SMS (image skipped) unless the app is the default messaging app.
7. Tap **Stop gateway** to stop polling.

## Permissions

- `INTERNET` — API calls
- `SEND_SMS` — send text messages
- `READ_EXTERNAL_STORAGE` (API ≤32) / `READ_MEDIA_IMAGES` (API 33+) — for MMS image handling
- `FOREGROUND_SERVICE` — keep polling when app is in background (optional)

## API base URL

- Emulator: `http://10.0.2.2:3000`
- Real device (same network): `http://<your-computer-ip>:3000`
