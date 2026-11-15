-- Rollback Migration: 0001_deal_room_phase1_rollback.sql
-- Strictly drops ONLY the 6 newly created tables.

DROP TABLE IF EXISTS "deal_activity" CASCADE;
DROP TABLE IF EXISTS "deal_approvals" CASCADE;
DROP TABLE IF EXISTS "deal_terms_versions" CASCADE;
DROP TABLE IF EXISTS "deal_participants" CASCADE;
DROP TABLE IF EXISTS "deals" CASCADE;
DROP TABLE IF EXISTS "collaboration_requests" CASCADE;
