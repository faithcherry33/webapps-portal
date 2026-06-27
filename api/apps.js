const crypto = require('crypto');
const { getFirebaseAdmin, hasFirebaseEnv } = require('./_firebaseAdmin');

const COLLECTION = 'portalApps';
const VALID_CATEGORIES = new Set(['수업', '학습', '놀이', '학급운영']);

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyAdmin(code) {
  const adminCode = process.env.ADMIN_CODE;
  if (!adminCode) {
    const error = new Error('Vercel 환경변수 ADMIN_CODE가 설정되어 있지 않습니다.');
    error.statusCode = 500;
    throw error;
  }
  if (!safeEqual(code, adminCode)) {
    const error = new Error('관리자 코드가 올바르지 않습니다.');
    error.statusCode = 401;
    throw error;
  }
}

function normalizeTags(input) {
  const raw = Array.isArray(input) ? input.join(',') : String(input || '');
  return [...new Set(
    raw
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

function sanitizeApp(input) {
  const app = input || {};
  const now = new Date().toISOString();
  const title = String(app.title || '').trim();
  const url = String(app.url || '').trim();
  const category = VALID_CATEGORIES.has(app.category) ? app.category : '';
  const thumbnailDataUrl = String(app.thumbnailDataUrl || '').trim();

  if (!title) throw userError('앱 제목을 입력해 주세요.', 400);
  if (!isValidUrl(url)) throw userError('앱 링크는 https:// 또는 http://로 시작해야 합니다.', 400);
  if (!category) throw userError('카테고리를 선택해 주세요.', 400);
  if (thumbnailDataUrl && !thumbnailDataUrl.startsWith('data:image/')) {
    throw userError('썸네일은 이미지 데이터만 저장할 수 있습니다.', 400);
  }
  if (thumbnailDataUrl.length > 900000) {
    throw userError('썸네일 이미지가 너무 큽니다. 더 작은 이미지를 사용해 주세요.', 400);
  }

  return {
    id: String(app.id || crypto.randomUUID()),
    title,
    description: String(app.description || '').trim().slice(0, 160),
    url,
    category,
    tags: normalizeTags(app.tags),
    thumbnailDataUrl,
    thumbnailAlt: String(app.thumbnailAlt || `${title} 썸네일`).trim(),
    isPublished: app.isPublished !== false,
    openInNewTab: app.openInNewTab !== false,
    sortOrder: Number.isFinite(Number(app.sortOrder)) ? Number(app.sortOrder) : null,
    createdAt: app.createdAt || now,
    updatedAt: now
  };
}

function userError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function mapDoc(doc) {
  return { id: doc.id, ...doc.data() };
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    if (!hasFirebaseEnv()) {
      return res.status(501).json({
        ok: false,
        message: 'Firebase 환경변수가 아직 설정되지 않았습니다. 클라이언트는 localStorage 모드로 전환됩니다.'
      });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const collection = db.collection(COLLECTION);

    if (req.method === 'GET') {
      const snapshot = await collection.orderBy('createdAt', 'desc').get();
      const apps = snapshot.docs.map(mapDoc);
      return res.status(200).json({ ok: true, apps });
    }

    if (req.method === 'POST') {
      verifyAdmin(req.body && req.body.code);
      const app = sanitizeApp(req.body && req.body.app);
      await collection.doc(app.id).set(app, { merge: true });
      return res.status(200).json({ ok: true, app });
    }

    if (req.method === 'DELETE') {
      verifyAdmin(req.body && req.body.code);
      const id = String((req.body && req.body.id) || '').trim();
      if (!id) throw userError('삭제할 앱 ID가 없습니다.', 400);
      await collection.doc(id).delete();
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ ok: false, message: '지원하지 않는 요청입니다.' });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ ok: false, message: error.message || '서버 오류가 발생했습니다.' });
  }
};
