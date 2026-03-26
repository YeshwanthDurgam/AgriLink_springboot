ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(320),
    ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_notifications_status_retry ON notifications(status, retry_count);
