require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const chatRouter = require('./routes/chat');
const infraRouter = require('./routes/infra');
const settingsRouter = require('./routes/settings');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 60, message: { error: '요청이 너무 많습니다.' } });
app.use('/api', limiter);

app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/infra', infraRouter);
app.use('/api/settings', settingsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

app.listen(PORT, () => {
  logger.info(`Chat2Infra 서버 실행 중: http://localhost:${PORT}`);
  logger.info(`환경: ${process.env.NODE_ENV || 'development'}`);
});
