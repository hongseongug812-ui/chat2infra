require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const chatRouter = require('./routes/chat');
const infraRouter = require('./routes/infra');

const app = express();
const PORT = process.env.PORT || 4000;

// 보안 미들웨어
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 30,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }
});
app.use('/api', limiter);

// 라우트
app.use('/api/chat', chatRouter);
app.use('/api/infra', infraRouter);

// 헬스체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

app.listen(PORT, () => {
  logger.info(`Chat2Infra 서버 실행 중: http://localhost:${PORT}`);
  logger.info(`환경: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`AWS 리전: ${process.env.AWS_REGION || 'ap-northeast-2'}`);
});
