const { gmail } = require('../gmail');
const { parseEmailBody, extractTicketId } = require('./parserService');

/**
 * Email Service
 * Responsável por interagir com a API do Gmail: enviar e ler mensagens.
 */

/**
 * Envia um e-mail formatado (RFC 2822)
 * Suporta Threads e Alias (suporte@flexfrota.com)
 */
const sendEmail = async ({ to, subject, body, threadId = null, messageId = null }) => {
  const from = process.env.GMAIL_USER || 'suporte@flexfrota.com';
  
  // Construção do cabeçalho RFC 2822
  let emailLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
  ];

  if (threadId && messageId) {
    emailLines.push(`In-Reply-To: ${messageId}`);
    emailLines.push(`References: ${messageId}`);
  }

  emailLines.push('');
  emailLines.push(body);

  const email = emailLines.join('\r\n');
  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
        threadId: threadId
      }
    });
    console.log(`[EmailService] E-mail enviado para ${to}. ID: ${res.data.id}`);
    return res.data;
  } catch (error) {
    console.error(`[EmailService] Erro ao enviar e-mail:`, error.message);
    throw error;
  }
};

/**
 * Busca e-mails não lidos e processa o parsing
 */
const fetchUnreadEmails = async () => {
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread'
    });

    const messages = response.data.messages || [];
    const results = [];

    for (const msg of messages) {
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id
      });

      const processed = processMessage(details.data);
      if (processed) {
        results.push(processed);
        // Marcar como lido
        await gmail.users.messages.batchModify({
          userId: 'me',
          requestBody: {
            ids: [msg.id],
            removeLabelIds: ['UNREAD']
          }
        });
      }
    }

    return results;
  } catch (error) {
    console.error(`[EmailService] Erro ao buscar e-mails:`, error.message);
    return [];
  }
};

/**
 * Helper para extrair dados brutos da mensagem do Gmail
 */
const processMessage = (message) => {
  const headers = message.payload.headers;
  const subject = headers.find(h => h.name === 'Subject')?.value || '';
  const fromHeader = headers.find(h => h.name === 'From')?.value || '';
  const messageId = headers.find(h => h.name === 'Message-ID')?.value || '';
  const threadId = message.threadId;

  // Extrair corpo (suporta Multipart e Simples)
  let body = '';
  if (message.payload.parts) {
    const textPart = message.payload.parts.find(p => p.mimeType === 'text/plain');
    if (textPart && textPart.body.data) {
      body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    }
  } else if (message.payload.body && message.payload.body.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  }

  // Prevenir Loop: Não processar e-mails enviados pelo próprio sistema
  const systemEmail = process.env.GMAIL_USER || 'suporte@flexfrota.com';
  if (fromHeader.includes(systemEmail)) {
    console.log(`[EmailService] Ignorando e-mail do próprio sistema.`);
    return null;
  }

  const parsed = parseEmailBody(body, subject);
  const ticketId = extractTicketId(subject);

  return {
    subject,
    from: fromHeader,
    body,
    messageId,
    threadId,
    ticketId,
    parsed
  };
};

module.exports = { sendEmail, fetchUnreadEmails };
