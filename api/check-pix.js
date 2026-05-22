const { cors, sendJson } = require('./_lib');
const { enkiFetch } = require('./_enki');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query.id;
  if (!id) return sendJson(res, 400, { paid: false, status: 'ERROR', message: 'Transaction ID missing' });

  try {
    const { res: enkiRes, data } = await enkiFetch(`/transactions/${encodeURIComponent(id)}`);

    if (!enkiRes.ok) {
      return sendJson(res, enkiRes.status, {
        paid: false,
        status: 'ERROR',
        message: (data && (data.message || data.error)) || 'Transação não encontrada',
      });
    }

    const status = String(data.status || '').toLowerCase();
    const paid = status === 'paid' || status === 'approved';

    return sendJson(res, 200, {
      paid,
      status: data.status,
      transaction_id: data.id,
      amount: data.amount,
    });
  } catch (err) {
    return sendJson(res, 502, { paid: false, status: 'ERROR', message: err.message });
  }
};
