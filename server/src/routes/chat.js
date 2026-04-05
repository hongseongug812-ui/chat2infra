const express = require('express');
const router = express.Router();
const { processChat } = require('../services/agentService');
const logger = require('../utils/logger');

/**
 * POST /api/chat
 * 사용자 메시지를 받아 AI 에이전트로 처리
 */
router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '메시지가 필요합니다.' });
    }

    // 메시지 형식 검증
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const lastMessage = formattedMessages[formattedMessages.length - 1];
    logger.info(`사용자 메시지: ${typeof lastMessage.content === 'string' ? lastMessage.content.substring(0, 100) : '[complex]'}`);

    const result = await processChat(formattedMessages);

    if (result.success) {
      res.json({
        message: result.message,
        toolsUsed: result.toolsUsed || 0,
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    logger.error('채팅 API 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
