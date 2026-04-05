const express = require('express');
const router = express.Router();
const ec2Service = require('../services/ec2Service');
const costService = require('../services/costService');
const authMiddleware = require('../middleware/authMiddleware');
const usersDb = require('../db/users');
const { DEMO_INSTANCES, DEMO_COST } = require('../tools/toolExecutor');
const logger = require('../utils/logger');

function getAwsConfig(req) {
  if (req.user.isDemo) return null;
  const user = usersDb.findById(req.user.userId);
  return user?.awsConfig || null;
}

router.use(authMiddleware);

router.get('/instances', async (req, res) => {
  try {
    if (req.user.isDemo) return res.json({ success: true, instances: DEMO_INSTANCES, count: DEMO_INSTANCES.length });
    const result = await ec2Service.listInstances(getAwsConfig(req), { state: ['running', 'stopped', 'pending', 'stopping'] });
    res.json(result);
  } catch (error) {
    logger.error('인스턴스 조회 API 오류:', error);
    res.status(500).json({ error: '인스턴스 조회 실패' });
  }
});

router.get('/cost', async (req, res) => {
  try {
    if (req.user.isDemo) return res.json(DEMO_COST);
    const result = await costService.getCurrentMonthCost(getAwsConfig(req));
    res.json(result);
  } catch (error) {
    logger.error('비용 조회 API 오류:', error);
    res.status(500).json({ error: '비용 조회 실패' });
  }
});

router.get('/cost/daily', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    if (req.user.isDemo) {
      return res.json({ success: true, days, dailyCosts: Array.from({ length: days }, (_, i) => ({ date: new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().split('T')[0], cost: +(Math.random() * 20 + 15).toFixed(2) })) });
    }
    const result = await costService.getDailyCosts(getAwsConfig(req), days);
    res.json(result);
  } catch (error) {
    logger.error('일별 비용 조회 API 오류:', error);
    res.status(500).json({ error: '일별 비용 조회 실패' });
  }
});

router.post('/kill-switch', async (req, res) => {
  try {
    const { confirm } = req.body;
    if (confirm !== 'CONFIRM_STOP_ALL') return res.status(400).json({ error: '킬 스위치를 실행하려면 confirm 값을 "CONFIRM_STOP_ALL"로 보내주세요.', requireConfirm: true });
    if (req.user.isDemo) return res.json({ success: true, message: '[데모] 킬 스위치 시뮬레이션 완료.', stopped: 2 });

    const awsConfig = getAwsConfig(req);
    const listResult = await ec2Service.listInstances(awsConfig, { state: 'running' });
    if (!listResult.success || listResult.count === 0) return res.json({ success: true, message: '실행 중인 인스턴스가 없습니다.', stopped: 0 });

    const instanceIds = listResult.instances.map((i) => i.instanceId);
    const stopResult = await ec2Service.stopInstances(awsConfig, instanceIds);
    res.json({ ...stopResult, stopped: instanceIds.length, message: `${instanceIds.length}개의 인스턴스를 모두 중지했습니다.` });
  } catch (error) {
    logger.error('킬 스위치 오류:', error);
    res.status(500).json({ error: '킬 스위치 실행 실패' });
  }
});

module.exports = router;
