/**
 * Parser Service
 * Responsável por extrair dados estruturados dos corpos de e-mail (Gmail)
 * com base nos templates do Google Apps Script (Cartão, TAG, Rastreador, POS).
 */

const parseEmailBody = (body, subject) => {
  const data = {};
  const lines = body.split('\n');
  let currentLabel = null;

  // 1. Detecção de Categoria pelo Assunto
  if (subject.includes('Novo Cartão Frota')) data.category = 'cartao';
  else if (subject.includes('Nova Solicitação TAG')) data.category = 'tag';
  else if (subject.includes('Nova Solicitação Rastreador')) data.category = 'rastreador';
  else if (subject.includes('Nova Solicitação POS')) data.category = 'pos';
  else data.category = 'cartao';

  // 2. Extração de Campos por Rótulo (- RÓTULO: VALOR)
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      const match = trimmed.match(/^- ([^:]+):\s*(.*)$/);
      if (match) {
        currentLabel = match[1].trim().toUpperCase();
        const value = match[2].trim();
        if (value) {
          assignField(data, currentLabel, value);
        }
      }
    } else if (currentLabel && trimmed !== '' && !trimmed.startsWith('INFORMAÇÕES')) {
      // Lógica para capturar linhas múltiplas (ex: Placas, Observação)
      appendField(data, currentLabel, trimmed);
    } else if (trimmed === '') {
      currentLabel = null;
    }
  });

  // 3. Pós-processamento
  finalizeData(data);

  return data;
};

/**
 * Mapeia os rótulos do e-mail para as chaves do banco de dados (PHP Webhook)
 */
const assignField = (data, label, value) => {
  switch (label) {
    case 'Nº REMESSA':
      data.remessa = value;
      break;
    case 'CLIENTE':
    case 'POSTO':
      data.company_name = value;
      break;
    case 'CNPJ':
      data.cnpj = value;
      break;
    case 'E-MAIL':
    case 'E-MAIL DO CLIENTE':
      data.client_email = value;
      break;
    case 'TIPO DE SERVIÇO':
      data.pos_request_type = value;
      break;
    case 'MOTIVO':
      data.pos_reason = value;
      break;
    case 'CÓDIGO DE RASTREIO OU REVERSO':
      data.reverse_tracking_code = value;
      break;
    case 'PLACA':
    case 'PLACA DO VEÍCULO':
      data.placa_raw = value; // Temporário para múltiplas placas
      break;
    case 'OBSERVAÇÃO':
      data.description = value;
      break;
    case 'ENDEREÇO':
    case 'ENDEREÇO DE ENTREGA':
      data.address = value;
      break;
    case 'CEP':
      data.cep = value;
      break;
    case 'MODELO':
      data.modelo = value;
      break;
    case 'NÚMERO DE SÉRIE':
      data.serial = value;
      break;
    case 'ICCID DO CHIP':
      data.iccid = value;
      break;
    case 'OPERADORA DO CHIP':
      data.carrier = value;
      break;
  }
};

const appendField = (data, label, value) => {
  if (label === 'PLACA' || label === 'PLACA DO VEÍCULO') {
    data.placa_raw = (data.placa_raw || '') + '\n' + value;
  } else if (label === 'OBSERVAÇÃO') {
    data.description = (data.description || '') + '\n' + value;
  } else if (label === 'ENDEREÇO' || label === 'ENDEREÇO DE ENTREGA') {
    data.address = (data.address || '') + '\n' + value;
  }
};

const finalizeData = (data) => {
  // Unificar Endereço + CEP
  if (data.cep) {
    data.address = (data.address || '') + '\nCEP: ' + data.cep;
    delete data.cep;
  }

  // Processar Placas para extra_data (items JSON)
  if (data.placa_raw) {
    const plates = data.placa_raw.split('\n').map(p => p.trim()).filter(p => p);
    data.placa = plates[0] || ''; // Primeira placa no campo legado
    data.items = plates.map(p => ({ placa: p }));
    delete data.placa_raw;
  }

  // Título padrão se não existir
  if (!data.title) {
    data.title = `Solicitação ${data.category.toUpperCase()} - ${data.company_name || 'Sem Nome'}`;
  }
};

const extractTicketId = (subject) => {
  const match = subject.match(/\[CHAMADO\s*#(\d+)\]/i);
  return match ? match[1] : null;
};

module.exports = { parseEmailBody, extractTicketId };
