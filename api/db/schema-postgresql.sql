-- ============================================
-- TRE CHATBOT ANALYTICS DATABASE SCHEMA
-- PostgreSQL-specific version
-- ============================================

-- Order Set Configurations
CREATE TABLE IF NOT EXISTS order_sets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    question_order INTEGER[], -- PostgreSQL array type
    created_at TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- Question Definitions (for reference)
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    type VARCHAR(50),
    options JSONB,
    validation JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(255) PRIMARY KEY,
    order_set_id VARCHAR(50) REFERENCES order_sets(id) ON DELETE SET NULL,
    user_info JSONB,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    completion_percentage DECIMAL(5,2),
    total_time_ms INTEGER,
    messages JSONB,
    metadata JSONB,
    question_answers JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Question Events
CREATE TABLE IF NOT EXISTS question_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES chat_sessions(id),
    order_set_id VARCHAR(50),
    question_id INTEGER,
    question_index INTEGER,
    event_type VARCHAR(50) NOT NULL, -- 'started', 'answered', 'skipped'
    answer TEXT,
    time_to_answer_ms INTEGER,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Drop-off Points
CREATE TABLE IF NOT EXISTS dropoff_points (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL REFERENCES chat_sessions(id),
    order_set_id VARCHAR(50),
    question_id INTEGER,
    question_index INTEGER,
    completion_at_dropoff DECIMAL(5,2),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_order_set ON chat_sessions(order_set_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_events_session ON question_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_order_set ON question_events(order_set_id);
CREATE INDEX IF NOT EXISTS idx_events_question ON question_events(question_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON question_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON question_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_dropoff_order_set ON dropoff_points(order_set_id);
CREATE INDEX IF NOT EXISTS idx_dropoff_timestamp ON dropoff_points(timestamp);

