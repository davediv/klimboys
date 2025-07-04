-- Add activity log table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS activity_log (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	action TEXT NOT NULL,
	entity_type TEXT,
	entity_id TEXT,
	metadata TEXT,
	ip_address TEXT,
	user_agent TEXT,
	created_at INTEGER NOT NULL,
	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);