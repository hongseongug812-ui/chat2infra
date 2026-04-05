const ec2Service = require('../services/ec2Service');
const costService = require('../services/costService');
const logger = require('../utils/logger');

// 데모 모드용 mock 데이터
const DEMO_INSTANCES = [
  { instanceId: 'i-0demo001abc', name: 'web-prod', type: 't3.small', state: 'running', stateKr: '실행 중', publicIp: '54.180.23.67', privateIp: '10.0.1.10', az: 'ap-northeast-2a', platform: 'Linux/UNIX', vpcId: 'vpc-demo', subnetId: 'subnet-demo', securityGroups: [], tags: { Name: 'web-prod' } },
  { instanceId: 'i-0demo002def', name: 'api-server', type: 't3.medium', state: 'running', stateKr: '실행 중', publicIp: '13.124.55.12', privateIp: '10.0.1.11', az: 'ap-northeast-2b', platform: 'Linux/UNIX', vpcId: 'vpc-demo', subnetId: 'subnet-demo', securityGroups: [], tags: { Name: 'api-server' } },
  { instanceId: 'i-0demo003ghi', name: 'batch-worker', type: 't3.micro', state: 'stopped', stateKr: '중지됨', publicIp: null, privateIp: '10.0.2.5', az: 'ap-northeast-2a', platform: 'Linux/UNIX', vpcId: 'vpc-demo', subnetId: 'subnet-demo', securityGroups: [], tags: { Name: 'batch-worker' } },
];

const DEMO_COST = {
  success: true, totalCost: 127.43, currency: 'USD',
  period: { start: '2026-04-01', end: '2026-04-06' },
  services: [
    { service: 'Amazon EC2', cost: 89.20 },
    { service: 'Amazon RDS', cost: 24.15 },
    { service: 'Amazon S3', cost: 8.32 },
    { service: 'AWS Data Transfer', cost: 5.76 },
  ],
};

async function executeTool(toolName, toolInput, context = {}) {
  const { awsConfig, isDemo } = context;
  logger.info(`도구 실행: ${toolName}`, { input: toolInput, demo: isDemo });

  switch (toolName) {
    case 'list_ec2_instances': {
      if (isDemo) return { success: true, instances: DEMO_INSTANCES, count: DEMO_INSTANCES.length };
      const state = toolInput.state === 'all' ? undefined : toolInput.state;
      return await ec2Service.listInstances(awsConfig, state ? { state } : {});
    }

    case 'launch_ec2_instance': {
      if (isDemo) return { success: true, message: `[데모] ${toolInput.name} 인스턴스가 생성되었습니다. (실제 생성 안 됨)`, instances: [{ instanceId: 'i-0demo_new', type: toolInput.instanceType || 't3.micro', state: 'pending' }] };
      return await ec2Service.launchInstance(awsConfig, { name: toolInput.name, instanceType: toolInput.instanceType || 't3.micro', count: toolInput.count || 1 });
    }

    case 'stop_ec2_instances': {
      if (!toolInput.instanceIds?.length) return { success: false, error: '중지할 인스턴스 ID를 지정해주세요.' };
      if (isDemo) return { success: true, message: `[데모] ${toolInput.instanceIds.length}개 인스턴스 중지 시뮬레이션 완료.` };
      return await ec2Service.stopInstances(awsConfig, toolInput.instanceIds);
    }

    case 'start_ec2_instances': {
      if (!toolInput.instanceIds?.length) return { success: false, error: '시작할 인스턴스 ID를 지정해주세요.' };
      if (isDemo) return { success: true, message: `[데모] ${toolInput.instanceIds.length}개 인스턴스 시작 시뮬레이션 완료.` };
      return await ec2Service.startInstances(awsConfig, toolInput.instanceIds);
    }

    case 'terminate_ec2_instances': {
      if (!toolInput.instanceIds?.length) return { success: false, error: '종료할 인스턴스 ID를 지정해주세요.' };
      if (isDemo) return { success: true, message: `[데모] 종료 시뮬레이션 완료. (실제 삭제 안 됨)` };
      return await ec2Service.terminateInstances(awsConfig, toolInput.instanceIds);
    }

    case 'get_current_month_cost': {
      if (isDemo) return DEMO_COST;
      return await costService.getCurrentMonthCost(awsConfig);
    }

    case 'get_daily_costs': {
      if (isDemo) return { success: true, days: toolInput.days || 7, dailyCosts: Array.from({ length: toolInput.days || 7 }, (_, i) => ({ date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0], cost: +(Math.random() * 20 + 15).toFixed(2) })) };
      return await costService.getDailyCosts(awsConfig, toolInput.days || 7);
    }

    default:
      logger.warn(`알 수 없는 도구: ${toolName}`);
      return { success: false, error: `알 수 없는 도구입니다: ${toolName}` };
  }
}

module.exports = { executeTool, DEMO_INSTANCES, DEMO_COST };
