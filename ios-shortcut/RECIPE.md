# SMS LocalBlast Shortcut — Step-by-Step Recipe

Create this shortcut in the **Shortcuts** app. Replace `YOUR_API_URL` and `YOUR_TOKEN` with your values.

---

## 1. Add variables (at the top)

- **Text** action: `YOUR_API_URL` (e.g. `https://api.example.com` or `http://192.168.1.100:3000`)
- **Text** action: `YOUR_TOKEN` (paste your JWT from login)

---

## 2. Claim next message

- **Get Contents of URL**
  - URL: `[API_URL]/api/messages/claim-next`
  - Method: **POST**
  - Headers: Add `Authorization` → `Bearer [YOUR_TOKEN]` (use "Select Variable" → your token)
  - Request Body: **JSON** → leave empty (or add `{}`)

---

## 3. Parse response

- **Get Dictionary from Input** (input = Contents of URL)
- **Get Dictionary Value**
  - Key: `message`
  - Get: `Value`

---

## 4. If message exists

- **If** (Dictionary Value is not empty)
  - **Get Dictionary Value** from message
    - Key: `id` → save as `MessageID`
    - Key: `to_phone` → save as `ToPhone`
    - Key: `body` → save as `Body`

  - **Send Message**
    - Recipients: `[ToPhone]`
    - Message: `[Body]`
    - Send: Immediately (or tap to send)

  - **Get Contents of URL** (report status)
    - URL: `[API_URL]/api/messages/[MessageID]/status`
    - Method: **PATCH**
    - Headers: `Authorization` → `Bearer [YOUR_TOKEN]`
    - Request Body: **JSON**
      - Key: `status` → Value: `sent`

---

## 5. Optional: add a loop

To poll repeatedly, wrap steps 2–4 in a **Repeat** (e.g. 5 times) with **Wait** (e.g. 30 seconds) between runs. Or use **Personal Automation** → Time of Day → Run this shortcut every N minutes.

---

## Notes

- **Send Message** sends via iMessage or SMS depending on the recipient.
- Store your token securely. Consider using **Ask for Input** (type: Password) if you prefer not to hardcode it.
- For automation, use **Personal Automation** in Shortcuts so the shortcut runs in the background on a schedule.
