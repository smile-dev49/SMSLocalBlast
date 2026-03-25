# CodeCanyon Packaging

## Create the zip

```bash
cd sms-localblast
npm install
npm run build:frontend   # Build React landing (optional; server falls back to legacy if skipped)
npm run package:codecanyon
```

Output: `dist/sms-localblast-codecanyon.zip`

## What's included

- Source code (server, excel-addin, android, license-server, god-view)
- Web installer, admin dashboard, landing (React in `frontend/` or legacy `landing-web/`), demo, signup, legal
- iOS Shortcut configs
- Documentation (docs/manual.html)

## Excluded (secrets / build artifacts)

- `.env`, `config/installed.json`
- `node_modules`, `.git`
- `dist`, logs, IDE configs

## Before submission

1. **Android APK** — Build and add to zip if required:
   ```bash
   cd android && ./gradlew assembleRelease
   ```
   APK: `android/app/build/outputs/apk/release/app-release.apk`

2. **Excel manifest** — Update `excel-addin/manifest.xml` if needed:
   - `SourceLocation` and `IconUrl` use `localhost:3000` by default
   - Buyers replace with their deployed URL

3. **16:9 banner** — Create 590×300 px (or 1168×388 px) for the CodeCanyon listing

4. **Clean test data** — Ensure no real API keys or DB URLs in any checked-in files

## Testing

- Extract the zip and run `cd server && npm run bootstrap && npm run dev`
- Test web installer at `/install`
- Sideload Excel add-in and verify manifest
- Test Android app build
