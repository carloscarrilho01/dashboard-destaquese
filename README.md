# Painel de Monitoramento WhatsApp Bot

Painel web para monitorar conversas de um agente WhatsApp criado no n8n.

## Funcionalidades

- **Monitoramento em Tempo Real**: Visualize mensagens conforme chegam via WebSocket
- **Lista de Contatos**: Veja todos os contatos que interagiram com o bot
- **Histórico de Conversas**: Acesse o histórico completo de mensagens por contato
- **Estatísticas**: Visualize métricas como total de mensagens, contatos e pendências
- **Filtros**: Filtre mensagens por tipo (recebidas/enviadas)
- **Interface Responsiva**: Design moderno inspirado no WhatsApp Web
- **Busca de Contatos**: Encontre contatos rapidamente

## Tecnologias

- **Backend**: Node.js, Express, WebSocket
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Banco de Dados**: SQLite (desenvolvimento) ou PostgreSQL (produção)

## Instalação

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

#### Opção A: SQLite (desenvolvimento local)

Não precisa configurar nada! O SQLite será criado automaticamente em `./conversations.db`

#### Opção B: PostgreSQL (recomendado para produção)

1. Crie um arquivo `.env` na raiz do projeto:

```env
# Tipo de banco de dados
DATABASE_TYPE=postgres

# Configurações PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=seu_usuario
POSTGRES_PASSWORD=sua_senha
POSTGRES_DATABASE=seu_banco
POSTGRES_SSL=false

# Porta do servidor
PORT=3000
```

2. O sistema criará automaticamente as tabelas necessárias:
   - `conversations` - Histórico de mensagens do webhook
   - `contacts` - Contatos do webhook
   - `leads` - Seus leads do banco de dados
   - `chats` - Histórico de chats do banco de dados

#### Opção C: Turso (SQLite na nuvem)

```env
TURSO_DATABASE_URL=libsql://seu-db.turso.io
TURSO_AUTH_TOKEN=seu_token_aqui
```

### 3. Migração de Dados (Opcional)

Se você já tem dados em SQLite e quer migrar para PostgreSQL:

```bash
node scripts/migrate-to-postgres.js
```

### 4. Iniciar o Servidor

```bash
npm start
```

Ou para desenvolvimento com auto-reload:

```bash
npm run dev
```

O servidor estará disponível em: `http://localhost:3000`

## Configuração no n8n

### Webhook para Enviar Mensagens ao Painel

No seu workflow do n8n, adicione um nó HTTP Request para enviar dados ao painel:

**URL**: `http://localhost:3000/api/webhook/message`

**Método**: POST

**Body (JSON)**:

```json
{
  "phone_number": "5511999999999",
  "contact_name": "Nome do Contato",
  "message": "Texto da mensagem",
  "message_type": "received",
  "metadata": {
    "chat_id": "123456",
    "message_id": "msg_123"
  }
}
```

### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `phone_number` | string | Sim | Número de telefone no formato internacional |
| `contact_name` | string | Não | Nome do contato |
| `message` | string | Sim | Conteúdo da mensagem |
| `message_type` | string | Não | Tipo: "received" (padrão) ou "sent" |
| `metadata` | object | Não | Dados adicionais (JSON) |

### Exemplo de Workflow n8n

```
1. Trigger (WhatsApp)
   ↓
2. Processar Mensagem
   ↓
3. HTTP Request → Enviar para Painel
   URL: http://localhost:3000/api/webhook/message
   Method: POST
   Body:
   {
     "phone_number": "{{$json.from}}",
     "contact_name": "{{$json.contact_name}}",
     "message": "{{$json.body}}",
     "message_type": "received"
   }
   ↓
4. Responder via WhatsApp
   ↓
5. HTTP Request → Enviar Resposta para Painel
   URL: http://localhost:3000/api/webhook/message
   Method: POST
   Body:
   {
     "phone_number": "{{$json.from}}",
     "contact_name": "{{$json.contact_name}}",
     "message": "{{$json.reply}}",
     "message_type": "sent"
   }
```

## API Endpoints

### Conversações (Webhook)

#### POST /api/webhook/message
Recebe uma nova mensagem do n8n

#### GET /api/conversations
Lista conversas com filtros opcionais
- Query params: `phone_number`, `limit`, `offset`

#### GET /api/contacts
Lista todos os contatos

#### GET /api/stats
Retorna estatísticas do sistema

#### PUT /api/conversations/:id/status
Atualiza o status de uma mensagem
- Body: `{ "status": "answered" }`

#### DELETE /api/conversations/:id
Remove uma conversa

---

### Leads (Seu Banco de Dados)

#### GET /api/leads
Lista todos os leads
- Query params: `limit`, `offset`, `trava`, `nome`
- Exemplo: `/api/leads?trava=true&limit=50`

#### GET /api/leads/stats
Retorna estatísticas dos leads (total, travados, hoje)

#### GET /api/leads/:id
Busca um lead específico por ID

#### POST /api/leads
Cria um novo lead
```json
{
  "numero": "5511999999999",
  "nome": "João Silva",
  "followupsequencia": "seq_001",
  "followupsequenciamsgid": "msg_001",
  "trava": false
}
```

#### PUT /api/leads/:id
Atualiza um lead existente
```json
{
  "nome": "João Silva Atualizado",
  "trava": true
}
```

#### DELETE /api/leads/:id
Remove um lead

---

### Chats (Seu Banco de Dados)

#### GET /api/chats
Lista todos os chats
- Query params: `session_id`, `limit`, `offset`
- Exemplo: `/api/chats?session_id=556392728900&limit=50`

#### GET /api/chats/stats
Retorna estatísticas dos chats (total mensagens, sessões, mensagens hoje)

#### GET /api/chats/sessions
Lista todas as sessões de chat com contagem de mensagens

#### GET /api/chats/session/:session_id
Busca todos os chats de uma sessão específica

#### GET /api/chats/:id
Busca um chat específico por ID

#### POST /api/chats
Cria um novo chat
```json
{
  "session_id": "556392728900",
  "message": {
    "type": "human",
    "content": "Olá, preciso de ajuda"
  }
}
```

#### PUT /api/chats/:id
Atualiza um chat existente

#### DELETE /api/chats/:id
Remove um chat

## Uso Futuro dos Dados Armazenados

Todas as mensagens são salvas permanentemente no banco de dados SQLite (`conversations.db`). Você pode usar esses dados para:

### 1. Exportar Mensagens

```bash
# Exportar todas as mensagens para JSON
node scripts/export-messages.js json

# Exportar para CSV (para Excel)
node scripts/export-messages.js csv

# Exportar mensagens de um contato específico
node scripts/export-messages.js contact 5511999999999

# Exportar por período
node scripts/export-messages.js date "2024-01-01" "2024-12-31"
```

### 2. Análise e Relatórios

```bash
# Gerar relatório completo de análise
node scripts/analytics.js report

# Buscar mensagens por palavra-chave
node scripts/analytics.js search "pedido"

# Exportar dados para treinamento de IA
node scripts/analytics.js training
```

O relatório de análise mostra:
- Total de mensagens e contatos
- Mensagens por dia/horário/dia da semana
- Top 10 contatos mais ativos
- Status das mensagens
- Análise de tamanho das mensagens

### 3. Backup e Restauração

```bash
# Criar backup manual
node scripts/backup.js create

# Listar backups existentes
node scripts/backup.js list

# Restaurar backup
node scripts/backup.js restore conversations-backup-2024-12-09T10-30-00.db

# Limpar backups antigos (manter apenas os 5 mais recentes)
node scripts/backup.js clean 5

# Backup automático a cada 30 minutos
node scripts/backup.js auto 30
```

### 4. Treinar IA com suas Conversas

O script `analytics.js training` exporta os dados em formato JSONL pronto para:
- Fine-tuning de GPT-4, Claude, ou outros modelos
- Melhorar as respostas automáticas do bot
- Análise de padrões de conversação

## Estrutura de Arquivos

```
painel-whatsapp/
├── public/
│   ├── index.html      # Interface principal
│   ├── styles.css      # Estilos
│   └── app.js          # Lógica do frontend
├── scripts/
│   ├── export-messages.js  # Exportar dados
│   ├── analytics.js        # Análises e relatórios
│   └── backup.js           # Backup e restauração
├── backups/                # Backups automáticos
├── server.js           # Servidor Express + WebSocket
├── conversations.db    # Banco de dados SQLite (gerado automaticamente)
├── package.json
└── README.md
```

## Banco de Dados

### Tabela: conversations (Webhook)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER/SERIAL | ID único |
| phone_number | TEXT | Número do telefone |
| contact_name | TEXT | Nome do contato |
| message | TEXT | Conteúdo da mensagem |
| message_type | TEXT | "received" ou "sent" |
| timestamp | DATETIME/TIMESTAMP | Data/hora |
| status | TEXT | "pending" ou "answered" |
| metadata | TEXT/JSONB | JSON com dados extras |

### Tabela: contacts (Webhook)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INTEGER/SERIAL | ID único |
| phone_number | TEXT | Número do telefone (único) |
| name | TEXT | Nome do contato |
| last_interaction | DATETIME/TIMESTAMP | Última interação |
| total_messages | INTEGER | Total de mensagens |
| status | TEXT | Status do contato |

### Tabela: leads (Seu Banco)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | ID único (gerado automaticamente) |
| numero | VARCHAR | Número de telefone do lead |
| nome | VARCHAR | Nome do lead |
| followupsequencia | VARCHAR | Sequência de follow-up |
| followupsequenciamsgid | VARCHAR | ID da mensagem da sequência |
| created_at | TIMESTAMPTZ | Data de criação |
| trava | BOOLEAN | Lead travado/bloqueado |

### Tabela: chats (Seu Banco)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | ID único |
| session_id | VARCHAR | ID da sessão do chat |
| message | JSONB | Objeto JSON com a mensagem |
| created_at | TIMESTAMP | Data de criação |

## Personalização

### Alterar Porta

Edite o arquivo `server.js`:

```javascript
const PORT = process.env.PORT || 3000;
```

Ou defina a variável de ambiente:

```bash
PORT=8080 npm start
```

### Customizar Cores

Edite as variáveis CSS em `public/styles.css`:

```css
:root {
    --primary-color: #25D366;
    --secondary-color: #128C7E;
    /* ... outras cores ... */
}
```

## Troubleshooting

### Erro: "Cannot find module"
Execute: `npm install`

### Porta já em uso
Altere a porta no `server.js` ou finalize o processo:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### WebSocket não conecta
- Verifique se o servidor está rodando
- Confirme que não há firewall bloqueando a porta
- Verifique o console do navegador para erros

## Deploy em Produção

### Deploy na Vercel com PostgreSQL

1. **Criar banco PostgreSQL** (escolha uma das opções):
   - Vercel Postgres
   - Supabase (grátis)
   - Neon (grátis)
   - Railway
   - Render

2. **Configurar variáveis de ambiente na Vercel**:

No dashboard da Vercel, adicione as seguintes variáveis:

```
DATABASE_TYPE=postgres
POSTGRES_HOST=seu-host.supabase.co
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua-senha-super-segura
POSTGRES_DATABASE=postgres
POSTGRES_SSL=true
```

3. **Deploy**:

```bash
npm install -g vercel
vercel
```

Ou conecte seu repositório GitHub diretamente na Vercel.

4. **As tabelas serão criadas automaticamente** no primeiro acesso!

### Deploy Local com PM2

```bash
npm install -g pm2
pm2 start server.js --name whatsapp-panel
pm2 save
pm2 startup
```

### Variáveis de Ambiente

Crie um arquivo `.env`:

```
DATABASE_TYPE=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=seu_usuario
POSTGRES_PASSWORD=sua_senha
POSTGRES_DATABASE=seu_banco
PORT=3000
NODE_ENV=production
```

### Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Segurança

Para produção, considere adicionar:

- Autenticação (JWT, OAuth)
- HTTPS/SSL
- Rate limiting
- Validação de entrada
- CORS configurado adequadamente
- Variáveis de ambiente para configurações sensíveis

## Licença

MIT

## Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
