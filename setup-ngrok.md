# Expor o Painel com ngrok

## 1. Instalar ngrok

Baixe em: https://ngrok.com/download

## 2. Iniciar o servidor do painel

```bash
npm start
```

## 3. Expor com ngrok

```bash
ngrok http 3000
```

## 4. Usar a URL gerada no n8n

O ngrok vai gerar uma URL tipo:
```
https://abc123.ngrok-free.app
```

Use no n8n:
```
https://abc123.ngrok-free.app/api/webhook/message
```

## Vantagens:
- Funciona imediatamente
- HTTPS grátis
- Não precisa configurar servidor

## Desvantagens:
- URL muda a cada reinício (versão grátis)
- Pode ter limite de requisições

## ngrok com domínio fixo (pago)

Se quiser um domínio fixo:
```bash
ngrok http 3000 --domain=seu-dominio.ngrok-free.app
```
