/**
 * Claude Tool Use에 등록할 AWS 인프라 제어 도구 정의
 */
const tools = [
  {
    name: 'list_ec2_instances',
    description:
      '현재 AWS 계정의 EC2 인스턴스 목록을 조회합니다. 실행 중, 중지됨, 종료됨 등 모든 상태의 인스턴스를 확인할 수 있습니다.',
    input_schema: {
      type: 'object',
      properties: {
        state: {
          type: 'string',
          enum: ['running', 'stopped', 'pending', 'terminated', 'all'],
          description: '필터할 인스턴스 상태. "all"이면 모든 상태 조회.',
        },
      },
      required: [],
    },
  },
  {
    name: 'launch_ec2_instance',
    description:
      '새로운 EC2 인스턴스를 생성(런치)합니다. 인스턴스 타입, 이름 등을 지정할 수 있습니다.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '인스턴스 이름 (Name 태그)',
        },
        instanceType: {
          type: 'string',
          description: '인스턴스 타입 (예: t3.micro, t3.small, t3.medium, m5.large)',
          default: 't3.micro',
        },
        count: {
          type: 'number',
          description: '생성할 인스턴스 수',
          default: 1,
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'stop_ec2_instances',
    description: '실행 중인 EC2 인스턴스를 중지합니다. 중지된 인스턴스는 스토리지 비용만 발생합니다.',
    input_schema: {
      type: 'object',
      properties: {
        instanceIds: {
          type: 'array',
          items: { type: 'string' },
          description: '중지할 인스턴스 ID 배열 (예: ["i-0abc123def456"])',
        },
      },
      required: ['instanceIds'],
    },
  },
  {
    name: 'start_ec2_instances',
    description: '중지된 EC2 인스턴스를 다시 시작합니다.',
    input_schema: {
      type: 'object',
      properties: {
        instanceIds: {
          type: 'array',
          items: { type: 'string' },
          description: '시작할 인스턴스 ID 배열',
        },
      },
      required: ['instanceIds'],
    },
  },
  {
    name: 'terminate_ec2_instances',
    description:
      'EC2 인스턴스를 완전히 종료(삭제)합니다. 이 작업은 되돌릴 수 없으며, 인스턴스와 연결된 EBS 볼륨도 삭제될 수 있습니다. 실행 전 반드시 사용자에게 확인을 받아야 합니다.',
    input_schema: {
      type: 'object',
      properties: {
        instanceIds: {
          type: 'array',
          items: { type: 'string' },
          description: '종료할 인스턴스 ID 배열',
        },
      },
      required: ['instanceIds'],
    },
  },
  {
    name: 'get_current_month_cost',
    description: '이번 달의 AWS 비용을 서비스별로 조회합니다. 총 비용과 서비스별 상세 비용을 확인할 수 있습니다.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_daily_costs',
    description: '최근 며칠간의 일별 AWS 비용 추이를 조회합니다.',
    input_schema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: '조회할 일수 (기본 7일)',
          default: 7,
        },
      },
      required: [],
    },
  },
];

module.exports = tools;
