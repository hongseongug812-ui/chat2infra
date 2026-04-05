const ec2Service = require('../services/ec2Service');
const costService = require('../services/costService');
const logger = require('../utils/logger');

/**
 * Claude가 요청한 tool_use를 실제 AWS SDK 호출로 실행
 */
async function executeTool(toolName, toolInput) {
  logger.info(`도구 실행: ${toolName}`, { input: toolInput });

  switch (toolName) {
    case 'list_ec2_instances': {
      const state = toolInput.state === 'all' ? undefined : toolInput.state;
      return await ec2Service.listInstances(state ? { state } : {});
    }

    case 'launch_ec2_instance': {
      return await ec2Service.launchInstance({
        name: toolInput.name,
        instanceType: toolInput.instanceType || 't3.micro',
        count: toolInput.count || 1,
      });
    }

    case 'stop_ec2_instances': {
      if (!toolInput.instanceIds?.length) {
        return { success: false, error: '중지할 인스턴스 ID를 지정해주세요.' };
      }
      return await ec2Service.stopInstances(toolInput.instanceIds);
    }

    case 'start_ec2_instances': {
      if (!toolInput.instanceIds?.length) {
        return { success: false, error: '시작할 인스턴스 ID를 지정해주세요.' };
      }
      return await ec2Service.startInstances(toolInput.instanceIds);
    }

    case 'terminate_ec2_instances': {
      if (!toolInput.instanceIds?.length) {
        return { success: false, error: '종료할 인스턴스 ID를 지정해주세요.' };
      }
      return await ec2Service.terminateInstances(toolInput.instanceIds);
    }

    case 'get_current_month_cost': {
      return await costService.getCurrentMonthCost();
    }

    case 'get_daily_costs': {
      return await costService.getDailyCosts(toolInput.days || 7);
    }

    default:
      logger.warn(`알 수 없는 도구: ${toolName}`);
      return { success: false, error: `알 수 없는 도구입니다: ${toolName}` };
  }
}

module.exports = { executeTool };
