-- Database initialization script for CI/CD and Docker environments
-- Creates the main database for the SaaS platform

-- Create main database
CREATE DATABASE saasdb;

-- Connect to the database
\c saasdb;

-- Enable useful PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
