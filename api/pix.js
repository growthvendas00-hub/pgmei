const { cors, sendJson } = require('./_lib');
const {
  getEnkiConfig,
  reaisParaCentavos,
  apenasDigitos,
  emailCliente,
  normalizarRespostaEnki,
  enkiFetch,
} = require('./_enki');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendJson(res, 405, { success: false, error: 'Método não permitido' });
  }

  try {
    const cfg = getEnkiConfig();
    if (!cfg.ok) return sendJson(res, 500, { success: false, error: cfg.error });

    const q = req.method === 'POST' ? { ...req.query, ...parseBody(req) } : req.query;

    let amount = 0;
    if (q.amount_centavos != null && q.amount_centavos !== '') {
      amount = Math.round(Number(q.amount_centavos));
    } else {
      amount = reaisParaCentavos(q.lista || q.valor);
    }

    const documento = apenasDigitos(q.cnpj || '');
    const nome = (q.name || q.nome || 'Cliente MEI').trim();

    if (documento.length !== 14 && documento.length !== 11) {
      return sendJson(res, 400, { success: false, error: 'CNPJ/CPF inválido.' });
    }

    if (amount < 1) {
      return sendJson(res, 400, { success: false, error: 'Valor mínimo R$ 0,01.' });
    }

    if (amount > cfg.maxCentavos) {
      const reais = (amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      return sendJson(res, 400, {
        success: false,
        error: `Valor R$ ${reais} acima do limite permitido. Selecione apenas as parcelas corretas.`,
      });
    }

    let phone = apenasDigitos(q.phone) || cfg.defaultPhone;
    if (phone.length < 10) phone = cfg.defaultPhone;
    if (phone.length > 11) phone = phone.slice(-11);

    const email = String(q.email || emailCliente(documento)).trim();
    const docType = documento.length === 14 ? 'CNPJ' : 'CPF';

    const payload = {
      amount,
      payment_method: 'PIX',
      items: [{
        title: cfg.productTitle,
        unit_price: amount,
        quantity: 1,
        tangible: false,
        external_ref: 'MEI-001',
      }],
      customer: {
        name: nome.substring(0, 120),
        email,
        phone,
        document: { number: documento, type: docType },
      },
    };

    if (cfg.postbackUrl) payload.postback_url = cfg.postbackUrl;

    const { res: enkiRes, data } = await enkiFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!enkiRes.ok) {
      const msg = (data && (data.message || data.error)) || `Erro Enki (HTTP ${enkiRes.status})`;
      return sendJson(res, enkiRes.status >= 400 ? enkiRes.status : 422, {
        success: false,
        error: msg,
      });
    }

    const out = normalizarRespostaEnki(data);

    if (!out.pixLink) {
      return sendJson(res, 422, {
        success: false,
        error: 'Código PIX não retornado pela Enki. Verifique ENKI_PUBLIC_KEY e ENKI_SECRET_KEY na Vercel.',
        enki_status: out.status || data.status,
      });
    }

    return sendJson(res, 200, { ...out, success: true, amount_centavos: amount });
  } catch (err) {
    return sendJson(res, 500, { success: false, error: err.message || 'Falha ao gerar PIX' });
  }
};

function parseBody(req) {
  try {
    if (!req.body) return {};
    if (typeof req.body === 'string') return JSON.parse(req.body);
    return req.body;
  } catch {
    return {};
  }
}
