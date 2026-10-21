-- A daily, keyed hash of IP + browser, used only to count unique visitors.
-- The raw IP is never stored, and the cleanup job clears this after 30 days.
ALTER TABLE clicks ADD COLUMN visitor TEXT;
