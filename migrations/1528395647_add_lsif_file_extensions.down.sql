BEGIN;

-- Drop view dependent on new column
DROP VIEW lsif_dumps;

ALTER TABLE lsif_uploads DROP COLUMN extensions;

-- Recreate view with new column names
CREATE VIEW lsif_dumps AS SELECT u.*, u.finished_at as processed_at FROM lsif_uploads u WHERE state = 'completed';

COMMIT;
