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
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error?.message || payload.error || 'API request failed');
      error.status = response.status;
      error.code = payload.error?.code || payload.code;
      throw error;
    }
    return payload.data ?? payload;
  }

  function mergeContent(nl, fa) {
    const faLessons = new Map((fa.lessons || []).map((lesson) => [lesson.id, lesson]));
    const faExams = new Map((fa.exams || []).map((exam) => [exam.number, exam]));
    return {
      lessons: (nl.lessons || []).map((lesson) => ({
        ...lesson,
        titleNl: lesson.title,
        titleFa: faLessons.get(lesson.id)?.title || lesson.title,
        summaryNl: lesson.summary,
        summaryFa: faLessons.get(lesson.id)?.summary || lesson.summary,
        moduleTitleNl: lesson.module.title,
        moduleTitleFa: faLessons.get(lesson.id)?.module?.title || lesson.module.title
      })),
      exams: (nl.exams || []).map((exam) => ({
        ...exam,
        titleNl: exam.title,
        titleFa: faExams.get(exam.number)?.title || exam.title
      }))
    };
  }

  async function loadV1Content() {
    const [lessonsNl, lessonsFa, examsNl, examsFa] = await Promise.all([
      apiRequest('/api/v1/lessons?locale=nl'),
      apiRequest('/api/v1/lessons?locale=fa'),
      apiRequest('/api/v1/exams?locale=nl'),
      apiRequest('/api/v1/exams?locale=fa')
    ]);
    const content = mergeContent(
      { lessons: lessonsNl.lessons, exams: examsNl.exams },
      { lessons: lessonsFa.lessons, exams: examsFa.exams }
    );
    window.dispatchEvent(new CustomEvent('mt-v1-content', { detail: content }));
    return content;
  }

  async function loadAccountData(user) {
    if (!user) return;
    try {
      const profile = await apiRequest('/api/v1/me', {
        method: 'PUT',
        body: JSON.stringify({ name: user.name, email: user.email })
      });
      await registerDevice();
      await flushProgressQueue();
      const [progress, content, history] = await Promise.all([
        apiRequest('/api/v1/progress'),
        loadV1Content(),
        loadExamResults()
      ]);
      window.dispatchEvent(new CustomEvent('mt-account-data', {
        detail: {
          profile: profile.user,
          completedLessons: (progress.progress || []).filter((item) => item.completed).map((item) => item.lesson_id),
          results: history.results || [],
          resultSummary: history.summary,
          content
        }
      }));
    } catch (error) {
      console.warn('Accountgegevens zijn nog niet gesynchroniseerd.', error);
      window.dispatchEvent(new CustomEvent('mt-account-error', {
        detail: { status: error.status || 0, code: error.code || '', message: error.message }
      }));
    }
  }

  window.mtLoadV1Content = loadV1Content;

  async function loadExamResults() {
    const history = await apiRequest('/api/v1/results?locale=nl&limit=20');
    window.dispatchEvent(new CustomEvent('mt-exam-history', { detail: history }));
    return history;
  }

  window.mtLoadExamResults = loadExamResults;

  window.mtExportAccountData = async function () {
    const payload = await apiRequest('/api/v1/me?resource=export');
    const blob = new Blob([JSON.stringify(payload.export, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mursaltheorie-gegevens-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  window.mtDeleteAccount = async function (confirmation) {
    const result = await apiRequest('/api/v1/me', {
      method: 'DELETE',
      body: JSON.stringify({ confirmation })
    });
    const clerk = await window.mtClerkReady;
    await clerk?.signOut?.();
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('mt-')) localStorage.removeItem(key);
    }
    return result;
  };

  function getDeviceId() {
    const key = 'mt-device-id-v1';
    let id = localStorage.getItem(key);
    if (!id) {
      id = `web:${crypto.randomUUID()}`;
      localStorage.setItem(key, id);
    }
    return id;
  }

  async function queueKey() {
    const clerk = await window.mtClerkReady;
    return clerk?.user?.id ? `mt-progress-queue-v1:${clerk.user.id}` : null;
  }

  async function readQueue() {
    const key = await queueKey();
    if (!key) return { key: null, items: [] };
    try {
      const items = JSON.parse(localStorage.getItem(key) || '[]');
      return { key, items: Array.isArray(items) ? items : [] };
    } catch {
      return { key, items: [] };
    }
  }

  let flushPromise;
  async function flushProgressQueue() {
    if (flushPromise) return flushPromise;
    flushPromise = (async () => {
      const queue = await readQueue();
      if (!queue.key) return null;
      while (queue.items.length) {
        await apiRequest('/api/v1/progress', {
          method: 'PUT',
          body: JSON.stringify(queue.items[0])
        });
        queue.items.shift();
        localStorage.setItem(queue.key, JSON.stringify(queue.items));
      }
      return true;
    })().finally(() => { flushPromise = null; });
    return flushPromise;
  }

  async function registerDevice() {
    return apiRequest('/api/v1/devices', {
      method: 'PUT',
      body: JSON.stringify({ deviceId: getDeviceId(), platform: 'web' })
    });
  }

  window.mtSaveLessonProgress = async function (lessonId, completed) {
    const queue = await readQueue();
    if (!queue.key) return null;
    queue.items.push({
      lessonId,
      completed,
      progressPercent: completed ? 100 : 0,
      clientUpdatedAt: new Date().toISOString(),
      deviceId: getDeviceId(),
      mutationId: crypto.randomUUID()
    });
    localStorage.setItem(queue.key, JSON.stringify(queue.items));
    try {
      return await flushProgressQueue();
    } catch (error) {
      console.warn('Lesvoortgang wordt later opnieuw gesynchroniseerd.', error);
      return null;
    }
  };

  window.mtStartExam = async function (examNumber) {
    const mutationId = crypto.randomUUID();
    const request = (locale) => apiRequest('/api/v1/exam-attempts', {
      method: 'POST',
      body: JSON.stringify({ action: 'start', examNumber, mutationId, locale })
    });
    const [nl, fa] = await Promise.all([request('nl'), request('fa')]);
    const faQuestions = new Map(fa.attempt.questions.map((question) => [question.id, question]));
    return {
      ...nl.attempt,
      exam: { ...nl.attempt.exam, titleNl: nl.attempt.exam.title, titleFa: fa.attempt.exam.title },
      questions: nl.attempt.questions.map((question) => ({
        ...question,
        promptNl: question.prompt,
        promptFa: faQuestions.get(question.id)?.prompt || question.prompt,
        optionsNl: question.options,
        optionsFa: faQuestions.get(question.id)?.options || question.options
      }))
    };
  };

  window.mtSaveExamAnswer = async function (attemptId, questionId, selectedOption) {
    return apiRequest('/api/v1/exam-attempts', {
      method: 'POST',
      body: JSON.stringify({ action: 'answer', attemptId, questionId, selectedOption })
    });
  };

  window.mtSubmitExam = async function (attemptId, locale) {
    const result = await apiRequest('/api/v1/exam-attempts', {
      method: 'POST',
      body: JSON.stringify({ action: 'submit', attemptId, locale })
    });
    loadExamResults().catch((error) => console.warn('Examenhistorie wordt later vernieuwd.', error));
    return result;
  };

  window.addEventListener('mt-clerk-change', (event) => {
    if (event.detail?.signedIn && event.detail.user) loadAccountData(event.detail.user);
  });
  window.addEventListener('online', () => {
    flushProgressQueue().catch((error) => console.warn('Offline voortgang blijft in de wachtrij.', error));
  });
}());
