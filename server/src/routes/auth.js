const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('crypto').webcrypto ? require('crypto') : { v4: () => Math.random().toString(36).slice(2) };
const usersDb = require('../db/users');
const logger = require('../utils/logger');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chat2infra-secret-key';

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });
    if (password.length < 6) return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' });

    if (usersDb.findByUsername(username)) {
      return res.status(409).json({ error: '이미 사용 중인 아이디입니다.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: require('crypto').randomUUID(),
      username,
      passwordHash,
      awsConfig: null,
      createdAt: new Date().toISOString(),
    };
    usersDb.create(user);

    const token = makeToken({ userId: user.id, username: user.username, isDemo: false });
    logger.info(`새 사용자 등록: ${username}`);
    res.json({ token, username: user.username });
  } catch (error) {
    logger.error('회원가입 오류:', error);
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });

    const user = usersDb.findByUsername(username);
    if (!user) return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });

    const token = makeToken({ userId: user.id, username: user.username, isDemo: false });
    logger.info(`로그인: ${username}`);
    res.json({ token, username: user.username, hasAwsConfig: !!user.awsConfig });
  } catch (error) {
    logger.error('로그인 오류:', error);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
  }
});

// 데모 로그인
router.post('/demo', (req, res) => {
  const token = makeToken({ userId: 'demo', username: '데모 사용자', isDemo: true });
  res.json({ token, username: '데모 사용자', isDemo: true });
});

module.exports = router;
