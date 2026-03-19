require('dotenv').config();
const axios = require('axios');

/**
 * Integration Service
 * Responsável por enviar os dados processados para o sistema PHP via Webhook.
 */

const callSystemAPI = async (action, data) => {
  const url = process.env.API_SISTEMA_URL;
  const apiKey = process.env.WEBHOOK_API_KEY;

  try {
    const payload = {
      api_key: apiKey,
      action: action,
      ...data
    };

    console.log(`[Integration] Enviando requisição para ${action}...`);
    
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.data && response.data.success) {
      console.log(`[Integration] Sucesso: ${response.data.message || 'Operação concluída'}`);
      return response.data;
    } else {
      console.error(`[Integration] Erro na API do Sistema:`, response.data.error || 'Erro desconhecido');
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    console.error(`[Integration] Erro de rede/servidor:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { callSystemAPI };
