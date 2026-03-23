# SMS LocalBlast — iOS Shortcut

Use the **Shortcuts** app (iOS 15+) to poll the API and send SMS from your iPhone. Scan the QR code or follow the recipe below.

## Quick setup

1. Open **Shortcuts** on your iPhone.
2. Create a new shortcut and add the actions from [RECIPE.md](RECIPE.md).
3. Set your **API URL** and **token** (from login) in the shortcut variables.
4. Run the shortcut manually, or add a **Personal Automation** to run it on a schedule (e.g. every 2 minutes).

## QR code

Open [qr.html](../ios-shortcut/qr.html) in a browser to display a QR code that links to this setup guide. Embed this page in your landing site.

## API flow

1. **POST** `/api/messages/claim-next` with `Authorization: Bearer <token>`
2. Parse `message` from the JSON response
3. If `message` exists: send via **Send Message** action
4. **PATCH** `/api/messages/<id>/status` with `{"status":"sent"}`

## Requirements

- iOS 15 or later
- Shortcuts app (built-in)
- API URL (e.g. `https://yourserver.com` or `http://YOUR_IP:3000`)
- JWT token from `POST /api/auth/login`
