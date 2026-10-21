-- Where a click came from, taken from ?src= on the link (e.g. /cv?src=linkedin).
ALTER TABLE clicks ADD COLUMN source TEXT;
