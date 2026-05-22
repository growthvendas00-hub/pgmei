const REMOTE_BASE = process.env.REMOTE_BASE || 'https://contribuinte2026.icu/v/teste-mei';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, data) {
  cors(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).end(JSON.stringify(data));
}

async function proxyGet(remotePath, query) {
  const url = new URL(REMOTE_BASE + remotePath);
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  const body = await response.text();
  return { status: response.status, body };
}

module.exports = { REMOTE_BASE, cors, sendJson, proxyGet };
