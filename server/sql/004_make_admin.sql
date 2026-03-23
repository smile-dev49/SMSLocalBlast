-- Promote a user to admin. Replace 'admin@example.com' with the actual email.
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
