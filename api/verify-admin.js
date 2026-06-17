// api/verify-admin.js
// Valida no servidor se o sessionToken pertence à conta ADM.
// O front-end nunca sabe a senha do ADM — só envia o token.

const FIREBASE_DB_URL = 'https://brutalsimmoggado-default-rtdb.firebaseio.com';
const ADM_EMAIL_NORMALIZED = 'suporte@lumie.com';

// HMAC-SHA256 para assinar/verificar tokens sem expor segredo ao cliente
async function hmac(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default async function handler(req, res) {
  // CORS restrito — só aceita do próprio domínio
  const origin = req.headers['origin'] || '';
  const SITE_URL = process.env.SITE_URL || '';
  if (SITE_URL && origin && !origin.startsWith(SITE_URL)) {
    return res.status(403).json({ ok: false, reason: 'origin' });
  }

  res.setHeader('Access-Control-Allow-Origin', SITE_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  const { sessionToken, email } = req.body || {};

  // Validações básicas
  if (!sessionToken || typeof sessionToken !== 'string' || sessionToken.length < 16) {
    return res.status(401).json({ ok: false, reason: 'token_missing' });
  }
  if (!email || typeof email !== 'string') {
    return res.status(401).json({ ok: false, reason: 'email_missing' });
  }
  if (email.toLowerCase().trim() !== ADM_EMAIL_NORMALIZED) {
    return res.status(403).json({ ok: false, reason: 'not_adm' });
  }

  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) {
    console.error('[verify-admin] ADMIN_SECRET não configurado');
    return res.status(500).json({ ok: false, reason: 'server_config' });
  }

  try {
    // Busca no Firebase a conta ADM (sem Firebase Admin SDK — usa REST API com secret)
    const FIREBASE_SECRET = process.env.FIREBASE_SECRET;
    const authSuffix = FIREBASE_SECRET ? `?auth=${FIREBASE_SECRET}` : '';

    // Busca accounts do Firebase para verificar sessionToken
    // O path é o mesmo usado pelo script.js: lm_accounts
    const fbRes = await fetch(`${FIREBASE_DB_URL}/lumieAccounts.json${authSuffix}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!fbRes.ok) {
      // Fallback: valida via HMAC se o token foi assinado com ADMIN_SECRET
      // (usado quando o Firebase não está disponível ou não tem os dados)
      const expectedSig = await hmac(ADMIN_SECRET, `adm:${ADM_EMAIL_NORMALIZED}`);
      // Token format: "<random_hex>.<hmac_sig>"
      const parts = sessionToken.split('.');
      if (parts.length === 2 && parts[1] === expectedSig.slice(0, 32)) {
        return res.status(200).json({ ok: true, method: 'hmac' });
      }
      return res.status(401).json({ ok: false, reason: 'firebase_unavailable' });
    }

    const accounts = await fbRes.json();

    // accounts pode ser null (base vazia) ou objeto
    if (!accounts) {
      return res.status(401).json({ ok: false, reason: 'no_accounts' });
    }

    // lm_accounts é salvo como array — Firebase armazena como objeto com índices
    const list = Array.isArray(accounts) ? accounts : Object.values(accounts);
    const admAccount = list.find(a =>
      a && typeof a === 'object' &&
      (a.email || '').toLowerCase().trim() === ADM_EMAIL_NORMALIZED
    );

    if (!admAccount) {
      return res.status(401).json({ ok: false, reason: 'adm_not_found' });
    }

    if (!admAccount.sessionToken || admAccount.sessionToken !== sessionToken) {
      return res.status(401).json({ ok: false, reason: 'token_mismatch' });
    }

    // Token válido — gera um HMAC de sessão para o front usar em chamadas futuras
    const sessionSig = await hmac(ADMIN_SECRET, `${sessionToken}:${Date.now().toString().slice(0, -3)}`);

    return res.status(200).json({
      ok: true,
      sig: sessionSig.slice(0, 24), // proof curto para o front
    });

  } catch (err) {
    console.error('[verify-admin] Erro:', err);
    return res.status(500).json({ ok: false, reason: 'internal' });
  }
}
