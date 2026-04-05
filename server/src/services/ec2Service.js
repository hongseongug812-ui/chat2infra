const {
  EC2Client,
  DescribeInstancesCommand,
  RunInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  TerminateInstancesCommand,
  DescribeInstanceTypesCommand,
  DescribeSecurityGroupsCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
} = require('@aws-sdk/client-ec2');
const store = require('../db/store');
const logger = require('../utils/logger');

function getEc2Client(awsConfig) {
  const cfg = awsConfig || {};
  const data = store.getAll();
  return new EC2Client({
    region: cfg.region || data.AWS_REGION || process.env.AWS_REGION || 'ap-northeast-2',
    credentials: {
      accessKeyId: cfg.accessKeyId || data.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: cfg.secretAccessKey || data.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

// 인스턴스 상태 한글 매핑
const STATE_MAP = {
  pending: '시작 중',
  running: '실행 중',
  'shutting-down': '종료 중',
  terminated: '종료됨',
  stopping: '중지 중',
  stopped: '중지됨',
};

/**
 * 모든 EC2 인스턴스 조회
 */
async function listInstances(awsConfig, filters = {}) {
  try {
    const params = {};

    if (filters.state) {
      params.Filters = [
        { Name: 'instance-state-name', Values: Array.isArray(filters.state) ? filters.state : [filters.state] },
      ];
    }

    if (filters.instanceIds) {
      params.InstanceIds = filters.instanceIds;
    }

    const command = new DescribeInstancesCommand(params);
    const response = await getEc2Client(awsConfig).send(command);

    const instances = [];
    for (const reservation of response.Reservations || []) {
      for (const inst of reservation.Instances || []) {
        const nameTag = (inst.Tags || []).find((t) => t.Key === 'Name');
        instances.push({
          instanceId: inst.InstanceId,
          name: nameTag?.Value || '(이름 없음)',
          type: inst.InstanceType,
          state: inst.State?.Name,
          stateKr: STATE_MAP[inst.State?.Name] || inst.State?.Name,
          publicIp: inst.PublicIpAddress || null,
          privateIp: inst.PrivateIpAddress || null,
          launchTime: inst.LaunchTime,
          az: inst.Placement?.AvailabilityZone,
          platform: inst.PlatformDetails || 'Linux/UNIX',
          vpcId: inst.VpcId,
          subnetId: inst.SubnetId,
          securityGroups: (inst.SecurityGroups || []).map((sg) => ({
            id: sg.GroupId,
            name: sg.GroupName,
          })),
          tags: (inst.Tags || []).reduce((acc, t) => {
            acc[t.Key] = t.Value;
            return acc;
          }, {}),
        });
      }
    }

    logger.info(`EC2 인스턴스 ${instances.length}개 조회 완료`);
    return { success: true, instances, count: instances.length };
  } catch (error) {
    logger.error('EC2 인스턴스 조회 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * EC2 인스턴스 생성
 */
async function launchInstance(awsConfig, {
  name = 'Chat2Infra-Instance',
  instanceType = 't3.micro',
  imageId,
  keyName,
  securityGroupIds,
  subnetId,
  count = 1,
}) {
  try {
    // 기본 AMI: Amazon Linux 2023 (ap-northeast-2)
    const ami = imageId || 'ami-0c9c942bd7bf113a2';

    const params = {
      ImageId: ami,
      InstanceType: instanceType,
      MinCount: count,
      MaxCount: count,
      TagSpecifications: [
        {
          ResourceType: 'instance',
          Tags: [
            { Key: 'Name', Value: name },
            { Key: 'ManagedBy', Value: 'Chat2Infra' },
            { Key: 'CreatedAt', Value: new Date().toISOString() },
          ],
        },
      ],
    };

    if (keyName) params.KeyName = keyName;
    if (securityGroupIds) params.SecurityGroupIds = securityGroupIds;
    if (subnetId) params.SubnetId = subnetId;

    const command = new RunInstancesCommand(params);
    const response = await getEc2Client(awsConfig).send(command);

    const created = (response.Instances || []).map((inst) => ({
      instanceId: inst.InstanceId,
      type: inst.InstanceType,
      state: inst.State?.Name,
    }));

    logger.info(`EC2 인스턴스 ${created.length}개 생성 완료:`, created.map((i) => i.instanceId));

    return {
      success: true,
      message: `인스턴스 ${created.length}개가 생성되었습니다.`,
      instances: created,
    };
  } catch (error) {
    logger.error('EC2 인스턴스 생성 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * EC2 인스턴스 시작
 */
async function startInstances(awsConfig, instanceIds) {
  try {
    const command = new StartInstancesCommand({ InstanceIds: instanceIds });
    const response = await getEc2Client(awsConfig).send(command);

    const results = (response.StartingInstances || []).map((i) => ({
      instanceId: i.InstanceId,
      previousState: i.PreviousState?.Name,
      currentState: i.CurrentState?.Name,
    }));

    logger.info(`EC2 인스턴스 시작:`, instanceIds);
    return { success: true, message: `${instanceIds.length}개 인스턴스를 시작했습니다.`, results };
  } catch (error) {
    logger.error('EC2 인스턴스 시작 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * EC2 인스턴스 중지
 */
async function stopInstances(awsConfig, instanceIds) {
  try {
    const command = new StopInstancesCommand({ InstanceIds: instanceIds });
    const response = await getEc2Client(awsConfig).send(command);

    const results = (response.StoppingInstances || []).map((i) => ({
      instanceId: i.InstanceId,
      previousState: i.PreviousState?.Name,
      currentState: i.CurrentState?.Name,
    }));

    logger.info(`EC2 인스턴스 중지:`, instanceIds);
    return { success: true, message: `${instanceIds.length}개 인스턴스를 중지했습니다.`, results };
  } catch (error) {
    logger.error('EC2 인스턴스 중지 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * EC2 인스턴스 종료 (삭제)
 */
async function terminateInstances(awsConfig, instanceIds) {
  try {
    const command = new TerminateInstancesCommand({ InstanceIds: instanceIds });
    const response = await getEc2Client(awsConfig).send(command);

    const results = (response.TerminatingInstances || []).map((i) => ({
      instanceId: i.InstanceId,
      previousState: i.PreviousState?.Name,
      currentState: i.CurrentState?.Name,
    }));

    logger.info(`EC2 인스턴스 종료:`, instanceIds);
    return { success: true, message: `${instanceIds.length}개 인스턴스를 종료(삭제)했습니다.`, results };
  } catch (error) {
    logger.error('EC2 인스턴스 종료 실패:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  listInstances,
  launchInstance,
  startInstances,
  stopInstances,
  terminateInstances,
};
