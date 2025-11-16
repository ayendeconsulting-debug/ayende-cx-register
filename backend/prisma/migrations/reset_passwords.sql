-- Reset all user passwords to Admin123!
-- This is the bcrypt hash for "Admin123!"
UPDATE "User" SET "passwordHash" = '$2a$10$YourHashHere' WHERE "isActive" = true;