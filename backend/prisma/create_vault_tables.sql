-- HashiCorp Vault Integration - Database Tables
-- Run this SQL in SQLite to create the vault tables
-- Database: backend/prisma/dev.db

-- Table: vault_secrets
-- Stores encrypted secrets with AES-256-CBC encryption
CREATE TABLE IF NOT EXISTS vault_secrets (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    encrypted_value TEXT NOT NULL,
    iv TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    metadata TEXT,
    rotationPolicy TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_rotated DATETIME
);

CREATE INDEX IF NOT EXISTS idx_vault_secrets_key ON vault_secrets(key);
CREATE INDEX IF NOT EXISTS idx_vault_secrets_created_by ON vault_secrets(created_by);
CREATE INDEX IF NOT EXISTS idx_vault_secrets_last_rotated ON vault_secrets(last_rotated);

-- Table: app_roles
-- Stores authentication tokens for AI agents
CREATE TABLE IF NOT EXISTS app_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    token TEXT NOT NULL UNIQUE,
    policies TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_roles_name ON app_roles(name);
CREATE INDEX IF NOT EXISTS idx_app_roles_token ON app_roles(token);
CREATE INDEX IF NOT EXISTS idx_app_roles_expires_at ON app_roles(expires_at);

-- Table: vault_audit_logs
-- Logs all vault operations for compliance and security
CREATE TABLE IF NOT EXISTS vault_audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    mfa_verified INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_vault_audit_logs_user_id ON vault_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_audit_logs_action ON vault_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_vault_audit_logs_secret_key ON vault_audit_logs(secret_key);
CREATE INDEX IF NOT EXISTS idx_vault_audit_logs_timestamp ON vault_audit_logs(timestamp);

-- Verify tables created
SELECT 'Tables created successfully!' as status;
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'vault_%' OR name LIKE 'app_roles';
