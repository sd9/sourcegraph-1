BEGIN;

ALTER TABLE lsif_uploads ADD COLUMN extensions TEXT[];
UPDATE lsif_uploads SET extensions = '{}';
ALTER TABLE lsif_uploads ALTER COLUMN extensions SET NOT NULL;

-- Recreate view with new column names
DROP VIEW lsif_dumps;
CREATE VIEW lsif_dumps AS SELECT u.*, u.finished_at as processed_at FROM lsif_uploads u WHERE state = 'completed';

COMMIT;
