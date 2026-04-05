const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const usersDb = require('../db/users');
const logger = require('../utils/logger');

router.use(authMiddleware);

// AWS 설정 조회
router.get('/', (req, res) => {
  if (req.user.isDemo) return res.json({ awsKeySet: false, awsRegion: 'ap-northeast-2' });
  const user = usersDb.findById(req.user.userId);
  res.json({
    awsKeySet: !!(user?.awsConfig?.accessKeyId && user?.awsConfig?.secretAccessKey),
    awsRegion: user?.awsConfig?.region || 'ap-northeast-2',
  });
});

// AWS 설정 저장
router.post('/', (req, res) => {
  if (req.user.isDemo) return res.status(403).json({ error: '데모 모드에서는 설정을 저장할 수 없습니다.' });

  const { awsAccessKeyId, awsSecretAccessKey, awsRegion } = req.body;
  usersDb.updateAwsConfig(req.user.userId, {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
    region: awsRegion || 'ap-northeast-2',
  });

  logger.info(`AWS 설정 저장: ${req.user.username}`);
  res.json({ success: true });
});

module.exports = router;
