# 🚀 Deploy na Vercel - Guia Completo

## Passo 1: Criar Banco PostgreSQL no Supabase (2 minutos)

1. Acesse: https://supabase.com
2. Clique em **"Start your project"** → Login com GitHub
3. Clique em **"New Project"**
4. Preencha:
   - **Organization**: Sua organização (ou crie uma)
   - **Name**: `whatsapp-panel-db` (ou o que preferir)
   - **Database Password**: Crie uma senha FORTE (**COPIE E GUARDE!**)
   - **Region**: `South America (São Paulo)` ou a mais próxima
   - **Pricing Plan**: Free
5. Clique em **"Create new project"** (aguarde ~2 minutos)

### Copiar Credenciais do Banco:

Quando o projeto estiver pronto:

1. Vá em **Settings** (ícone ⚙️) → **Database**
2. Na seção **"Connection string"**, clique em **"URI"**
3. Copie a connection string (algo como `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
4. Ou pegue as credenciais individuais:
   - **Host**: `db.xxx.supabase.co`
   - **Database**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: A senha que você criou

---

## Passo 2: Enviar para GitHub (3 minutos)

### Opção A: Criar repositório novo no GitHub

1. Acesse: https://github.com/new
2. Nome do repositório: `dashboard-destaquese`
3. Deixe como **Public** ou **Private**
4. **NÃO** marque "Initialize with README"
5. Clique em **"Create repository"**

6. No terminal, execute:

```bash
cd "C:\Users\carlo\Downloads\painel v2"
git remote add origin https://github.com/carloscarrilho01/dashboard-destaquese.git
git branch -M main
git push -u origin main
```

**Substitua `SEU-USUARIO` pelo seu nome de usuário do GitHub!**

### Opção B: Usar repositório existente

Se você já tem um repositório:

```bash
cd "C:\Users\carlo\Downloads\painel v2"
git remote add origin URL-DO-SEU-REPOSITORIO
git push -u origin main
```

---

## Passo 3: Deploy na Vercel (2 minutos)

1. Acesse: https://vercel.com
2. Faça login com sua conta GitHub
3. Clique em **"Add New..."** → **"Project"**
4. Selecione o repositório `whatsapp-panel`
5. Clique em **"Import"**

### Configurar Variáveis de Ambiente:

Na tela de configuração do projeto:

1. Expanda **"Environment Variables"**
2. Adicione **APENAS 6 variáveis**:

| Nome | Valor |
|------|-------|
| `DATABASE_TYPE` | `postgres` |
| `POSTGRES_HOST` | `db.xxx.supabase.co` (copie do Supabase) |
| `POSTGRES_PORT` | `5432` |
| `POSTGRES_USER` | `postgres` |
| `POSTGRES_PASSWORD` | sua senha do Supabase |
| `POSTGRES_SSL` | `true` |

**Opcional:** Se você usa essas variáveis:
- `NEXT_PUBLIC_DASHBOARD_NAME` - Nome do painel
- `NEXT_PUBLIC_TABLE_NAME` - Nome da tabela
- `NEXT_PUBLIC_SUPABASE_URL` - URL do Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon Key

3. Clique em **"Deploy"**

---

## Passo 4: Aguardar Deploy (1 minuto)

A Vercel vai:
- Instalar as dependências
- Fazer build do projeto
- Deploy da aplicação

Quando terminar, você verá: ✅ **"Deployment Ready"**

---

## Passo 5: Testar o Projeto

1. Clique em **"Visit"** para abrir o projeto
2. A URL será algo como: `https://whatsapp-panel-xxx.vercel.app`

3. Teste as APIs:

```bash
# Listar leads
https://seu-projeto.vercel.app/api/leads

# Listar chats
https://seu-projeto.vercel.app/api/chats

# Stats de leads
https://seu-projeto.vercel.app/api/leads/stats
```

---

## ✅ Checklist de Verificação

- [ ] Banco PostgreSQL criado no Supabase
- [ ] Senha do banco anotada
- [ ] Credenciais copiadas
- [ ] Repositório criado no GitHub
- [ ] Código enviado para o GitHub (git push)
- [ ] Projeto importado na Vercel
- [ ] 7 variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] URL do projeto funcionando
- [ ] Endpoint `/api/leads` testado
- [ ] Endpoint `/api/chats` testado

---

## 🔧 Próximos Passos

### Conectar com n8n:

Use a URL do projeto nas suas automações:

```
https://seu-projeto.vercel.app/api/webhook/message
```

### Acessar Dados via API:

Todos os endpoints estão disponíveis:

- `GET /api/leads` - Listar leads
- `POST /api/leads` - Criar lead
- `GET /api/chats` - Listar chats
- `GET /api/chats/sessions` - Listar sessões

---

## 🆘 Problemas Comuns

### Deploy falhou?

1. Verifique os logs na Vercel
2. Confirme que todas as 7 variáveis de ambiente foram adicionadas
3. Verifique se não há typos nas variáveis

### Erro de conexão com banco?

1. Verifique se `POSTGRES_SSL=true` está configurado
2. Confirme que a senha está correta
3. Teste a conexão no Supabase (Settings → Database → Connection pooler)

### API retorna erro 500?

1. Vá em **Deployments** → Clique no deployment → **View Function Logs**
2. Procure por erros relacionados ao banco de dados
3. As tabelas serão criadas automaticamente na primeira requisição

---

## 📱 Domínio Personalizado (Opcional)

1. Na Vercel, vá em **Settings** → **Domains**
2. Adicione seu domínio personalizado
3. Configure o DNS conforme instruções da Vercel

---

## 🎉 Pronto!

Seu painel está no ar! Agora você pode:
- Acessar os dados via API
- Integrar com n8n
- Gerenciar leads e chats
- Escalar conforme necessário (Vercel escala automaticamente)

**URL do Projeto**: Anote aqui depois do deploy
```
https://________________.vercel.app
```
