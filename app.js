const CATEGORIES = ['전체', '수업', '학습', '놀이', '학급운영'];
const STORAGE_KEY = 'learning-portal-apps-v1';
const SESSION_ADMIN_KEY = 'learning-portal-admin-session';

const defaultApps = [
  {
    id: 'reading-quiz',
    title: '독서 퀴즈 풀기',
    description: '돋보기, 탐정, 거울 문제를 풀며 책 내용을 정리해요.',
    url: 'https://example.com/reading-quiz',
    category: '수업',
    tags: ['독서', '퀴즈', '문해력'],
    thumbnailDataUrl: '',
    thumbnailAlt: '책과 돋보기 그림',
    isPublished: true,
    openInNewTab: true,
    sortOrder: 1,
    createdAt: '2026-06-27T00:00:00+09:00',
    updatedAt: '2026-06-27T00:00:00+09:00'
  },
  {
    id: 'social-bingo',
    title: '사회 개념 빙고',
    description: '사회 핵심 개념을 빙고 활동으로 복습해요.',
    url: 'https://example.com/social-bingo',
    category: '놀이',
    tags: ['사회', '빙고', '복습'],
    thumbnailDataUrl: '',
    thumbnailAlt: '빙고판 그림',
    isPublished: true,
    openInNewTab: true,
    sortOrder: 2,
    createdAt: '2026-06-27T00:00:00+09:00',
    updatedAt: '2026-06-27T00:00:00+09:00'
  },
  {
    id: 'class-vote',
    title: '학급 투표',
    description: '학급 의견을 모으고 투표 결과를 확인해요.',
    url: 'https://example.com/class-vote',
    category: '학급운영',
    tags: ['학급회의', '투표', '의견수렴'],
    thumbnailDataUrl: '',
    thumbnailAlt: '투표함 그림',
    isPublished: true,
    openInNewTab: true,
    sortOrder: 3,
    createdAt: '2026-06-27T00:00:00+09:00',
    updatedAt: '2026-06-27T00:00:00+09:00'
  }
];

const state = {
  apps: [],
  selectedCategory: '전체',
  selectedTag: '',
  searchTerm: '',
  storageMode: 'checking',
  adminCode: sessionStorage.getItem(SESSION_ADMIN_KEY) || '',
  thumbnailDataUrl: ''
};

const els = {
  appGrid: document.querySelector('#appGrid'),
  emptyState: document.querySelector('#emptyState'),
  searchInput: document.querySelector('#searchInput'),
  clearSearchButton: document.querySelector('#clearSearchButton'),
  categoryTabs: document.querySelectorAll('.category-tab'),
  tagList: document.querySelector('#tagList'),
  clearTagButton: document.querySelector('#clearTagButton'),
  resultTitle: document.querySelector('#resultTitle'),
  resultDescription: document.querySelector('#resultDescription'),
  storageModeBadge: document.querySelector('#storageModeBadge'),
  adminOpenButton: document.querySelector('#adminOpenButton'),
  adminModal: document.querySelector('#adminModal'),
  adminLoginSection: document.querySelector('#adminLoginSection'),
  adminPanelSection: document.querySelector('#adminPanelSection'),
  adminLoginForm: document.querySelector('#adminLoginForm'),
  adminCodeInput: document.querySelector('#adminCodeInput'),
  adminLoginError: document.querySelector('#adminLoginError'),
  adminStorageNotice: document.querySelector('#adminStorageNotice'),
  appForm: document.querySelector('#appForm'),
  appTitleInput: document.querySelector('#appTitleInput'),
  appUrlInput: document.querySelector('#appUrlInput'),
  appCategorySelect: document.querySelector('#appCategorySelect'),
  appTagsInput: document.querySelector('#appTagsInput'),
  appDescriptionInput: document.querySelector('#appDescriptionInput'),
  appThumbnailInput: document.querySelector('#appThumbnailInput'),
  thumbnailPreview: document.querySelector('#thumbnailPreview'),
  appPublishedInput: document.querySelector('#appPublishedInput'),
  formError: document.querySelector('#formError'),
  resetFormButton: document.querySelector('#resetFormButton'),
  adminAppList: document.querySelector('#adminAppList'),
  exportButton: document.querySelector('#exportButton'),
  importInput: document.querySelector('#importInput'),
  toast: document.querySelector('#toast')
};

init();

async function init() {
  bindEvents();
  await loadApps();
  renderAll();
}

function bindEvents() {
  els.searchInput.addEventListener('input', (event) => {
    state.searchTerm = event.target.value.trim();
    renderAll();
  });

  els.clearSearchButton.addEventListener('click', () => {
    state.searchTerm = '';
    els.searchInput.value = '';
    renderAll();
  });

  els.categoryTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.selectedCategory = tab.dataset.category;
      renderAll();
    });
  });

  els.clearTagButton.addEventListener('click', () => {
    state.selectedTag = '';
    renderAll();
  });

  els.adminOpenButton.addEventListener('click', openAdminModal);

  els.adminModal.addEventListener('click', (event) => {
    if (event.target.matches('[data-close-modal]')) {
      closeAdminModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !els.adminModal.hidden) {
      closeAdminModal();
    }
  });

  els.adminLoginForm.addEventListener('submit', handleAdminLogin);
  els.appForm.addEventListener('submit', handleAppSubmit);
  els.resetFormButton.addEventListener('click', resetAppForm);
  els.appThumbnailInput.addEventListener('change', handleThumbnailSelect);
  els.exportButton.addEventListener('click', exportApps);
  els.importInput.addEventListener('change', importApps);
}

async function loadApps() {
  try {
    const response = await fetch('/api/apps', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Cloud storage is not configured.');
    const data = await response.json();
    if (!Array.isArray(data.apps)) throw new Error('Invalid API response.');
    state.apps = data.apps.map(normalizeApp).filter(Boolean);
    state.storageMode = 'cloud';
  } catch (error) {
    state.apps = loadLocalApps();
    state.storageMode = 'local';
  }
}

function loadLocalApps() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...defaultApps];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...defaultApps];
    return parsed.map(normalizeApp).filter(Boolean);
  } catch (error) {
    return [...defaultApps];
  }
}

function saveLocalApps() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.apps));
}

function normalizeApp(app) {
  if (!app || typeof app !== 'object') return null;
  const category = ['수업', '학습', '놀이', '학급운영'].includes(app.category) ? app.category : '학습';
  return {
    id: String(app.id || createId()),
    title: String(app.title || app.name || '제목 없는 앱').trim(),
    description: String(app.description || '').trim(),
    url: String(app.url || '').trim(),
    category,
    tags: normalizeTags(Array.isArray(app.tags) ? app.tags.join(',') : String(app.tags || '')),
    thumbnailDataUrl: String(app.thumbnailDataUrl || app.thumbnailUrl || '').trim(),
    thumbnailAlt: String(app.thumbnailAlt || `${app.title || '앱'} 썸네일`).trim(),
    isPublished: app.isPublished !== false,
    openInNewTab: app.openInNewTab !== false,
    sortOrder: Number.isFinite(Number(app.sortOrder)) ? Number(app.sortOrder) : undefined,
    createdAt: app.createdAt || new Date().toISOString(),
    updatedAt: app.updatedAt || new Date().toISOString()
  };
}

function renderAll() {
  renderCategoryTabs();
  renderTags();
  renderStorageMode();
  renderResultSummary();
  renderApps();
  renderAdminList();
}

function renderCategoryTabs() {
  els.categoryTabs.forEach((tab) => {
    const isActive = tab.dataset.category === state.selectedCategory;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-pressed', String(isActive));
  });
}

function renderTags() {
  els.tagList.replaceChildren();
  const tagCounts = new Map();
  getPublishedApps().forEach((app) => {
    app.tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));
  });

  const tags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko-KR'))
    .slice(0, 18);

  if (tags.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'helper-text';
    empty.textContent = '아직 등록된 태그가 없습니다.';
    els.tagList.append(empty);
  }

  tags.forEach(([tag, count]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tag-chip${state.selectedTag === tag ? ' is-active' : ''}`;
    button.textContent = `#${tag}`;
    button.title = `${count}개 앱`;
    button.setAttribute('aria-pressed', String(state.selectedTag === tag));
    button.addEventListener('click', () => {
      state.selectedTag = state.selectedTag === tag ? '' : tag;
      renderAll();
    });
    els.tagList.append(button);
  });

  els.clearTagButton.hidden = !state.selectedTag;
}

function renderStorageMode() {
  els.storageModeBadge.classList.remove('is-cloud', 'is-local');
  if (state.storageMode === 'cloud') {
    els.storageModeBadge.textContent = '클라우드 저장';
    els.storageModeBadge.classList.add('is-cloud');
    els.adminStorageNotice.textContent = 'Firebase/서버 저장소에 저장됩니다. 학생 기기에도 같은 목록이 보입니다.';
  } else {
    els.storageModeBadge.textContent = '이 브라우저에만 저장';
    els.storageModeBadge.classList.add('is-local');
    els.adminStorageNotice.textContent = '현재는 localStorage 저장입니다. 이 브라우저에서만 반영됩니다. 실제 운영은 README의 Firebase 환경변수를 연결하세요.';
  }
}

function renderResultSummary() {
  const filtered = getFilteredApps();
  let title = state.selectedCategory === '전체' ? '전체 앱' : `${state.selectedCategory} 앱`;
  if (state.selectedTag) title += ` · #${state.selectedTag}`;
  els.resultTitle.textContent = title;

  const descriptions = [];
  descriptions.push(`${filtered.length}개의 앱을 보여주고 있어요.`);
  if (state.searchTerm) descriptions.push(`검색어: “${state.searchTerm}”`);
  if (state.selectedTag) descriptions.push(`#${state.selectedTag} 태그 적용 중`);
  els.resultDescription.textContent = descriptions.join(' ');
}

function renderApps() {
  els.appGrid.replaceChildren();
  const apps = getFilteredApps();
  els.emptyState.hidden = apps.length > 0;

  apps.forEach((app) => els.appGrid.append(createAppCard(app)));
}

function createAppCard(app) {
  const article = document.createElement('article');
  article.className = 'app-card';

  const thumbnail = document.createElement('div');
  thumbnail.className = 'card-thumbnail';
  if (app.thumbnailDataUrl) {
    const image = document.createElement('img');
    image.src = app.thumbnailDataUrl;
    image.alt = app.thumbnailAlt || `${app.title} 썸네일`;
    thumbnail.append(image);
  } else {
    thumbnail.append(createDefaultThumbnail(app));
  }

  const body = document.createElement('div');
  body.className = 'card-body';

  const category = document.createElement('span');
  category.className = 'category-label';
  category.dataset.category = app.category;
  category.textContent = app.category;

  const title = document.createElement('h3');
  title.textContent = app.title;

  const description = document.createElement('p');
  description.className = 'card-description';
  description.textContent = app.description || '앱 설명이 아직 없습니다.';

  const tagWrap = document.createElement('div');
  tagWrap.className = 'card-tags';
  app.tags.forEach((tag) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tag-chip${state.selectedTag === tag ? ' is-active' : ''}`;
    button.textContent = `#${tag}`;
    button.addEventListener('click', () => {
      state.selectedTag = tag;
      renderAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    tagWrap.append(button);
  });

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const link = document.createElement('a');
  link.className = 'start-link';
  link.href = app.url;
  link.textContent = '시작하기';
  if (app.openInNewTab) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  actions.append(link);

  body.append(category, title, description, tagWrap, actions);
  article.append(thumbnail, body);
  return article;
}

function createDefaultThumbnail(app) {
  const wrapper = document.createElement('div');
  wrapper.className = 'default-thumbnail';
  const icon = document.createElement('div');
  icon.className = 'default-thumbnail__icon';
  icon.textContent = getCategoryIcon(app.category);
  const title = document.createElement('div');
  title.className = 'default-thumbnail__title';
  title.textContent = app.title;
  wrapper.append(icon, title);
  return wrapper;
}

function getCategoryIcon(category) {
  switch (category) {
    case '수업': return '📚';
    case '학습': return '✏️';
    case '놀이': return '🧩';
    case '학급운영': return '🏫';
    default: return '📌';
  }
}

function getPublishedApps() {
  return state.apps
    .filter((app) => app.isPublished && isValidUrl(app.url))
    .sort(sortApps);
}

function getFilteredApps() {
  const search = state.searchTerm.replace(/^#/, '').toLowerCase();
  return getPublishedApps().filter((app) => {
    const matchesCategory = state.selectedCategory === '전체' || app.category === state.selectedCategory;
    const matchesTag = !state.selectedTag || app.tags.includes(state.selectedTag);
    const haystack = [app.title, app.description, app.category, ...app.tags].join(' ').toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    return matchesCategory && matchesTag && matchesSearch;
  });
}

function sortApps(a, b) {
  const aOrder = Number.isFinite(a.sortOrder) ? a.sortOrder : Number.POSITIVE_INFINITY;
  const bOrder = Number.isFinite(b.sortOrder) ? b.sortOrder : Number.POSITIVE_INFINITY;
  if (aOrder !== bOrder) return aOrder - bOrder;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function openAdminModal() {
  els.adminModal.hidden = false;
  document.body.style.overflow = 'hidden';
  if (state.adminCode) {
    showAdminPanel();
  } else {
    showAdminLogin();
  }
}

function closeAdminModal() {
  els.adminModal.hidden = true;
  document.body.style.overflow = '';
  els.adminLoginError.hidden = true;
  hideFormError();
}

function showAdminLogin() {
  els.adminLoginSection.hidden = false;
  els.adminPanelSection.hidden = true;
  setTimeout(() => els.adminCodeInput.focus(), 0);
}

function showAdminPanel() {
  els.adminLoginSection.hidden = true;
  els.adminPanelSection.hidden = false;
  renderAdminList();
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const code = els.adminCodeInput.value.trim();
  if (!code) return;

  const submitButton = els.adminLoginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = '확인 중…';

  try {
    const response = await fetch('/api/verify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.message || '인증 실패');
    state.adminCode = code;
    sessionStorage.setItem(SESSION_ADMIN_KEY, code);
    showAdminPanel();
    showToast('관리자 모드로 들어왔습니다.');
  } catch (error) {
    els.adminLoginError.textContent = '관리자 코드가 올바르지 않거나 서버 설정이 필요합니다.';
    els.adminLoginError.hidden = false;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = '확인';
  }
}

async function handleAppSubmit(event) {
  event.preventDefault();
  hideFormError();

  const title = els.appTitleInput.value.trim();
  const url = els.appUrlInput.value.trim();
  const category = els.appCategorySelect.value;
  const description = els.appDescriptionInput.value.trim();
  const tags = normalizeTags(els.appTagsInput.value);
  const isPublished = els.appPublishedInput.checked;

  if (!title) return showFormError('앱 제목을 입력해 주세요.');
  if (!isValidUrl(url)) return showFormError('앱 링크는 https:// 또는 http://로 시작해야 합니다.');
  if (!['수업', '학습', '놀이', '학급운영'].includes(category)) return showFormError('카테고리를 선택해 주세요.');

  const now = new Date().toISOString();
  const newApp = normalizeApp({
    id: createId(),
    title,
    description,
    url,
    category,
    tags,
    thumbnailDataUrl: state.thumbnailDataUrl,
    thumbnailAlt: `${title} 썸네일`,
    isPublished,
    openInNewTab: true,
    createdAt: now,
    updatedAt: now
  });

  const submitButton = els.appForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = '저장 중...';

  try {
    if (state.storageMode === 'cloud') {
      const response = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: state.adminCode, app: newApp })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.app) throw new Error(data.message || '저장 실패');
      state.apps = [normalizeApp(data.app), ...state.apps.filter((app) => app.id !== data.app.id)];
    } else {
      state.apps = [newApp, ...state.apps];
      saveLocalApps();
    }
    resetAppForm();
    renderAll();
    showToast('웹앱이 추가되었습니다.');
  } catch (error) {
    showFormError(error.message || '저장 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = '저장하기';
  }
}

function resetAppForm() {
  els.appForm.reset();
  els.appPublishedInput.checked = true;
  state.thumbnailDataUrl = '';
  els.thumbnailPreview.replaceChildren('미리보기');
  hideFormError();
}

async function handleThumbnailSelect(event) {
  hideFormError();
  const file = event.target.files?.[0];
  state.thumbnailDataUrl = '';
  els.thumbnailPreview.replaceChildren('미리보기');
  if (!file) return;

  if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
    event.target.value = '';
    return showFormError('jpg, jpeg, png, webp 형식의 이미지만 올릴 수 있습니다.');
  }

  if (file.size > 5 * 1024 * 1024) {
    event.target.value = '';
    return showFormError('이미지가 너무 큽니다. 5MB 이하 이미지를 선택해 주세요.');
  }

  try {
    const dataUrl = await compressImage(file, 1280, 720, 0.78);
    state.thumbnailDataUrl = dataUrl;
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = '업로드한 썸네일 미리보기';
    els.thumbnailPreview.replaceChildren(img);
  } catch (error) {
    event.target.value = '';
    showFormError('이미지를 읽는 중 문제가 생겼습니다. 다른 이미지를 선택해 주세요.');
  }
}

function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const width = Math.max(1, Math.round(image.width * ratio));
        const height = Math.max(1, Math.round(image.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderAdminList() {
  if (!els.adminAppList) return;
  els.adminAppList.replaceChildren();
  if (!state.apps.length) {
    const empty = document.createElement('p');
    empty.className = 'helper-text';
    empty.textContent = '아직 등록된 앱이 없습니다.';
    els.adminAppList.append(empty);
    return;
  }

  [...state.apps].sort(sortApps).forEach((app) => {
    const item = document.createElement('div');
    item.className = 'admin-app-item';

    const thumb = document.createElement('div');
    thumb.className = 'admin-app-thumb';
    if (app.thumbnailDataUrl) {
      const img = document.createElement('img');
      img.src = app.thumbnailDataUrl;
      img.alt = '';
      thumb.append(img);
    } else {
      thumb.textContent = getCategoryIcon(app.category);
    }

    const meta = document.createElement('div');
    meta.className = 'admin-app-meta';
    const title = document.createElement('strong');
    title.textContent = app.title;
    const detail = document.createElement('span');
    detail.textContent = `${app.category} · ${app.tags.map((tag) => `#${tag}`).join(' ')}${app.isPublished ? '' : ' · 비공개'}`;
    meta.append(title, detail);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'danger-button';
    deleteButton.textContent = '삭제';
    deleteButton.addEventListener('click', () => deleteApp(app.id));

    item.append(thumb, meta, deleteButton);
    els.adminAppList.append(item);
  });
}

async function deleteApp(id) {
  const target = state.apps.find((app) => app.id === id);
  if (!target) return;
  const ok = window.confirm(`“${target.title}” 앱을 삭제할까요?`);
  if (!ok) return;

  try {
    if (state.storageMode === 'cloud') {
      const response = await fetch('/api/apps', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: state.adminCode, id })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || '삭제 실패');
    }
    state.apps = state.apps.filter((app) => app.id !== id);
    if (state.storageMode !== 'cloud') saveLocalApps();
    renderAll();
    showToast('앱을 삭제했습니다.');
  } catch (error) {
    showToast(error.message || '삭제 중 문제가 생겼습니다.');
  }
}

function exportApps() {
  const payload = JSON.stringify(state.apps, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `learning-portal-apps-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importApps(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onerror = () => showToast('파일을 읽지 못했습니다.');
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error('JSON 배열이 아닙니다.');
      state.apps = parsed.map(normalizeApp).filter(Boolean);
      if (state.storageMode !== 'cloud') saveLocalApps();
      renderAll();
      showToast('JSON 데이터를 가져왔습니다.');
      if (state.storageMode === 'cloud') {
        showToast('클라우드 모드에서는 가져온 데이터가 화면에만 반영됩니다. 앱별 저장은 추가 구현이 필요합니다.');
      }
    } catch (error) {
      showToast('올바른 앱 목록 JSON 파일이 아닙니다.');
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file, 'utf-8');
}

function normalizeTags(input) {
  return [...new Set(String(input || '')
    .replace(/[＃#]/g, ' ')
    .split(/[,\n\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.replace(/^#+/, ''))
  )].slice(0, 12);
}

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch (error) {
    return false;
  }
}

function createId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `app-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function showFormError(message) {
  els.formError.textContent = message;
  els.formError.hidden = false;
}

function hideFormError() {
  els.formError.textContent = '';
  els.formError.hidden = true;
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.hidden = false;
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 3600);
}
