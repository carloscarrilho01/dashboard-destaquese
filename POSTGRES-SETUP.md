# Guia Rápido: PostgreSQL

## 🚀 Configuração Rápida

### 1. Instalar Dependências

```bash
npm install
```

### 2. Criar arquivo `.env`

Copie o `.env.example` e configure:

```env
DATABASE_TYPE=postgres

POSTGRES_HOST=seu-host-aqui
POSTGRES_PORT=5432
POSTGRES_USER=seu_usuario
POSTGRES_PASSWORD=sua_senha
POSTGRES_DATABASE=seu_banco
POSTGRES_SSL=false

PORT=3000
```

### 3. Iniciar o Servidor

```bash
npm start
```

As tabelas serão criadas automaticamente! ✨

---

## 📊 Tabelas Criadas Automaticamente

O sistema cria 4 tabelas:

1. **conversations** - Mensagens do webhook (n8n)
2. **contacts** - Contatos do webhook
3. **leads** - Seus leads (da estrutura que você mostrou)
4. **chats** - Histórico de chats (da estrutura que você mostrou)

---

## 🌐 Deploy na Vercel

### Opção 1: Supabase (Grátis e Fácil)

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings > Database** e copie as credenciais
4. No painel da Vercel, adicione as variáveis de ambiente:

```
DATABASE_TYPE=postgres
POSTGRES_HOST=db.xxx.supabase.co
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua-senha-do-supabase
POSTGRES_DATABASE=postgres
POSTGRES_SSL=true
```

5. Faça o deploy!

### Opção 2: Vercel Postgres

1. No dashboard do seu projeto na Vercel
2. Vá em **Storage > Create Database**
3. Escolha **Postgres**
4. A Vercel configurará automaticamente as variáveis de ambiente
5. Adicione apenas:

```
DATABASE_TYPE=postgres
```

### Opção 3: Neon (Grátis)

1. Crie uma conta em [neon.tech](https://neon.tech)
2. Crie um novo projeto
3. Copie a connection string
4. Configure as variáveis na Vercel (igual ao Supabase)

---

## 🔧 Migrar de SQLite para PostgreSQL

Se você já tem dados no SQLite local:

```bash
# Configure o PostgreSQL no .env
# Depois rode:
node scripts/migrate-to-postgres.js
```

---

## 📡 Endpoints da API

### Leads

```bash
# Listar todos
GET /api/leads

# Com filtros
GET /api/leads?trava=true&limit=50&nome=João

# Buscar por ID
GET /api/leads/:id

# Criar
POST /api/leads
{
  "numero": "5511999999999",
  "nome": "João Silva",
  "followupsequencia": "seq_001",
  "trava": false
}

# Atualizar
PUT /api/leads/:id
{
  "nome": "Novo Nome",
  "trava": true
}

# Deletar
DELETE /api/leads/:id

# Estatísticas
GET /api/leads/stats
```

### Chats

```bash
# Listar todos
GET /api/chats

# Buscar por sessão
GET /api/chats?session_id=556392728900

# Buscar por ID
GET /api/chats/:id

# Listar sessões
GET /api/chats/sessions

# Buscar mensagens de uma sessão
GET /api/chats/session/:session_id

# Criar
POST /api/chats
{
  "session_id": "556392728900",
  "message": {
    "type": "human",
    "content": "Olá"
  }
}

# Atualizar
PUT /api/chats/:id

# Deletar
DELETE /api/chats/:id

# Estatísticas
GET /api/chats/stats
```

---

## ✅ Checklist de Deploy

- [ ] Banco PostgreSQL criado (Supabase/Neon/Vercel)
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] `DATABASE_TYPE=postgres` adicionado
- [ ] `POSTGRES_SSL=true` configurado (para cloud)
- [ ] Deploy realizado
- [ ] Testar endpoint: `GET /api/leads`
- [ ] Testar endpoint: `GET /api/chats`

---

## 🆘 Problemas Comuns

### Erro: "connect ECONNREFUSED"

❌ O PostgreSQL não está acessível
✅ Verifique:
- POSTGRES_HOST está correto
- POSTGRES_PORT está correto
- Firewall permite conexão

### Erro: "password authentication failed"

❌ Senha incorreta
✅ Verifique POSTGRES_USER e POSTGRES_PASSWORD

### Erro: "database does not exist"

❌ Banco não existe
✅ Crie o banco ou use "postgres" como padrão

### Tabelas não foram criadas

✅ O sistema cria automaticamente na primeira execução
✅ Verifique os logs do servidor ao iniciar

---

## 💡 Dicas

- Use `POSTGRES_SSL=true` para bancos em cloud (Supabase, Neon, etc)
- Use `POSTGRES_SSL=false` para PostgreSQL local
- O sistema detecta automaticamente o tipo de banco
- Você pode trocar entre SQLite e PostgreSQL apenas mudando o `.env`
- Para desenvolvimento local, use SQLite (não precisa configurar nada)
