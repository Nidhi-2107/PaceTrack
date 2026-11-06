-- PaceTrack Database Migration: Activities, Waypoints, and Daily Steps
-- Version: V3__create_activities_and_steps_tables.sql
-- Description: Creates activities, GPS route waypoints, and daily step records with offline sync idempotency

-- 1. Activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(128) UNIQUE,
    activity_type VARCHAR(32) NOT NULL,
    title VARCHAR(120) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
    distance_meters DOUBLE PRECISION NOT NULL CHECK (distance_meters >= 0),
    avg_pace_seconds_per_km DOUBLE PRECISION NOT NULL DEFAULT 0,
    calories_burned INTEGER NOT NULL DEFAULT 0 CHECK (calories_burned >= 0),
    step_count INTEGER NOT NULL DEFAULT 0 CHECK (step_count >= 0),
    privacy_level VARCHAR(32) NOT NULL DEFAULT 'PRIVATE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activities_user_start_time ON activities(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_type ON activities(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_idempotency ON activities(idempotency_key);

-- 2. Activity Waypoints table (GPS track points)
CREATE TABLE IF NOT EXISTS activity_waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION,
    speed_mps DOUBLE PRECISION,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uk_activity_waypoint_seq UNIQUE (activity_id, sequence_order)
);

CREATE INDEX IF NOT EXISTS idx_waypoints_activity_seq ON activity_waypoints(activity_id, sequence_order ASC);

-- 3. Daily Step Records table
CREATE TABLE IF NOT EXISTS daily_step_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    step_count INTEGER NOT NULL DEFAULT 0 CHECK (step_count >= 0),
    distance_meters DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (distance_meters >= 0),
    calories_burned INTEGER NOT NULL DEFAULT 0 CHECK (calories_burned >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_daily_steps_user_date UNIQUE (user_id, record_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_steps_user_date ON daily_step_records(user_id, record_date DESC);

