(function () {
  'use strict';

  async function apiRequest(path, options) {
    const clerk = await window.mtClerkReady;
    if (!clerk?.isSignedIn || !clerk.session) throw new Error('AUTH_REQUIRED');
    const token = await clerk.session.getToken();
    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options?.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'API request failed');
      error.status = response.status;
      error.code = data.code;
      throw error;
    }
    return data;
  }

  async function loadAccountData(user) {
    if (!user) return;
    try {
      const profile = await apiRequest('/api/me', {
        method: 'PUT',
        body: JSON.stringify({ name: user.name, email: user.email })
      });
      const [progress, results] = await Promise.all([
        apiRequest('/api/progress'),
        apiRequest('/api/results')
      ]);
      window.dispatchEvent(new CustomEvent('mt-account-data', {
        detail: {
          profile: profile.user,
          completedLessons: progress.completedLessons || [],
          results: results.results || []
        }
      }));
    } catch (error) {
      console.warn('Accountgegevens zijn nog niet gesynchroniseerd.', error);
      window.dispatchEvent(new CustomEvent('mt-account-error', {
        detail: { status: error.status || 0, code: error.code || '', message: error.message }
      }));
    }
  }

  window.mtSaveLessonProgress = async function (lessonId, completed) {
    try {
      return await apiRequest('/api/progress', {
        method: 'PUT',
        body: JSON.stringify({ lessonId, completed })
      });
    } catch (error) {
      console.warn('Lesvoortgang wordt later opnieuw gesynchroniseerd.', error);
      return null;
    }
  };

  window.mtSaveExamResult = async function (result) {
    try {
      return await apiRequest('/api/results', {
        method: 'POST',
        body: JSON.stringify(result)
      });
    } catch (error) {
      console.warn('Examenresultaat wordt later opnieuw gesynchroniseerd.', error);
      return null;
    }
  };

  window.addEventListener('mt-clerk-change', (event) => {
    if (event.detail?.signedIn && event.detail.user) loadAccountData(event.detail.user);
  });
}());
