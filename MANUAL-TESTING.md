# SMS LocalBlast — Manual Testing Guide

Step-by-step checklist for testing the full platform before release.

---

## 0. Prerequisites

- [ ] Node.js 18+ installed
- [ ] A [Supabase](https://supabase.com) account
- [ ] Optional: Postman, curl, or similar for API tests

---

## 1. Database (Supabase)

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run these in order:

   | File | Purpose |
   |------|---------|
   | `server/sql/001_initial.sql` | `users`, `devices`, `messages` tables |
   | `server/sql/002_claim_next_message.sql` | Queue claim function |
   | `server/sql/003_disable_rls_for_api.sql` | Optional — if RLS blocks API |
   | `server/sql/005_licenses_and_global_settings.sql` | Optional — for licensing |
   | `server/sql/006_claim_with_device.sql` | Optional — multi-device |
   | `server/sql/007_api_keys.sql` | Optional — API key manager |

3. Copy from Supabase **Settings → API**:
   - **Project URL** (e.g. `https://xxxx.supabase.co`)
   - **service_role** key (keep secret)

---

## 2. Main Server Setup

```bash
cd server
npm run bootstrap
```

1. Edit `server/.env`:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key
   - `JWT_SECRET` = generate with `openssl rand -hex 32`

2. Start server:
   ```bash
   npm run dev
   ```

3. **Health check:**
   - Open **http://localhost:3000/api/health**
   - Expect: `{"ok":true,...}` or similar

---

## 3. Web Installer (Fresh Install)

> If `config/installed.json` exists, delete it first to test the installer.

1. Open **http://localhost:3000/install**
2. **Step 1 — Database:**
   - Enter Supabase URL and Service Role Key
   - Click **Next**
3. **Step 2 — Branding:**
   - Edit site name, support email, primary color
   - Click **Next**
4. **Step 3 — Admin:**
   - Enter admin email and password (min 8 chars)
   - Click **Install**
5. Expect success message.
6. Verify `server/config/installed.json` exists.
7. Refresh `/install` — should show "Already installed" or redirect.

---

## 4. Auth & Messages API (Smoke Test)

Use Postman, curl, or browser console.

### 4a. Register

```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{"email":"test@example.com","password":"password123","terms_accepted":true}
```

- [ ] Returns 200 with `token` and user info
- [ ] Without `terms_accepted: true` → expect error

### 4b. Login

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{"email":"test@example.com","password":"password123"}
```

- [ ] Returns 200 with `token`
- [ ] Wrong password → 401

### 4c. Enqueue Message

```http
POST http://localhost:3000/api/messages
Authorization: Bearer <token_from_login>
Content-Type: application/json

{"to_phone":"+15551234567","body":"Hello from LocalBlast"}
```

- [ ] Returns 200 with message id
- [ ] Without token → 401

### 4d. Claim Next Message (device simulation)

```http
POST http://localhost:3000/api/messages/claim-next
Authorization: Bearer <token_from_login>
Content-Type: application/json

{}
```

- [ ] Returns claimed message or empty array

### 4e. Update Message Status

```http
PATCH http://localhost:3000/api/messages/<id>/status
Authorization: Bearer <token_from_login>
Content-Type: application/json

{"status":"sent"}
```

- [ ] Returns 200

---

## 5. Admin Dashboard

1. Open **http://localhost:3000/admin**
2. Sign in with the **admin** account you created (installer or SQL `UPDATE users SET role = 'admin'`).
3. Check:
   - [ ] Stats / overview loads
   - [ ] Users list (if you have users)
   - [ ] API Keys — create, list, delete (if 007 ran)
   - [ ] Brand settings — change site name, color; save
   - [ ] Server health shows green
   - [ ] "Check for updates" works (or shows no update)

---

## 6. Public Pages

| URL | What to verify |
|-----|----------------|
| **http://localhost:3000/** | Landing page loads; hero, calculator, FAQ |
| **http://localhost:3000/demo** | Demo works; "Send demo blast" → progress bar → pitch popup |
| **http://localhost:3000/signup** | Signup form loads; "I agree to Terms" checkbox; submit registers |
| **http://localhost:3000/docs** | Manual loads; sections readable |
| **http://localhost:3000/privacy** | Privacy Policy loads |
| **http://localhost:3000/terms** | Terms of Service loads |

---

## 7. Brand & API

1. **Brand (public):**
   - `GET http://localhost:3000/api/brand`
   - Returns site_name, support_email, primary_color
2. **API key auth** (if 007 ran):
   - Create an API key in admin
   - `POST /api/messages` with `Authorization: Bearer sk_xxx`
   - [ ] Works same as JWT

---

## 8. License Server (Optional)

If you use licensing:

1. Create a **second** Supabase project for license server
2. Run `005_licenses_and_global_settings.sql` there
3. Add a test license: `INSERT INTO licenses (purchase_code, buyer_username, status) VALUES ('test-code', 'buyer', 'active');`
4. `cd license-server`, copy `.env.example` → `.env`, set Supabase URL + key
5. Set `LICENSE_SERVER_URL` and `PURCHASE_CODE` in main server `.env`
6. Restart main server
7. [ ] Server starts (license valid)
8. Open **http://localhost:3001/god-view** (set `GOD_VIEW_SECRET` in license-server `.env`)
9. [ ] God View shows stats, licenses, revoke works

---

## 9. Excel Add-in

1. Add the add-in manifest (see `excel-addin/` docs)
2. Open Excel → Insert → Office Add-ins → Upload manifest
3. [ ] Add-in loads
4. [ ] Can log in and send from sheet (needs real server + phone for full flow)

---

## 10. iOS Shortcut

1. Open **http://localhost:3000/ios-shortcut**
2. [ ] QR code and instructions load
3. (Optional) Scan with iPhone and run Shortcut

---

## 11. Quick Regression Checklist

After changes, re-run:

- [ ] Health: `GET /api/health`
- [ ] Install flow (delete `config/installed.json` first)
- [ ] Register → Login → Post message → Claim → Update status
- [ ] Admin login, API keys, brand
- [ ] Landing, demo, signup, docs, privacy, terms

---

## Common Issues

| Issue | Fix |
|-------|-----|
| "violates row-level security" | Run `003_disable_rls_for_api.sql` or use service_role key |
| Installer returns 403 | `config/installed.json` exists — delete to re-test |
| No admin access | Run `UPDATE users SET role = 'admin' WHERE email = 'your@email.com'` in Supabase |
| License server blocks start | Unset `LICENSE_SERVER_URL` and `PURCHASE_CODE` in main `.env` to skip |
