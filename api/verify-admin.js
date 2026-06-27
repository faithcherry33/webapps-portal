const crypto = require('crypto');

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'POST 요청만 사용할 수 있습니다.' });
  }

  const adminCode = process.env.ADMIN_CODE;
  if (!adminCode) {
    return res.status(500).json({
      ok: false,
      message: 'Vercel 환경변수 ADMIN_CODE가 설정되어 있지 않습니다.'
    });
  }

  const code = req.body && req.body.code;
  if (!safeEqual(code, adminCode)) {
    return res.status(401).json({ ok: false, message: '관리자 코드가 올바르지 않습니다.' });
  }

  return res.status(200).json({ ok: true });
};
