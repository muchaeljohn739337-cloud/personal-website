import { NextResponse } from 'next/server';
import { hash, compare } from 'bcryptjs';

import { prisma } from '@/lib/prismaClient';

// One-time database initialization endpoint
// DELETE THIS FILE AFTER SETUP!
// SECURITY: This endpoint is disabled in production
export async function GET(request: Request) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production. Use scripts/create-admin.ts instead.' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // List all users
    if (action === 'list') {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
        },
      });
      return NextResponse.json({ users });
    }

    // Demote OAuth user to regular USER
    if (action === 'demote') {
      const email = searchParams.get('email');
      if (email) {
        await prisma.user.updateMany({
          where: { email: email.toLowerCase() },
          data: { role: 'USER' },
        });
        return NextResponse.json({ success: true, message: `Demoted ${email} to USER` });
      }
    }

    // Change admin password
    if (action === 'changepass') {
      const newPassword = searchParams.get('newpass');
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }
      const hashedPassword = await hash(newPassword, 12);
      await prisma.user.updateMany({
        where: { email: 'admin@advanciapayledger.com' },
        data: { password: hashedPassword },
      });
      return NextResponse.json({
        success: true,
        message: 'Admin password changed successfully. Please delete this endpoint after use!',
      });
    }

    // Create password_entries table
    if (action === 'migrate') {
      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS password_entries (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            site_name TEXT NOT NULL,
            site_url TEXT,
            username TEXT,
            password TEXT NOT NULL,
            notes TEXT,
            category TEXT DEFAULT 'other',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_password_entries_user_id ON password_entries(user_id)`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_password_entries_category ON password_entries(category)`;
        return NextResponse.json({ success: true, message: 'Password entries table created' });
      } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
      }
    }

    // Admin: View all passwords (for recovery)
    if (action === 'passwords') {
      const email = searchParams.get('email');
      let passwords;
      if (email) {
        passwords = await prisma.$queryRaw`
          SELECT pe.*, u.email as user_email, u.name as user_name
          FROM password_entries pe
          JOIN users u ON pe.user_id = u.id
          WHERE u.email = ${email}
          ORDER BY pe.created_at DESC
        `;
      } else {
        passwords = await prisma.$queryRaw`
          SELECT pe.*, u.email as user_email, u.name as user_name
          FROM password_entries pe
          JOIN users u ON pe.user_id = u.id
          ORDER BY pe.created_at DESC
        `;
      }
      return NextResponse.json({ passwords });
    }

    // Admin: Delete a password entry
    if (action === 'deletepass') {
      const id = searchParams.get('id');
      if (id) {
        await prisma.$executeRaw`DELETE FROM password_entries WHERE id = ${id}`;
        return NextResponse.json({ success: true, message: 'Password deleted' });
      }
    }

    // Run all migrations for new tables
    if (action === 'migrate-all') {
      const results: string[] = [];
      try {
        // Analytics Events
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS analytics_events (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            event_type TEXT NOT NULL,
            event_name TEXT NOT NULL,
            event_value TEXT,
            user_id TEXT,
            session_id TEXT,
            page_url TEXT,
            page_title TEXT,
            referrer TEXT,
            user_agent TEXT,
            ip_address TEXT,
            country TEXT,
            city TEXT,
            device TEXT,
            browser TEXT,
            os TEXT,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        results.push('analytics_events created');

        // Error Logs
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS error_logs (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            error_type TEXT NOT NULL,
            error_code TEXT,
            message TEXT NOT NULL,
            stack_trace TEXT,
            source TEXT,
            user_id TEXT,
            request_url TEXT,
            request_method TEXT,
            request_body TEXT,
            severity TEXT DEFAULT 'ERROR',
            resolved BOOLEAN DEFAULT FALSE,
            resolved_at TIMESTAMP,
            resolved_by TEXT,
            resolution TEXT,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        results.push('error_logs created');

        // AI Jobs
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS ai_jobs (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            job_type TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            priority INT DEFAULT 5,
            task_description TEXT NOT NULL,
            input_data JSONB,
            output_data JSONB,
            assigned_agent TEXT,
            orchestrator_id TEXT,
            attempts INT DEFAULT 0,
            max_attempts INT DEFAULT 3,
            started_at TIMESTAMP,
            completed_at TIMESTAMP,
            failed_at TIMESTAMP,
            failure_reason TEXT,
            tokens_used INT DEFAULT 0,
            estimated_cost DECIMAL(10,6) DEFAULT 0,
            user_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        results.push('ai_jobs created');

        // Agent Logs
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS agent_logs (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            job_id TEXT,
            agent_name TEXT NOT NULL,
            agent_type TEXT NOT NULL,
            action TEXT NOT NULL,
            message TEXT NOT NULL,
            input_tokens INT DEFAULT 0,
            output_tokens INT DEFAULT 0,
            model_name TEXT,
            model_provider TEXT,
            duration_ms INT,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        results.push('agent_logs created');

        // Agent Memory
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS agent_memories (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            memory_type TEXT NOT NULL,
            content TEXT NOT NULL,
            summary TEXT,
            embedding BYTEA,
            embedding_model TEXT,
            user_id TEXT,
            agent_name TEXT,
            job_id TEXT,
            tags TEXT[] DEFAULT '{}',
            importance INT DEFAULT 5,
            access_count INT DEFAULT 0,
            last_accessed_at TIMESTAMP,
            expires_at TIMESTAMP,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        results.push('agent_memories created');

        // Automations
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS automations (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name TEXT NOT NULL,
            description TEXT,
            trigger_type TEXT NOT NULL,
            trigger_config JSONB NOT NULL,
            actions JSONB NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            user_id TEXT NOT NULL,
            run_count INT DEFAULT 0,
            last_run_at TIMESTAMP,
            last_run_status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        results.push('automations created');

        // Automation Runs
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS automation_runs (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            automation_id TEXT NOT NULL,
            status TEXT DEFAULT 'RUNNING',
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            input_data JSONB,
            output_data JSONB,
            error_message TEXT,
            steps_completed INT DEFAULT 0,
            total_steps INT DEFAULT 0,
            step_logs JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        results.push('automation_runs created');

        // Integrations
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS integrations (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name TEXT NOT NULL,
            provider TEXT NOT NULL,
            access_token TEXT,
            refresh_token TEXT,
            token_expires_at TIMESTAMP,
            config JSONB,
            scopes TEXT[] DEFAULT '{}',
            is_active BOOLEAN DEFAULT TRUE,
            last_sync_at TIMESTAMP,
            last_error TEXT,
            user_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, provider)
          )
        `;
        results.push('integrations created');

        // Storage Files
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS storage_files (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            file_name TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            size INT NOT NULL,
            bucket TEXT NOT NULL,
            path TEXT NOT NULL,
            url TEXT,
            user_id TEXT,
            metadata JSONB,
            is_public BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        results.push('storage_files created');

        return NextResponse.json({ success: true, results });
      } catch (error) {
        return NextResponse.json({ error: String(error), results }, { status: 500 });
      }
    }

    // Create admin user
    const email = process.env.ADMIN_EMAIL || 'admin@advanciapayledger.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123456'; // ⚠️ Use ADMIN_PASSWORD env var in production!

    if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'ADMIN_PASSWORD environment variable must be set in production!' },
        { status: 500 }
      );
    }

    const hashedPassword = await hash(password, 12);

    // Delete existing user first to ensure clean state
    await prisma.user.deleteMany({
      where: { email },
    });

    // Create fresh admin user
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    // Verify password works
    const testCompare = await compare(password, hashedPassword);

    return NextResponse.json({
      success: true,
      message: 'Database initialized and admin user created',
      userId: user.id,
      email: user.email,
      passwordVerified: testCompare,
    });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize', details: String(error) },
      { status: 500 }
    );
  }
}
