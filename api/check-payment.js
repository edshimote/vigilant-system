// api/check-payment.js
// Verifica se um pagamento PIX foi aprovado

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { orderId } = req.query;
  if (!orderId) return res.status(400).json({ error: 'orderId obrigatório' });

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) return res.status(500).json({ error: 'Token não configurado' });

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${orderId}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
    });

    const data = await mpRes.json();
    if (!mpRes.ok) return res.status(500).json({ error: 'Erro ao consultar pagamento', detail: data });

    const approved = data.status === 'approved';

    return res.status(200).json({ approved, status: data.status });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
