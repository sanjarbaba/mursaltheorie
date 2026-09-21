import { authenticate, ensureUser, getSql, requireCourseAccess } from '../_lib.js';
import { fail, locale, localized, ok } from './_contract.js';

export default {
  async fetch(request) {
    if (request.method !== 'GET') return fail('METHOD_NOT_ALLOWED', 'Methode niet toegestaan.', 405);
    const auth = await authenticate(request);
    if (auth.error) return fail('UNAUTHORIZED', 'Inloggen is vereist.', 401);

    try {
      const sql = getSql();
      await ensureUser(sql, auth.userId);
      const language = locale(new URL(request.url).searchParams.get('locale'));
      const access = await requireCourseAccess(sql, auth.userId, language);
      if (access.error) return access.error;
      const releases = await sql`
        SELECT id, version, published_at
        FROM content_releases
        WHERE status = 'published'
        LIMIT 1
      `;
      if (!releases[0]) return ok({ release: null, lessons: [], locale: language });

      const release = releases[0];
      const rows = await sql`
        SELECT l.lesson_number, l.slug, l.title, l.summary, l.content_blocks, l.media,
          l.estimated_minutes, l.sort_order,
          m.module_number, m.slug AS module_slug, m.title AS module_title
        FROM course_lessons l
        JOIN course_modules m ON m.id = l.module_id
        WHERE l.release_id = ${release.id}
          AND m.release_id = ${release.id}
          AND l.published = TRUE
          AND m.published = TRUE
        ORDER BY m.sort_order, l.sort_order
      `;

      const visibleContent = (value) => {
        if (Array.isArray(value)) return value.map(visibleContent);
        if (!value || typeof value !== 'object') return value;
        return Object.fromEntries(Object.entries(value)
          .filter(([key]) => !['nl', 'fa', 'ps'].includes(key) || access.locales.includes(key))
          .map(([key, part]) => [key, visibleContent(part)]));
      };
      const lessons = rows.map((row) => ({
        id: row.lesson_number,
        slug: row.slug,
        title: localized(row.title, language),
        summary: localized(row.summary, language),
        contentBlocks: visibleContent(row.content_blocks),
        media: visibleContent(row.media),
        estimatedMinutes: row.estimated_minutes,
        sortOrder: row.sort_order,
        module: {
          number: row.module_number,
          slug: row.module_slug,
          title: localized(row.module_title, language)
        }
      }));

      return ok({
        release: { version: release.version, publishedAt: release.published_at },
        lessons,
        locale: language
      });
    } catch (error) {
      if (error?.code === '42P01') {
        return fail('MIGRATION_REQUIRED', 'De mobiele contentmigratie is nog niet uitgevoerd.', 503);
      }
      console.error('v1 lessons endpoint failed', error);
      return fail('SERVICE_UNAVAILABLE', 'Lesinhoud kon niet worden geladen.', 503);
    }
  }
};
