# PGMEI

Consulta de débitos MEI — deploy na [Vercel](https://vercel.com).

## URLs após deploy

| Tela | URL |
|------|-----|
| Login (CNPJ) | `https://seu-projeto.vercel.app/` |
| Débitos + PIX | `https://seu-projeto.vercel.app/debitos` |

## Fluxo

1. Digite CNPJ → **Continuar**
2. Escolha o ano → **Ok**
3. Marque parcelas → **Pagar Online**
4. Modal PIX (QR Code)

## Deploy na Vercel

1. Faça push deste repositório no GitHub
2. Em [vercel.com](https://vercel.com) → **Add New Project** → importe o repositório
3. Framework: **Other** (sem build command)
4. Deploy

| API | Função |
|-----|--------|
| `/api/cnpj` | Consulta CNPJ (proxy remoto) |
| `/api/debts` | Débitos por ano (proxy remoto) |
| `/api/pix` | **Enki** — gera PIX |
| `/api/check-pix` | **Enki** — status do pagamento |

### Variáveis de ambiente (Vercel)

Obrigatórias:

| Variável | Descrição |
|----------|-----------|
| `ENKI_PUBLIC_KEY` | Chave pública da API Enki |
| `ENKI_SECRET_KEY` | Chave secreta da API Enki |

Opcionais:

| Variável | Descrição |
|----------|-----------|
| `ENKI_MAX_CENTAVOS` | Valor máximo por cobrança em centavos (padrão `200000` = R$ 2.000) |
| `ENKI_PRODUCT_TITLE` | Nome do produto na cobrança (padrão: `Regularização MEI`) |
| `ENKI_POSTBACK_URL` | URL do webhook para notificações de pagamento |
| `ENKI_DEFAULT_EMAIL` | E-mail padrão do cliente |
| `ENKI_DEFAULT_PHONE` | Telefone padrão (só números) |
| `REMOTE_BASE` | Base da API de débitos (padrão: contribuinte2026.icu) |

## Teste local

```bash
npx vercel dev
```

Abra `http://localhost:3000`

## Teste local

Use um CNPJ MEI ativo com débitos cadastrados no servidor remoto para validar o fluxo completo.
