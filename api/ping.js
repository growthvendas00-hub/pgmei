const { cors, sendJson } = require('./_lib');

module.exports = async function handler(req, res) {
  cors(res);
  return sendJson(res, 200, { ok: true });
};
