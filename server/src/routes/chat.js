const express = require('express');
const router = express.Router();
const { processChat } = require('../services/agentService');
const authMiddleware = require('../middleware/authMiddleware');
const usersDb = require('../db/users');
const logger = require('../utils/logger');

router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '메시지가 필요합니다.' });
    }

    const formattedMessages = messages.map((msg) => ({ role: msg.role, content: msg.content }));
    const lastMessage = formattedMessages[formattedMessages.length - 1];
    logger.info(`[${req.user.username}] 메시지: ${typeof lastMessage.content === 'string' ? lastMessage.content.substring(0, 100) : '[complex]'}`);

    const user = req.user.isDemo ? null : usersDb.findById(req.user.userId);
    const context = { isDemo: req.user.isDemo, awsConfig: user?.awsConfig || null };

    const result = await processChat(formattedMessages, context);

    if (result.success) {
      res.json({ message: result.message, toolsUsed: result.toolsUsed || 0 });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    logger.error('채팅 API 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
