import { neon } from '@neondatabase/serverless';

export default {
  async fetch() {
    const clerkConfigured = Boolean(process.env.CLERK_SECRET_KEY);
    if (!process.env.DATABASE_URL) {
      return Response.json({ ok: false, clerkConfigured, database: false, tables: {} }, {
        status: 503,
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    try {
      const sql = neon(process.env.DATABASE_URL);
      const rows = await sql`
        SELECT
          to_regclass('public.app_users') IS NOT NULL AS app_users,
          to_regclass('public.lesson_progress') IS NOT NULL AS lesson_progress,
          to_regclass('public.exam_results') IS NOT NULL AS exam_results,
          to_regclass('public.protected_lessons') IS NOT NULL AS protected_lessons,
          to_regclass('public.protected_questions') IS NOT NULL AS protected_questions
      `;
      const tables = rows[0] || {};
      return Response.json({
        ok: clerkConfigured && Object.values(tables).every(Boolean),
        clerkConfigured,
        database: true,
        tables
      }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return Response.json({ ok: false, clerkConfigured, database: false, tables: {} }, {
        status: 503,
        headers: { 'Cache-Control': 'no-store' }
      });
    }
  }
};
