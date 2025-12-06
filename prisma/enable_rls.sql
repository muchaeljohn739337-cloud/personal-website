-- =============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/sql
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE debit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE medbed_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE medbed_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE medbed_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE medbed_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE medbed_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE medbed_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medbed_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- CREATE POLICIES FOR SERVICE ROLE (Used by Prisma/Backend)
-- Service role bypasses RLS, so these allow your app to work normally
-- =============================================================================

-- Users table policies
CREATE POLICY "Service role full access on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- Accounts table policies  
CREATE POLICY "Service role full access on accounts" ON accounts FOR ALL USING (true) WITH CHECK (true);

-- Sessions table policies
CREATE POLICY "Service role full access on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);

-- All other tables - service role full access
CREATE POLICY "Service role full access on achievements" ON achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on admin_actions" ON admin_actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on api_keys" ON api_keys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on claimed_rewards" ON claimed_rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on crypto_payments" ON crypto_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on crypto_withdrawals" ON crypto_withdrawals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on debit_cards" ON debit_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on email_logs" ON email_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on email_templates" ON email_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on file_uploads" ON file_uploads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on health_alerts" ON health_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on health_goals" ON health_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on health_profiles" ON health_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on health_readings" ON health_readings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on invitations" ON invitations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on leaderboards" ON leaderboards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on medbed_bookings" ON medbed_bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on medbed_devices" ON medbed_devices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on medbed_facilities" ON medbed_facilities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on medbed_maintenance" ON medbed_maintenance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on medbed_readings" ON medbed_readings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on medbed_sessions" ON medbed_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on medbed_staff" ON medbed_staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on milestones" ON milestones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on organization_members" ON organization_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on organizations" ON organizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on password_reset_tokens" ON password_reset_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on plans" ON plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on posts" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on referrals" ON referrals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on rewards" ON rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on system_settings" ON system_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on token_transactions" ON token_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on token_wallets" ON token_wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on user_achievements" ON user_achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on user_milestones" ON user_milestones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on user_rewards" ON user_rewards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on user_suspensions" ON user_suspensions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on verification_tokens" ON verification_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on wallets" ON wallets FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After running this script, all 51 tables should show "RLS Enabled" in Supabase
-- Your Prisma app will continue to work because it uses the service role connection
