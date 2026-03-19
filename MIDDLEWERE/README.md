# Flex Kanban Middleware (Gmail Integration)

Este é o serviço intermediário responsável por conectar o Gmail ao Sistema de Kanban da Flex. Ele lida com o polling de e-mails, parsing de dados e envio de notificações.

## 🚀 Como Funciona
1. **Entrada**: O middleware busca e-mails não lidos no Gmail a cada 10 segundos.
2. **Parsing**: Extrai dados de Remessa, Cliente, CNPJ, Placas, etc., dos 4 modelos de e-mail (Cartão, TAG, Rastreador, POS).
3. **Sincronização**: Envia os dados para o `api/webhook.php` do seu sistema Kanban.
4. **Saída**: O sistema PHP chama o endpoint `/api/send-email` para notificar o cliente sobre mudanças de status ou comentários.

## 🛠️ Configuração Local
1. Entre na pasta `MIDDLEWERE`.
2. Execute `npm install` para instalar as dependências.
3. Copie o arquivo `.env.example` para `.env` e preencha as credenciais.
4. Execute `npm start` para rodar o servidor.

## 🌐 Deploy no Render
1. Suba esta pasta para um repositório no GitHub.
2. No [Render](https://render.com/), crie um novo **Web Service**.
3. Conecte o repositório.
4. Em **Environment Variables**, adicione todas as chaves do seu arquivo `.env`.
5. O comando de build será `npm install` e o de start será `npm start`.

### ⚠️ Importante após o Deploy
Após obter a URL do seu serviço no Render (ex: `https://seu-app.onrender.com`), você deve atualizar a constante `MIDDLEWARE_URL` no arquivo `config/config.php` do seu sistema PHP:

```php
define('MIDDLEWARE_URL', 'https://seu-app.onrender.com/api/send-email');
```

## 🔒 Segurança
A comunicação entre o PHP e o Node é protegida pelo `INTERNAL_TOKEN`. Certifique-se de que ele seja idêntico em ambos os lados.
