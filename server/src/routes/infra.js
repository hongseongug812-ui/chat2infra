const express = require('express');
const router = express.Router();
const ec2Service = require('../services/ec2Service');
const costService = require('../services/costService');
const logger = require('../utils/logger');

/**
 * GET /api/infra/instances
 * EC2 인스턴스 목록 (대시보드 카드용)
 */
router.get('/instances', async (req, res) => {
  try {
    const result = await ec2Service.listInstances({
      state: ['running', 'stopped', 'pending', 'stopping'],
    });
    res.json(result);
  } catch (error) {
    logger.error('인스턴스 조회 API 오류:', error);
    res.status(500).json({ error: '인스턴스 조회 실패' });
  }
});

/**
 * GET /api/infra/cost
 * 이번 달 비용 요약
 */
router.get('/cost', async (req, res) => {
  try {
    const result = await costService.getCurrentMonthCost();
    res.json(result);
  } catch (error) {
    logger.error('비용 조회 API 오류:', error);
    res.status(500).json({ error: '비용 조회 실패' });
  }
});

/**
 * GET /api/infra/cost/daily
 * 일별 비용 추이
 */
router.get('/cost/daily', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const result = await costService.getDailyCosts(days);
    res.json(result);
  } catch (error) {
    logger.error('일별 비용 조회 API 오류:', error);
    res.status(500).json({ error: '일별 비용 조회 실패' });
  }
});

/**
 * POST /api/infra/kill-switch
 * 킬 스위치 - 실행 중인 모든 인스턴스 중지
 */
router.post('/kill-switch', async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== 'CONFIRM_STOP_ALL') {
      return res.status(400).json({
        error: '킬 스위치를 실행하려면 confirm 값을 "CONFIRM_STOP_ALL"로 보내주세요.',
        requireConfirm: true,
      });
    }

    // 실행 중인 인스턴스 조회
    const listResult = await ec2Service.listInstances({ state: 'running' });
    if (!listResult.success || listResult.count === 0) {
      return res.json({ success: true, message: '실행 중인 인스턴스가 없습니다.', stopped: 0 });
    }

    const instanceIds = listResult.instances.map((i) => i.instanceId);
    const stopResult = await ec2Service.stopInstances(instanceIds);

    res.json({
      ...stopResult,
      stopped: instanceIds.length,
      message: `${instanceIds.length}개의 인스턴스를 모두 중지했습니다.`,
    });
  } catch (error) {
    logger.error('킬 스위치 오류:', error);
    res.status(500).json({ error: '킬 스위치 실행 실패' });
  }
});

module.exports = router;
