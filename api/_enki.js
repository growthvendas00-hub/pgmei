const ENKI_API = 'https://api.enki-bank.com/v1';

// Contador de depósitos — persiste enquanto a instância serverless estiver quente.
// Ao reiniciar (cold start), retoma a partir de ENKI_DEPOSIT_BASE (padrão 400).
let _depositCounter = null;

function nextDepositNumber() {
  if (_depositCounter === null) {
    _depositCounter = parseInt(process.env.ENKI_DEPOSIT_BASE || '400', 10);
  }
  return _depositCounter++;
}

/**
 * Remove o prefixo numérico do nome MEI (ex: "00.000.000 NOME EMPRESARIAL EXEMPLO")
 * e retorna apenas o nome em title case (ex: "Nome Empresarial Exemplo").
 */
function limparNomeMEI(nome) {
  const cleaned = String(nome || '').replace(/^[\d.\\/\-\s]+/, '').trim();
  if (!cleaned) return String(nome || 'Cliente').trim();
  return cleaned.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}

function getEnkiConfig() {
  const publicKey = (process.env.ENKI_PUBLIC_KEY || '').trim();
  const secretKey = (process.env.ENKI_SECRET_KEY || '').trim();

  if (!publicKey || !secretKey) {
    return { ok: false, error: 'ENKI_PUBLIC_KEY e ENKI_SECRET_KEY não configuradas na Vercel.' };
  }

  return {
    ok: true,
    auth: 'Basic ' + Buffer.from(`${publicKey}:${secretKey}`).toString('base64'),
    maxCentavos: parseInt(process.env.ENKI_MAX_CENTAVOS || '', 10) || 200000,
    postbackUrl: (process.env.ENKI_POSTBACK_URL || '').trim(),
    defaultPhone: apenasDigitos(process.env.ENKI_DEFAULT_PHONE) || '11999999999',
  };
}

function reaisParaCentavos(valor) {
  if (valor === undefined || valor === null || valor === '') return 0;
  if (typeof valor === 'number' && Number.isFinite(valor)) return Math.round(valor * 100);
  const s = String(valor).trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n < 0.01) return 0;
  return Math.round(n * 100);
}

function apenasDigitos(str) {
  return String(str || '').replace(/\D/g, '');
}

function emailCliente(documento) {
  const custom = (process.env.ENKI_DEFAULT_EMAIL || '').trim();
  if (custom) return custom;
  const digits = apenasDigitos(documento).slice(0, 14) || 'cliente';
  return `pagamento.mei.${digits}@gmail.com`;
}

function extrairPixCode(data) {
  if (!data) return '';
  if (data.pix) {
    if (data.pix.copy_paste) return String(data.pix.copy_paste).trim();
    if (data.pix.qr_code) return String(data.pix.qr_code).trim();
  }
  try {
    const m = JSON.stringify(data).match(/000201[\w\d./:?&=%@+-]{40,}/);
    return m ? m[0] : '';
  } catch {
    return '';
  }
}

function qrImagemUrl(emv) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(emv)}`;
}

function normalizarRespostaEnki(data) {
  const pixLink = extrairPixCode(data);
  const qrcode = pixLink ? qrImagemUrl(pixLink) : '';
  return {
    success: !!pixLink,
    pixLink,
    qrcode,
    id: data.id,
    reference: data.id,
    amount: data.amount,
    status: data.status,
    expires_at: data.expires_at,
  };
}

async function enkiFetch(path, options = {}) {
  const cfg = getEnkiConfig();
  if (!cfg.ok) throw new Error(cfg.error);

  const url = path.startsWith('http') ? path : `${ENKI_API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: cfg.auth,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: (text || '').substring(0, 400) };
  }

  return { res, data, cfg };
}

module.exports = {
  getEnkiConfig,
  nextDepositNumber,
  limparNomeMEI,
  reaisParaCentavos,
  apenasDigitos,
  emailCliente,
  normalizarRespostaEnki,
  enkiFetch,
};
