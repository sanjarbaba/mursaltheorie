(() => {
  const tabs = [...document.querySelectorAll('[data-admin-tab]')];
  const panels = [...document.querySelectorAll('[data-admin-panel]')];
  const form = document.getElementById('lessonForm');
  const list = document.getElementById('lessonItems');
  const search = document.getElementById('lessonSearch');
  const message = document.getElementById('lessonMessage');
  const title = document.getElementById('editorTitle');
  const status = document.getElementById('editorStatus');
  const moduleField = document.getElementById('lessonModule');
  const publishButton = document.getElementById('publishLesson');
  const preview = document.getElementById('lessonPreview');
  let data = null;
  let selected = null;
  let dirty = false;

  const field = (name) => form.elements.namedItem(name);
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
  const label = (lesson) => lesson.published ? 'Gepubliceerd' : 'Concept';
  const mayLeave = () => !dirty || confirm('Je hebt nog niet opgeslagen wijzigingen. Toch doorgaan?');

  function switchTab(name) {
    tabs.forEach((tab) => { tab.setAttribute('aria-selected', String(tab.dataset.adminTab === name)); });
    panels.forEach((panel) => { panel.hidden = panel.dataset.adminPanel !== name; });
    if (name === 'lessons' && !data) loadLessons();
  }

  function showMessage(text, isError = false) {
    message.hidden = !text;
    message.className = 'notice' + (isError ? ' error' : '');
    message.textContent = text || '';
  }

  function renderList() {
    const query = search.value.trim().toLocaleLowerCase('nl-NL');
    const matches = (data?.lessons || []).filter((lesson) =>
      !query || String(lesson.number).includes(query) ||
      Object.values(lesson.title || {}).some((value) => String(value).toLocaleLowerCase('nl-NL').includes(query)));
    list.innerHTML = matches.length ? matches.map((lesson) =>
      `<button class="lesson-item" type="button" data-lesson-id="${safe(lesson.id)}" aria-current="${selected?.id === lesson.id}"><b>${safe(lesson.number)}. ${safe(lesson.title?.nl || 'Zonder titel')}</b><small>${safe(label(lesson))} · ${safe(data.modules.find((module) => String(module.id) === String(lesson.moduleId))?.title?.nl || 'Hoofdstuk')}</small></button>`
    ).join('') : '<p class="muted">Geen lessen gevonden.</p>';
    list.querySelectorAll('[data-lesson-id]').forEach((button) => {
      button.addEventListener('click', () => {
        if (String(selected?.id) === button.dataset.lessonId || !mayLeave()) return;
        chooseLesson(data.lessons.find((lesson) => String(lesson.id) === button.dataset.lessonId));
      });
    });
  }

  function chooseLesson(lesson = null) {
    selected = lesson;
    dirty = false;
    preview.hidden = true;
    form.hidden = false;
    title.textContent = lesson ? `Les ${lesson.number} · ${lesson.title?.nl || 'Zonder titel'}` : 'Nieuwe les als concept';
    status.textContent = lesson ?
      `${label(lesson)}. ${lesson.published ? 'Opgeslagen wijzigingen zijn meteen zichtbaar voor leerlingen.' : 'Deze les is nog niet zichtbaar voor leerlingen.'}` :
      'Kies het hoofdstuk en schrijf eerst de Nederlandse tekst. Je kunt later de vertalingen toevoegen.';
    moduleField.innerHTML = data.modules.map((module) =>
      `<option value="${safe(module.number)}">${safe(module.number)}. ${safe(module.title?.nl || 'Hoofdstuk')}</option>`).join('');
    moduleField.value = String(data.modules.find((module) => String(module.id) === String(lesson?.moduleId))?.number || data.modules[0]?.number || 1);
    moduleField.disabled = Boolean(lesson);
    field('estimatedMinutes').value = lesson?.estimatedMinutes || 4;
    for (const name of ['title', 'summary', 'rule', 'tip']) {
      for (const language of ['nl', 'fa', 'ps']) field(`${name}-${language}`).value = lesson?.[name]?.[language] || '';
    }
    publishButton.hidden = !lesson;
    publishButton.textContent = lesson?.published ? 'Verbergen voor leerlingen' : 'Publiceren';
    renderList();
  }

  async function loadLessons(preferredNumber = null) {
    showMessage('Lessen laden…');
    try {
      data = await call('/api/v1/admin?resource=lessons-admin');
      if (!data.release) { showMessage('Er is nog geen gepubliceerde lesversie in de database.', true); return; }
      showMessage('');
      renderList();
      if (preferredNumber != null) chooseLesson(data.lessons.find((lesson) => lesson.number === preferredNumber) || null);
      else if (selected) chooseLesson(data.lessons.find((lesson) => String(lesson.id) === String(selected.id)) || null);
      else form.hidden = true;
    } catch (error) {
      showMessage(error.message || 'Lessen konden niet worden geladen.', true);
    }
  }

  function payload() {
    const text = (name) => Object.fromEntries(['nl', 'fa', 'ps'].map((language) =>
      [language, field(`${name}-${language}`).value.trim()]));
    return {
      ...(selected ? { lessonId: selected.id, updatedAt: selected.updatedAt } : { moduleNumber: Number(moduleField.value) }),
      estimatedMinutes: Number(field('estimatedMinutes').value),
      title: text('title'), summary: text('summary'), rule: text('rule'), tip: text('tip')
    };
  }

  form.addEventListener('input', () => { dirty = true; preview.hidden = true; });
  form.addEventListener('change', () => { dirty = true; preview.hidden = true; });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (selected?.published && !confirm('Deze wijziging wordt meteen zichtbaar voor leerlingen. Opslaan?')) return;
    const button = document.getElementById('saveLesson');
    button.disabled = true;
    try {
      const result = await call('/api/v1/admin?resource=lesson-save', { method: 'POST', body: JSON.stringify(payload()) });
      dirty = false;
      await loadLessons(result.number);
      showNotice(result.created ? 'Nieuwe les als concept opgeslagen.' : 'Les opgeslagen.');
    } catch (error) {
      showMessage(error.message || 'De les kon niet worden opgeslagen.', true);
    } finally { button.disabled = false; }
  });

  publishButton.addEventListener('click', async () => {
    if (!selected) return;
    if (dirty) { showMessage('Sla je wijzigingen eerst op voordat je de publicatiestatus verandert.', true); return; }
    const next = !selected.published;
    if (!confirm(next ? 'Deze les wordt zichtbaar voor betalende leerlingen. Publiceren?' : 'Deze les wordt verborgen voor leerlingen. Doorgaan?')) return;
    publishButton.disabled = true;
    try {
      await call('/api/v1/admin?resource=lesson-publish', { method: 'POST', body: JSON.stringify({ lessonId: selected.id, published: next }) });
      await loadLessons(selected.number);
      showNotice(next ? 'Les gepubliceerd.' : 'Les verborgen.');
    } catch (error) {
      showMessage(error.message || 'De publicatiestatus kon niet worden gewijzigd.', true);
    } finally { publishButton.disabled = false; }
  });

  document.getElementById('previewLesson').addEventListener('click', () => {
    preview.replaceChildren();
    for (const [language, name] of [['nl', 'Nederlands'], ['fa', 'Dari/Farsi'], ['ps', 'Pashto']]) {
      const heading = document.createElement('h4');
      heading.textContent = `${name}: ${field(`title-${language}`).value || '—'}`;
      const summary = document.createElement('p');
      summary.textContent = field(`summary-${language}`).value || 'Geen samenvatting';
      const rule = document.createElement('p');
      rule.textContent = `Kernregel: ${field(`rule-${language}`).value || '—'}`;
      const tip = document.createElement('p');
      tip.textContent = `Examentip: ${field(`tip-${language}`).value || '—'}`;
      preview.append(heading, summary, rule, tip);
    }
    preview.hidden = false;
  });

  document.getElementById('newLesson').addEventListener('click', () => {
    if (!data || !mayLeave()) return;
    chooseLesson(null);
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    field('title-nl').focus();
  });
  search.addEventListener('input', renderList);
  tabs.forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.adminTab)));
})();
