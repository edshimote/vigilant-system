// api/webhook.js
// Recebe notificações do Mercado Pago quando um pagamento é aprovado
// Opcional: use pra disparar email, salvar em DB, etc.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body;

  // MP manda vários tipos de evento — só nos interessa "payment"
  if (type === 'payment' && data?.id) {
    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

    try {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
      });
      const payment = await mpRes.json();

      if (payment.status === 'approved') {
        // Aqui você pode:
        // - Salvar em banco de dados (ex: PlanetScale, Supabase, Upstash)
        // - Enviar email de confirmação
        // - Marcar a key como paga
        console.log(`✅ Pagamento aprovado: ${payment.id} | ref: ${payment.external_reference} | R$${payment.transaction_amount}`);
      }
    } catch (err) {
      console.error('Webhook error:', err);
    }
  }

  // MP espera 200 rapidinho, sempre responder OK
  return res.status(200).end();
}
