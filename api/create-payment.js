// api/create-payment.js
const PLANS = {
  weekly:    { label: 'Lumié - Chave Semanal',   amount: 22.90 },
  permanent: { label: 'Lumié - Chave Vitalícia', amount: 97.00 },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { planType } = req.body;
  const plan = PLANS[planType];
  if (!plan) return res.status(400).json({ error: 'Plano inválido' });

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) return res.status(500).json({ error: 'Token não configurado' });

  try {
    const externalRef = `lumie-${planType}-${Date.now()}`;

    const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'Authorization':     `Bearer ${MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': externalRef,
      },
      body: JSON.stringify({
        transaction_amount: plan.amount,
        description:        plan.label,
        payment_method_id:  'pix',
        payer: {
          email: req.body?.payerEmail || 'cliente@lumie.com',
        },
        external_reference: externalRef,
      }),
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      console.error('Erro MP:', JSON.stringify(data));
      return res.status(500).json({ error: 'Erro ao criar pagamento', detail: data });
    }

    const pix = data?.point_of_interaction?.transaction_data;

    if (!pix?.qr_code) {
      console.error('PIX não encontrado:', JSON.stringify(data));
      return res.status(500).json({ error: 'QR Code não gerado', detail: data });
    }

    return res.status(200).json({
      orderId:      data.id,
      externalRef,
      qrCodeBase64: pix.qr_code_base64,
      qrCode:       pix.qr_code,
      ticketUrl:    pix.ticket_url || null,
      amount:       plan.amount,
      label:        plan.label,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
