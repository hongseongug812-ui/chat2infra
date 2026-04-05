const {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostForecastCommand,
} = require('@aws-sdk/client-cost-explorer');
const logger = require('../utils/logger');

const costExplorer = new CostExplorerClient({
  region: 'us-east-1', // Cost Explorer는 항상 us-east-1
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * 이번 달 비용 조회
 */
async function getCurrentMonthCost() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: startOfMonth.toISOString().split('T')[0],
        End: tomorrow.toISOString().split('T')[0],
      },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost', 'UsageQuantity'],
      GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
    });

    const response = await costExplorer.send(command);
    const results = response.ResultsByTime?.[0];

    if (!results) {
      return { success: true, totalCost: 0, currency: 'USD', services: [] };
    }

    let totalCost = 0;
    const services = (results.Groups || [])
      .map((group) => {
        const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || 0);
        totalCost += cost;
        return {
          service: group.Keys?.[0] || 'Unknown',
          cost: Math.round(cost * 100) / 100,
          currency: group.Metrics?.UnblendedCost?.Unit || 'USD',
        };
      })
      .filter((s) => s.cost > 0)
      .sort((a, b) => b.cost - a.cost);

    const result = {
      success: true,
      period: {
        start: startOfMonth.toISOString().split('T')[0],
        end: tomorrow.toISOString().split('T')[0],
      },
      totalCost: Math.round(totalCost * 100) / 100,
      currency: 'USD',
      services,
    };

    // 비용 알림 임계값 체크
    const threshold = parseFloat(process.env.COST_ALERT_THRESHOLD || 50);
    if (totalCost > threshold) {
      result.alert = {
        level: 'warning',
        message: `이번 달 비용($${result.totalCost})이 임계값($${threshold})을 초과했습니다!`,
      };
    }

    logger.info(`이번 달 총 비용: $${result.totalCost}`);
    return result;
  } catch (error) {
    logger.error('비용 조회 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 최근 7일 일별 비용 조회
 */
async function getDailyCosts(days = 7) {
  try {
    const end = new Date();
    end.setDate(end.getDate() + 1);
    const start = new Date();
    start.setDate(start.getDate() - days);

    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: start.toISOString().split('T')[0],
        End: end.toISOString().split('T')[0],
      },
      Granularity: 'DAILY',
      Metrics: ['UnblendedCost'],
    });

    const response = await costExplorer.send(command);

    const dailyCosts = (response.ResultsByTime || []).map((period) => ({
      date: period.TimePeriod?.Start,
      cost: Math.round(parseFloat(period.Total?.UnblendedCost?.Amount || 0) * 100) / 100,
      currency: period.Total?.UnblendedCost?.Unit || 'USD',
    }));

    return { success: true, dailyCosts, days };
  } catch (error) {
    logger.error('일별 비용 조회 실패:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getCurrentMonthCost,
  getDailyCosts,
};
