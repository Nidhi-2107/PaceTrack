-- PaceTrack Database Migration: User Goals
-- Version: V4__create_goals_table.sql
-- Description: Creates user goals table for daily step/distance targets

CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(32) NOT NULL,
    target_value INTEGER NOT NULL CHECK (target_value > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_user_goal_type UNIQUE (user_id, goal_type)
);

CREATE INDEX IF NOT EXISTS idx_goals_user_type ON user_goals(user_id, goal_type);

