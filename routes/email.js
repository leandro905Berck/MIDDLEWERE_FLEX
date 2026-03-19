const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');

/**
 * Endpoint: POST /send-email
 * Acionado pelo sistema PHP para enviar notificações por e-mail.
 */
router.post('/send-email', async (req, res) => {
  const { to, subject, body, threadId, messageId, token } = req.body;

  // Validação simples de Token Interno
  if (token !== process.env.INTERNAL_TOKEN) {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }

  if (!to || !subject || !body) {
    return res.status(400).json({ success: false, error: 'Campos obrigatórios: to, subject, body' });
  }

  try {
    const result = await sendEmail({ to, subject, body, threadId, messageId });
    res.json({ success: true, messageId: result.id, threadId: result.threadId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
