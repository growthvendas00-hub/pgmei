const { cors, sendJson, proxyGet } = require('./_lib');

/**
 * Consulta CNPJ MEI — proxy para:
 * https://contribuinte2026.icu/v/teste-mei/cnpj.php
 */
module.exports = async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Método não permitido' });
  }

  const cnpj = (req.query.cnpj || '').replace(/\D/g, '');
  if (cnpj.length !== 14) {
    return sendJson(res, 400, { error: 'CNPJ inválido (deve ter 14 dígitos)' });
  }

  try {
    const { status, body } = await proxyGet('/cnpj.php', {
      cnpj,
      token: req.query.token || 'vias',
    });

    try {
      JSON.parse(body);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(status).end(body);
    } catch {
      return sendJson(res, 502, {
        error: 'Resposta inválida do servidor de consulta',
        detail: body.substring(0, 120),
      });
    }
  } catch (err) {
    return sendJson(res, 500, {
      error: 'Falha ao consultar CNPJ',
      message: err.message,
    });
  }
};
