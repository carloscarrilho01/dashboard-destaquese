# ⚠️ VARIÁVEL FALTANDO NO VERCEL

## Você precisa adicionar esta variável de ambiente:

1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables

2. Clique em **"Add New"**

3. Adicione:
   - **Name**: `POSTGRES_DATABASE`
   - **Value**: `postgres`
   - **Environment**: Marque todas (Production, Preview, Development)

4. Clique em **"Save"**

5. O Vercel vai fazer **redeploy automático**

---

## ✅ Depois disso, suas variáveis estarão completas:

```
DATABASE_TYPE=postgres
POSTGRES_HOST=aws-1-sa-east-1.pooler.supabase.com
POSTGRES_PORT=5432
POSTGRES_USER=postgres.msdzkyvutcsxhmzclrwx
POSTGRES_PASSWORD=Agentecarrilho2304@
POSTGRES_DATABASE=postgres  ← ADICIONAR ESTA
POSTGRES_SSL=true
```

---

## 🔄 Aguarde o deploy

Após adicionar a variável, aguarde 1-2 minutos para o redeploy completar.

Depois teste novamente:
- https://dashboard-destaquese-teste.vercel.app/api/leads
- https://dashboard-destaquese-teste.vercel.app/api/chats
