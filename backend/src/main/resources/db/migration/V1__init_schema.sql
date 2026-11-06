-- PaceTrack Initial Database Schema Baseline
-- Version: V1__init_schema.sql
-- Description: Baseline migration for PaceTrack modular monolith

-- Extensions (UUID generation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Baseline system metadata table to verify database connectivity and migration execution
CREATE TABLE IF NOT EXISTS system_metadata (
    id VARCHAR(64) PRIMARY KEY,
    key_name VARCHAR(128) NOT NULL UNIQUE,
    key_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO system_metadata (id, key_name, key_value)
VALUES ('meta_init_001', 'system_status', 'INITIALIZED')
ON CONFLICT (key_name) DO NOTHING;
