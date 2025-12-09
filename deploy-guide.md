# Guia de Deploy com Domínio

## Opção 1: Railway (Grátis + Fácil)

### 1. Criar conta em railway.app

### 2. Fazer deploy:

```bash
# Instalar CLI do Railway
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### 3. Adicionar domínio:
- No painel do Railway, vá em Settings
- Adicione um domínio customizado ou use o domínio grátis .railway.app

**URL final**: `https://seu-projeto.up.railway.app/api/webhook/message`

---

## Opção 2: Render (Grátis)

### 1. Criar conta em render.com

### 2. Conectar repositório GitHub

### 3. Configurar:
- Build Command: `npm install`
- Start Command: `npm start`

**URL final**: `https://seu-projeto.onrender.com/api/webhook/message`

---

## Opção 3: VPS (DigitalOcean, AWS, etc)

### 1. Comprar VPS e domínio

### 2. Configurar servidor:

```bash
# Conectar via SSH
ssh root@seu-ip

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar projeto
cd /var/www
git clone seu-repositorio
cd painel-v2

# Instalar dependências
npm install

# Instalar PM2
npm install -g pm2

# Iniciar
pm2 start server.js --name whatsapp-panel
pm2 startup
pm2 save
```

### 3. Configurar Nginx:

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

### 4. Configurar SSL (HTTPS):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

**URL final**: `https://seu-dominio.com/api/webhook/message`

---

## Opção 4: Cloudflare Tunnel (Grátis + Seguro)

### 1. Instalar cloudflared:

Windows: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

### 2. Autenticar:

```bash
cloudflared tunnel login
```

### 3. Criar tunnel:

```bash
cloudflared tunnel create whatsapp-panel
```

### 4. Configurar rota:

```bash
cloudflared tunnel route dns whatsapp-panel painel.seu-dominio.com
```

### 5. Criar arquivo de config:

```yaml
# config.yml
tunnel: ID-DO-TUNNEL
credentials-file: caminho/credentials.json

ingress:
  - hostname: painel.seu-dominio.com
    service: http://localhost:3000
  - service: http_status:404
```

### 6. Rodar tunnel:

```bash
cloudflared tunnel run whatsapp-panel
```

**URL final**: `https://painel.seu-dominio.com/api/webhook/message`

---

## Comparação:

| Opção | Custo | Facilidade | HTTPS | Domínio Customizado |
|-------|-------|------------|-------|---------------------|
| ngrok | Grátis/Pago | ⭐⭐⭐⭐⭐ | ✅ | Pago |
| Railway | Grátis | ⭐⭐⭐⭐⭐ | ✅ | ✅ |
| Render | Grátis | ⭐⭐⭐⭐ | ✅ | ✅ |
| VPS | $5-20/mês | ⭐⭐ | ✅ | ✅ |
| Cloudflare | Grátis | ⭐⭐⭐ | ✅ | ✅ |

## Recomendação:

- **Para testar agora**: ngrok
- **Para produção gratuita**: Railway ou Render
- **Para controle total**: VPS
- **Para segurança extra**: Cloudflare Tunnel
