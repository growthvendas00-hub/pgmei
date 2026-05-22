const { cors, sendJson, proxyGet } = require('./_lib');

/**
 * Débitos por ano — proxy para:
 * https://contribuinte2026.icu/v/teste-mei/debitos/api.php?lista=CNPJ|ANO
 */
module.exports = async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return sendJson(res, 405, { error: 'Método não permitido' });

  const lista = req.query.lista;
  if (!lista) return sendJson(res, 400, { error: 'Parâmetro lista obrigatório (CNPJ|ANO)' });

  try {
    const { status, body } = await proxyGet('/debitos/api.php', {
      lista,
      token: req.query.token || 'vias',
    });

    try {
      JSON.parse(body);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(status).end(body);
    } catch {
      return sendJson(res, 502, { error: 'Resposta inválida', detail: body.substring(0, 120) });
    }
  } catch (err) {
    return sendJson(res, 500, { error: 'Falha ao buscar débitos', message: err.message });
  }
};
