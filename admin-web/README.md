# SMS LocalBlast Admin Dashboard

Web UI for admin users. Served at `/admin` when the server is running.

## Features

- **Dashboard**: User count, message stats (total, pending, sent, failed)
- **Users**: List all users with email, role, created date
- **Server health**: Display of `/api/health` response

## Access

1. Promote a user to admin in Supabase:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
   ```
2. Start the server: `cd server && npm run dev`
3. Open http://localhost:3000/admin
4. Sign in with your admin account
