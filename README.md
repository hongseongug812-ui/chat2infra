# Chat2Infra ⬡

> 채팅 한 줄로 끝내는 클라우드 인프라 구축 및 자동 관리 에이전트

자연어(한국어)로 AWS 인프라를 제어하는 AI 기반 클라우드 매니지먼트 MVP.

---

## 아키텍처

```
[사용자] → [React 채팅 UI] → [Express API]
                                    ↓
                            [Claude API + Tool Use]
                                    ↓
                            [AWS SDK 실제 호출]
                            ├── EC2 (생성/시작/중지/종료/조회)
                            ├── Cost Explorer (비용 조회)
                            └── CloudWatch (모니터링 - 확장 예정)
```

### 핵심 흐름
1. 사용자가 한국어로 명령 입력 ("서버 하나 만들어줘")
2. Express 서버가 Claude API에 메시지 + Tool 정의 전송
3. Claude가 의도 분석 후 적절한 Tool 호출 결정
4. Tool Executor가 실제 AWS SDK 호출 수행
5. 결과를 Claude에 다시 전달 → 한국어 응답 생성
6. 프론트엔드에 결과 표시 + 대시보드 자동 갱신

---

## 빠른 시작

### 1. 사전 준비

- **Node.js** 18 이상
- **AWS 계정** + IAM 사용자 (아래 권한 필요)
- **Anthropic API 키** (Claude API)

### 2. AWS IAM 권한

IAM 사용자에 다음 정책을 연결하세요:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:RunInstances",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:TerminateInstances",
        "ec2:CreateTags",
        "ec2:DescribeInstanceTypes",
        "ec2:DescribeSecurityGroups"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast"
      ],
      "Resource": "*"
    }
  ]
}
```

> ⚠️ **주의**: 프로덕션에서는 Resource를 특정 리소스로 제한하세요.

### 3. 설치

```bash
# 프로젝트 폴더로 이동
cd chat2infra

# 전체 의존성 설치 (루트 + 서버 + 클라이언트)
npm run install:all
```

### 4. 환경변수 설정

```bash
# 서버 환경변수 파일 생성
cp server/.env.example server/.env
```

`server/.env` 파일을 열고 값을 채우세요:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx      # Claude API 키
AWS_ACCESS_KEY_ID=AKIA...            # AWS Access Key
AWS_SECRET_ACCESS_KEY=xxxxx          # AWS Secret Key
AWS_REGION=ap-northeast-2            # 서울 리전
```

### 5. 실행

```bash
# 서버 + 클라이언트 동시 실행
npm run dev
```

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:4000

---

## 사용 예시

| 명령 | 동작 |
|------|------|
| "현재 서버 상태 보여줘" | EC2 인스턴스 전체 조회 |
| "t3.small 서버 하나 만들어줘, 이름은 web-prod" | EC2 인스턴스 생성 |
| "i-0abc123 서버 중지해줘" | 특정 인스턴스 중지 |
| "이번 달 AWS 비용 얼마야?" | Cost Explorer 조회 |
| "안 쓰는 서버 정리해줘" | 중지된 인스턴스 조회 후 삭제 제안 |

---

## 프로젝트 구조

```
chat2infra/
├── package.json              # 루트 (모노레포 스크립트)
├── README.md
├── client/                   # React 프론트엔드
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── index.js
│       ├── App.js            # 메인 레이아웃 (채팅 + 대시보드)
│       ├── components/
│       │   ├── ChatPanel.js  # 채팅 인터페이스
│       │   └── Dashboard.js  # 인프라 상태 대시보드
│       ├── styles/
│       │   └── global.css    # 다크 테마 글로벌 스타일
│       └── utils/
│           └── api.js        # Axios API 클라이언트
└── server/                   # Express 백엔드
    ├── package.json
    ├── .env.example
    └── src/
        ├── index.js          # Express 서버 엔트리
        ├── routes/
        │   ├── chat.js       # 채팅 API (/api/chat)
        │   └── infra.js      # 인프라 API (/api/infra/*)
        ├── services/
        │   ├── agentService.js   # Claude Tool Use 에이전트 루프
        │   ├── ec2Service.js     # AWS EC2 SDK 연동
        │   └── costService.js    # AWS Cost Explorer 연동
        ├── tools/
        │   ├── toolDefinitions.js # Claude Tool 정의 (7개)
        │   └── toolExecutor.js    # Tool → AWS SDK 매핑
        └── utils/
            └── logger.js     # Winston 로거
```

---

## MVP 이후 확장 로드맵

1. **RDS 지원** - DB 인스턴스 생성/관리
2. **보안 그룹 관리** - 자연어로 방화벽 규칙 설정
3. **비용 알림** - 카카오톡/슬랙 연동 알림
4. **Terraform 연동** - IaC 코드 자동 생성
5. **멀티 클라우드** - GCP, Azure 확장
6. **인증 시스템** - 사용자 로그인 + 멀티테넌시

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 18, Axios, Lucide Icons, React Markdown |
| 백엔드 | Node.js, Express, Winston |
| AI 엔진 | Claude Sonnet 4 (Tool Use) |
| 클라우드 | AWS SDK v3 (EC2, Cost Explorer) |
| 보안 | Helmet, Rate Limiting, CORS |

---

## 라이선스

MIT
