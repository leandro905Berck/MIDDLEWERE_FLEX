require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const emailRoutes = require('./routes/email');
const { fetchUnreadEmails } = require('./services/emailService');
const { callSystemAPI } = require('./services/integrationService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rotas
app.use('/api', emailRoutes);

// Endpoint de Saúde (Health Check)
app.get('/', (req, res) => {
  res.send('Flex Kanban Middleware is running...');
});

// =============================================================
// LOOP DE POLLING (Sincronização de E-mails)
// =============================================================
const startPolling = () => {
  console.log('[Polling] Iniciando busca por e-mails não lidos...');
  
  setInterval(async () => {
    try {
      const newEmails = await fetchUnreadEmails();
      
      if (newEmails.length > 0) {
        console.log(`[Polling] ${newEmails.length} novo(s) e-mail(s) encontrado(s).`);
        
        for (const email of newEmails) {
          // Determina se é um ticket novo ou um comentário
          const action = email.ticketId ? 'add_comment' : 'create_card';
          
          const result = await callSystemAPI(action, {
            card_id: email.ticketId,
            title: email.subject,
            description: email.parsed.description || email.body, // Se não tiver parsing, usa o corpo completo
            from_email: email.from,
            thread_id: email.threadId,
            message_id: email.messageId,
            ...email.parsed // Campos extraídos (remessa, cnpj, etc.)
          });

          if (result.success) {
            console.log(`[Polling] E-mail processado e enviado para o Sistema.`);
          }
        }
      }
    } catch (error) {
      console.error('[Polling] Erro no ciclo de polling:', error.message);
    }
  }, 10000); // A cada 10 segundos
};

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`Middleware rodando na porta ${PORT}`);
  startPolling();
});
