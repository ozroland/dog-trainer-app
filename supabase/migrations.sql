-- ============================================
-- DogTrainerApp Database Migrations
-- ============================================
-- 
-- This file tracks all schema changes with version numbers.
-- Apply migrations in order when setting up a new environment.
--
-- MIGRATION PROCESS:
-- 1. Add new migrations at the bottom with incremented version number
-- 2. Run only the NEW migrations on existing databases
-- 3. For new databases, run ALL migrations in order
--
-- ============================================

-- Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- V001: Initial Schema
-- ============================================
-- Creates: profiles, dogs, lessons, progress

INSERT INTO schema_migrations (version, name) VALUES (1, 'initial_schema')
ON CONFLICT DO NOTHING;

-- See: schema.sql

-- ============================================
-- V002: Gamification
-- ============================================
-- Creates: achievements, dog_achievements, training_sessions

INSERT INTO schema_migrations (version, name) VALUES (2, 'gamification')
ON CONFLICT DO NOTHING;

-- See: gamification.sql

-- ============================================
-- V003: Walk Tracking
-- ============================================
-- Creates: walks, walk_events

INSERT INTO schema_migrations (version, name) VALUES (3, 'walk_tracking')
ON CONFLICT DO NOTHING;

-- See: walk_tracking.sql

-- ============================================
-- V004: Health Hub
-- ============================================
-- Creates: health_records, weight_logs

INSERT INTO schema_migrations (version, name) VALUES (4, 'health_hub')
ON CONFLICT DO NOTHING;

-- See: health_hub.sql

-- ============================================
-- V005: Calendar Events
-- ============================================
-- Creates: calendar_events

INSERT INTO schema_migrations (version, name) VALUES (5, 'calendar_events')
ON CONFLICT DO NOTHING;

-- See: calendar_events.sql

-- ============================================
-- V006: Photos
-- ============================================
-- Creates: photos table, storage policies

INSERT INTO schema_migrations (version, name) VALUES (6, 'photos')
ON CONFLICT DO NOTHING;

-- See: photos.sql

-- ============================================
-- V007: Hungarian Translations
-- ============================================
-- Adds: title_hu, description_hu columns to lessons/achievements

INSERT INTO schema_migrations (version, name) VALUES (7, 'hungarian_translations')
ON CONFLICT DO NOTHING;

-- See: add_hungarian_columns.sql, add_hungarian_translations.sql

-- ============================================
-- V008: Birthday Support
-- ============================================
-- Adds: birthday column to dogs

INSERT INTO schema_migrations (version, name) VALUES (8, 'birthday_support')
ON CONFLICT DO NOTHING;

-- See: add_birthday.sql

-- ============================================
-- V009: Cascade Deletes
-- ============================================
-- Fixes: proper cascade deletion for user accounts

INSERT INTO schema_migrations (version, name) VALUES (9, 'cascade_deletes')
ON CONFLICT DO NOTHING;

-- See: fix_cascade_delete.sql

-- ============================================
-- HELPER: Check current version
-- ============================================
-- SELECT MAX(version) as current_version FROM schema_migrations;

-- ============================================
-- HELPER: List all applied migrations
-- ============================================
-- SELECT * FROM schema_migrations ORDER BY version;
