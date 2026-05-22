const { cors, sendJson } = require('./_lib');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method !== 'POST') {
    return sendJson(res, 200, { ok: true, message: 'Webhook Enki PGMEI' });
  }
  console.log('[Enki Webhook]', req.body);
  return sendJson(res, 200, { received: true });
};
