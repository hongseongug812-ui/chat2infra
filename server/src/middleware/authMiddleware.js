const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chat2infra-secret-key';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '토큰이 유효하지 않습니다.' });
  }
}

module.exports = authMiddleware;
