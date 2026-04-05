const Anthropic = require('@anthropic-ai/sdk');
const tools = require('../tools/toolDefinitions');
const { executeTool } = require('../tools/toolExecutor');
const logger = require('../utils/logger');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 Chat2Infra의 AI 클라우드 매니저입니다.
사용자의 자연어 명령을 분석하여 AWS 인프라를 관리합니다.

## 역할
- 사용자의 한국어 명령을 이해하고 적절한 AWS 작업을 수행합니다.
- 인프라 상태를 쉽게 이해할 수 있도록 한국어로 설명합니다.
- 위험한 작업(삭제, 종료)은 반드시 사용자에게 확인을 요청합니다.

## 규칙
1. 모든 응답은 한국어로 합니다.
2. 인스턴스 종료(terminate) 요청 시 반드시 "정말 삭제하시겠습니까?"라고 확인합니다.
3. 비용 관련 질문에는 구체적인 금액과 함께 절감 팁을 제공합니다.
4. 기술 용어는 쉬운 한국어로 풀어 설명합니다.
5. 작업 결과를 구조화하여 명확하게 전달합니다.
6. 응답은 간결하게, 핵심만 전달합니다.

## 응답 형식
- 작업 결과는 요약 후 상세 내용을 제공합니다.
- 인스턴스 정보는 이름, ID, 상태, IP 등 핵심 정보만 포함합니다.
- 비용은 USD와 함께 대략적인 KRW 환산도 제공합니다 (1 USD ≈ 1,400 KRW 기준).`;

/**
 * Claude Tool Use 에이전트 루프
 * - 사용자 메시지 → Claude 분석 → Tool 호출 → 결과 → Claude 응답
 */
async function processChat(messages) {
  try {
    let currentMessages = [...messages];
    let iterationCount = 0;
    const MAX_ITERATIONS = 5; // Tool Use 무한 루프 방지

    while (iterationCount < MAX_ITERATIONS) {
      iterationCount++;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools,
        messages: currentMessages,
      });

      logger.debug(`Claude 응답 (반복 ${iterationCount}):`, {
        stopReason: response.stop_reason,
        contentTypes: response.content.map((c) => c.type),
      });

      // Tool Use가 아니면 최종 응답 반환
      if (response.stop_reason !== 'tool_use') {
        const textContent = response.content
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join('\n');

        return {
          success: true,
          message: textContent,
          toolsUsed: iterationCount - 1,
        };
      }

      // Tool Use 처리
      const toolUseBlocks = response.content.filter((c) => c.type === 'tool_use');
      const toolResults = [];

      for (const toolUse of toolUseBlocks) {
        logger.info(`Tool 호출: ${toolUse.name}`, toolUse.input);
        const result = await executeTool(toolUse.name, toolUse.input);

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      // 대화 히스토리에 assistant 응답과 tool 결과 추가
      currentMessages.push({ role: 'assistant', content: response.content });
      currentMessages.push({ role: 'user', content: toolResults });
    }

    return {
      success: true,
      message: '요청을 처리하는 데 너무 많은 단계가 필요합니다. 명령을 더 구체적으로 입력해주세요.',
      toolsUsed: MAX_ITERATIONS,
    };
  } catch (error) {
    logger.error('AI 에이전트 처리 실패:', error);

    if (error.status === 401) {
      return { success: false, error: 'Anthropic API 키가 올바르지 않습니다. .env 파일을 확인해주세요.' };
    }
    if (error.status === 429) {
      return { success: false, error: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' };
    }

    return { success: false, error: `AI 처리 중 오류가 발생했습니다: ${error.message}` };
  }
}

module.exports = { processChat };
