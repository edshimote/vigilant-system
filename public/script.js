// ─── Utilitários base ─────────────────────────────────────────────────────────
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const readJson = (key, fallback) => {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { localStorage.removeItem(key); return fallback; }
};
const writeJson = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
};

// ─── Segurança: hash SHA-256 ──────────────────────────────────────────────────
async function hashPassword(password) {
  const encoded = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Token de sessão ──────────────────────────────────────────────────────────
function generateSessionToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function validateSession() {
  const session = readJson('lm_user', null);
  if (!session || !session.sessionToken) return false;
  const acc = accounts().find(a => normalizedEmail(a.email) === normalizedEmail(session.email));
  if (!acc) return false;
  if (acc.sessionToken !== session.sessionToken) return false;
  if (!acc.permanent && acc.expiresAt && new Date(acc.expiresAt) < new Date()) return false;
  return true;
}

// ─── Contas ───────────────────────────────────────────────────────────────────
const accounts = () => readJson('lm_accounts', []);
const setAccounts = (v) => writeJson('lm_accounts', v);
const normalizedEmail = (e) => String(e || '').trim().toLowerCase();

function resetStudentState() {
  ['lm_profile','lm_lessons','lm_weekly','lm_gender','lm_course_done','lm_daily','lm_journey'].forEach(k => localStorage.removeItem(k));
}
function setCurrentUser(account) {
  const current = readJson('lm_user', {});
  if (current.email && normalizedEmail(current.email) !== normalizedEmail(account.email)) resetStudentState();
  writeJson('lm_user', account);
}

// ─── Conta ADM ────────────────────────────────────────────────────────────────
const ADM_EMAIL    = 'suporte@lumie.com';
const ADM_KEY = 'LUMIE-ADM-0000-0000-0000';
// ⚠️ A senha do ADM NÃO está mais hardcoded aqui.
// O login ADM valida contra o hash salvo no localStorage (criado no primeiro acesso).
// Para redefinir a senha, use o painel de recuperação com a chave ADM.
const FIREBASE_DB_URL = 'https://brutalsimmoggado-default-rtdb.firebaseio.com';

function isAdmUser(email) { return normalizedEmail(email) === normalizedEmail(ADM_EMAIL); }

async function ensureAdmAccount() {
  const list = accounts();
  const exists = list.find(a => normalizedEmail(a.email) === normalizedEmail(ADM_EMAIL));
  if (exists) return;
  // ADM já deve existir — só cria se for primeiro acesso (instalação).
  // A senha inicial NÃO é hardcoded. O ADM deve criar a conta pelo fluxo de registro.
  // Se ainda não existe, cria com hash vazio (login vai falhar até senha ser definida via recuperação).
  const sessionToken = generateSessionToken();
  const passHash = ''; // vazio — ADM precisa usar o fluxo de recuperação de conta
  list.push({ name:'Suporte Lumié', email:normalizedEmail(ADM_EMAIL), passHash, key:ADM_KEY, active:true, plan:'ADM', permanent:true, moduleLimit:8, activatedAt:new Date().toISOString(), expiresAt:null, sessionToken, isAdm:true });
  setAccounts(list); markKeyUsed(ADM_KEY);
}

// ─── Keys ─────────────────────────────────────────────────────────────────────
function generateKey(planType) {
  const prefix = planType === 'permanent' ? 'LUMIE-VIT' : 'LUMIE-SEM';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const random = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `${prefix}-${random.slice(0,4)}-${random.slice(4,8)}-${random.slice(8,12)}`;
}
const usedKeys = () => readJson('lm_used_keys', []);
const markKeyUsed = (key) => { const l = usedKeys(); if (!l.includes(key)) l.push(key); writeJson('lm_used_keys', l); };
const isKeyAlreadyUsed = (key) => usedKeys().includes(key);

const PLANS = {
  weekly:    { plan:'Key Semanal',    days:7,  permanent:false, moduleLimit:8 },
  permanent: { plan:'Key Vitalícia',  days:0,  permanent:true,  moduleLimit:8 }
};
function isValidKeyFormat(key) {
  key = String(key || '').trim().toUpperCase();
  if (key === ADM_KEY) return true;
  return /^LUMIE-(VIT|SEM)-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(key);
}

const accessKeys = () => readJson('lm_access_keys', []);
const setAccessKeys = (v) => writeJson('lm_access_keys', v);
const findAccessKey = (key) => accessKeys().find(k => String(k.key).toUpperCase() === String(key || '').toUpperCase());

function mergeAccessKey(record) {
  if (!record?.key) return null;
  const list = accessKeys();
  const cleanKey = String(record.key).trim().toUpperCase();
  const idx = list.findIndex(k => String(k.key).toUpperCase() === cleanKey);
  const normalized = { ...record, key: cleanKey };
  if (idx >= 0) list[idx] = { ...list[idx], ...normalized };
  else list.unshift(normalized);
  setAccessKeys(list);
  return normalized;
}

async function fetchRemoteAccessKey(key) {
  const cleanKey = String(key || '').trim().toUpperCase();
  if (!cleanKey || typeof fetch === 'undefined') return null;
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/lumieKeys/${encodeURIComponent(cleanKey)}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.key ? mergeAccessKey(data) : null;
  } catch { return null; }
}

async function saveRemoteAccessKey(record) {
  if (!record?.key || typeof fetch === 'undefined') return false;
  try {
    await fetch(`${FIREBASE_DB_URL}/lumieKeys/${encodeURIComponent(record.key)}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return true;
  } catch { return false; }
}

async function markRemoteAccessKeyUsed(key, email) {
  const cleanKey = String(key || '').trim().toUpperCase();
  if (!cleanKey || typeof fetch === 'undefined') return false;
  try {
    await fetch(`${FIREBASE_DB_URL}/lumieKeys/${encodeURIComponent(cleanKey)}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ used: true, usedBy: normalizedEmail(email), usedAt: new Date().toISOString() })
    });
    return true;
  } catch { return false; }
}

function createAccessKey(planType, source = 'adm', forcedKey = null) {
  const access = PLANS[planType];
  if (!access) return null;

  const list = accessKeys();
  let key = forcedKey ? String(forcedKey).trim().toUpperCase() : generateKey(planType);

  while (!forcedKey && (list.some(k => k.key === key) || isKeyAlreadyUsed(key))) {
    key = generateKey(planType);
  }

  const existing = list.find(k => k.key === key);
  if (existing) return existing;

  const current = readJson('lm_user', {});
  const record = {
    key,
    planType,
    plan: access.plan,
    days: access.days,
    permanent: access.permanent,
    moduleLimit: access.moduleLimit,
    createdAt: new Date().toISOString(),
    createdBy: current?.email || source,
    source,
    used: false,
    usedBy: null,
    usedAt: null
  };
  list.unshift(record);
  setAccessKeys(list);
  saveRemoteAccessKey(record);
  return record;
}

function markAccessKeyUsed(key, email) {
  const cleanKey = String(key || '').trim().toUpperCase();
  const list = accessKeys();
  const idx = list.findIndex(k => String(k.key).toUpperCase() === cleanKey);
  if (idx >= 0) {
    list[idx].used = true;
    list[idx].usedBy = normalizedEmail(email);
    list[idx].usedAt = new Date().toISOString();
    setAccessKeys(list);
  }
  markKeyUsed(cleanKey);
}

ensureAdmAccount();

// ─── Mensagem de sessão (exibida após redirecionamento por logout/expiração) ──
(function() {
  try {
    const msg = sessionStorage.getItem('lm_msg');
    if (msg) {
      sessionStorage.removeItem('lm_msg');
      // Exibe no #authMsg quando o modal for aberto, ou em um toast
      window.__pendingAuthMsg = msg;
    }
  } catch(e) {}
})();

// ─── Registro / Login ─────────────────────────────────────────────────────────
async function activateAccount({ name, email, password, key }) {
  const cleanKey = String(key || '').trim().toUpperCase();
  const cleanEmail = normalizedEmail(email);

  if (!name || !cleanEmail || !password) return { ok:false, msg:'Preencha todos os campos.' };
  if (password.length < 6) return { ok:false, msg:'Senha muito curta. Mínimo 6 caracteres.' };
  if (!isValidKeyFormat(cleanKey) || cleanKey === ADM_KEY) return { ok:false, msg:'Chave inválida. Use uma chave criada pelo ADM.' };

  const keyRecord = findAccessKey(cleanKey) || await fetchRemoteAccessKey(cleanKey);
  if (!keyRecord) return { ok:false, msg:'Esta chave ainda não foi liberada. Peça para o ADM gerar/liberar sua chave.' };
  if (keyRecord.used || isKeyAlreadyUsed(cleanKey)) return { ok:false, msg:'Esta chave já foi utilizada. Cada chave ativa apenas uma conta.' };

  const planType = keyRecord.planType || (cleanKey.startsWith('LUMIE-VIT') ? 'permanent' : 'weekly');
  const access = PLANS[planType];
  if (!access) return { ok:false, msg:'Tipo de chave inválido.' };

  const list = accounts();
  const existingByEmail = list.find(a => normalizedEmail(a.email) === cleanEmail);
  if (existingByEmail && existingByEmail.key !== cleanKey) return { ok:false, msg:'Este email já possui uma conta ativa com outra chave.' };

  const passHash = await hashPassword(password);
  const sessionToken = generateSessionToken();
  const activatedAt = new Date().toISOString();
  const expiresAt = access.permanent ? null : new Date(Date.now() + access.days * 86400000).toISOString();
  const account = { name, email:cleanEmail, passHash, key:cleanKey, active:true, ...access, activatedAt, expiresAt, sessionToken };
  const idx = list.findIndex(a => normalizedEmail(a.email) === cleanEmail);
  if (idx >= 0) list[idx] = account; else list.push(account);
  setAccounts(list);
  markAccessKeyUsed(cleanKey, cleanEmail);
  await markRemoteAccessKeyUsed(cleanKey, cleanEmail);
  writeJson('lm_user', { ...account });
  return { ok:true };
}

async function login(email, password) {
  await ensureAdmAccount();
  if (isAdmUser(email)) {
    // Valida hash da senha (sem comparação em texto claro)
    const admPassHash = await hashPassword(password);
    const admAcc = accounts().find(a => normalizedEmail(a.email) === normalizedEmail(ADM_EMAIL));
    if (!admAcc) return { ok:false, msg:'Email ou senha incorretos.' };
    if (admAcc.passHash !== admPassHash) return { ok:false, msg:'Email ou senha incorretos.' };
    const list = accounts();
    const sessionToken = generateSessionToken();
    const admIdx = list.findIndex(a => normalizedEmail(a.email) === normalizedEmail(ADM_EMAIL));
    if (admIdx >= 0) { list[admIdx].sessionToken = sessionToken; setAccounts(list); writeJson('lm_user', { ...list[admIdx] }); }
    else {
      const passHash = admPassHash; // usa o hash da senha fornecida pelo usuário
      const admAccount = { name:'Suporte Lumié', email:normalizedEmail(ADM_EMAIL), passHash, key:ADM_KEY, active:true, plan:'ADM', permanent:true, moduleLimit:8, activatedAt:new Date().toISOString(), expiresAt:null, sessionToken, isAdm:true };
      list.push(admAccount); setAccounts(list); writeJson('lm_user', { ...admAccount });
    }
    return { ok:true, redirect:'painel-lumie-interno.html' };
  }
  const passHash = await hashPassword(password);
  const list = accounts();
  const acc = list.find(a => normalizedEmail(a.email) === normalizedEmail(email) && a.passHash === passHash);
  if (!acc) return { ok:false, msg:'Email ou senha incorretos.' };
  if (!acc.permanent && acc.expiresAt && new Date(acc.expiresAt) < new Date()) return { ok:false, msg:'Sua key expirou. Adquira um novo plano.' };
  const sessionToken = generateSessionToken();
  acc.sessionToken = sessionToken;
  const idx = list.findIndex(a => normalizedEmail(a.email) === normalizedEmail(email));
  list[idx] = acc; setAccounts(list); writeJson('lm_user', { ...acc });
  return { ok:true, redirect:'dashboard.html' };
}

// ─── Atualização de plano (semanal → vitalícia) ────────────────────────────────
async function upgradeAccount({ email, password, key }) {
  const cleanKey   = String(key || '').trim().toUpperCase();
  const cleanEmail = normalizedEmail(email);

  if (!cleanEmail || !password || !cleanKey) return { ok:false, msg:'Preencha todos os campos.' };
  if (!isValidKeyFormat(cleanKey) || cleanKey === ADM_KEY) return { ok:false, msg:'Chave inválida. Use uma chave gerada pelo ADM.' };

  // Valida a chave nova
  const keyRecord = findAccessKey(cleanKey) || await fetchRemoteAccessKey(cleanKey);
  if (!keyRecord) return { ok:false, msg:'Esta chave ainda não foi liberada. Peça ao ADM para gerar/liberar.' };
  if (keyRecord.used || isKeyAlreadyUsed(cleanKey)) return { ok:false, msg:'Esta chave já foi utilizada por outra conta.' };

  const planType = keyRecord.planType || (cleanKey.startsWith('LUMIE-VIT') ? 'permanent' : 'weekly');
  const access   = PLANS[planType];
  if (!access) return { ok:false, msg:'Tipo de chave inválido.' };

  // Autentica o usuário
  const passHash = await hashPassword(password);
  const list = accounts();
  const idx  = list.findIndex(a => normalizedEmail(a.email) === cleanEmail);
  if (idx < 0) return { ok:false, msg:'Email não encontrado. Verifique e tente novamente.' };
  const acc = list[idx];
  if (acc.passHash !== passHash) return { ok:false, msg:'Senha incorreta.' };
  if (isAdmUser(cleanEmail)) return { ok:false, msg:'Conta ADM não pode ser atualizada por aqui.' };

  // Atualiza apenas os campos de acesso — preserva nome, email, senha, activatedAt e histórico
  const activatedAt = acc.activatedAt || new Date().toISOString(); // mantém data original
  const expiresAt   = access.permanent ? null : new Date(Date.now() + access.days * 86400000).toISOString();
  const sessionToken = generateSessionToken();

  const updated = {
    ...acc,                      // preserva TUDO (nome, email, hash, activatedAt, etc.)
    key:          cleanKey,
    plan:         access.plan,
    days:         access.days,
    permanent:    access.permanent,
    moduleLimit:  access.moduleLimit,
    expiresAt,
    sessionToken,
    upgradedAt:   new Date().toISOString(),
    previousKey:  acc.key        // guarda a chave antiga por auditoria
  };

  list[idx] = updated;
  setAccounts(list);
  markAccessKeyUsed(cleanKey, cleanEmail);
  await markRemoteAccessKeyUsed(cleanKey, cleanEmail);
  writeJson('lm_user', { ...updated });
  return { ok:true, plan: access.plan };
}

// ─── Modais de compra / login ──────────────────────────────────────────────────
const loginModal = $('#loginModal');
const paidModal  = $('#paidModal');

let _pendingPlanType = null;
let _pendingKey      = null;
let _pendingOrderId = null;
let _pollInterval    = null;

function showCheckoutStep(step) {
  $('#checkoutStep1')?.classList.toggle('hidden', step !== 1);
  $('#checkoutStep2')?.classList.toggle('hidden', step !== 2);
}

function stopPolling() {
  if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; }
}

// Polling: verifica se o pagamento foi aprovado a cada 4s
function startPolling(paymentId, planType) {
  stopPolling();
  _pollInterval = setInterval(async () => {
    try {
      const res  = await fetch(`/api/check-payment?orderId=${paymentId}`);
      const data = await res.json();
      if (data.approved) {
        stopPolling();
        releaseKey(planType);
      }
    } catch (e) { /* silencioso */ }
  }, 4000);
}

function releaseKey(planType) {
  const access = PLANS[planType];
  const key = _pendingKey;
  const record = createAccessKey(planType, 'payment', key);
  if (!record) {
    $('#generatedKey').textContent = 'Erro ao liberar chave';
    return;
  }
  $('#generatedKey').textContent = record.key;
  $('#generatedPlan').textContent = access.permanent
    ? `${access.plan} - acesso vitalício`
    : `${access.plan} - ${access.days} dias`;
  if ($('#regKey')) $('#regKey').value = key;
  showCheckoutStep(2);
}

// Botão "Já paguei" — verifica manualmente
$('#confirmPaymentBtn')?.addEventListener('click', async () => {
  if (!_pendingOrderId || !_pendingPlanType) return;
  const btn = $('#confirmPaymentBtn');
  btn.textContent = 'Verificando...';
  btn.disabled = true;
  try {
    const res  = await fetch(`/api/check-payment?orderId=${_pendingOrderId}`);
    const data = await res.json();
    if (data.approved) {
      stopPolling();
      releaseKey(_pendingPlanType);
    } else {
      btn.textContent = 'Pagamento não encontrado ainda';
      btn.style.background = 'var(--muted)';
      setTimeout(() => {
        btn.textContent = 'Já paguei — ver minha key';
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    }
  } catch {
    btn.textContent = 'Erro ao verificar. Tente novamente.';
    setTimeout(() => { btn.textContent = 'Já paguei — ver minha key'; btn.disabled = false; }, 3000);
  }
});

// Botão copiar copia-e-cola PIX
$('#pixCopyBtn')?.addEventListener('click', () => {
  const val = $('#pixKeyInput')?.value;
  if (!val) return;
  navigator.clipboard.writeText(val).then(() => {
    const btn = $('#pixCopyBtn');
    btn.textContent = 'Copiado!';
    btn.style.color = 'var(--green)';
    setTimeout(() => { btn.textContent = 'Copiar'; btn.style.color = ''; }, 2000);
  }).catch(() => { $('#pixKeyInput')?.select(); });
});

// Fechar modal para pagamento — para o polling
paidModal?.addEventListener('close', () => stopPolling());

$$('[data-open-login]').forEach(btn => btn.addEventListener('click', () => {
  const key = $('#generatedKey')?.textContent?.trim();
  if (key && isValidKeyFormat(key) && findAccessKey(key) && $('#regKey')) $('#regKey').value = key;
  paidModal?.close(); loginModal?.showModal();
}));

$$('[data-buy]').forEach(btn => btn.addEventListener('click', async () => {
  const planType = btn.dataset.buy, access = PLANS[planType];
  if (!access) return;

  // Gera key pendente (só liberada após pagamento confirmado)
  _pendingPlanType  = planType;
  _pendingKey       = generateKey(planType);
  _pendingOrderId = null;
  stopPolling();

  // Mostra modal com loading
  if ($('#checkoutPlanLabel')) $('#checkoutPlanLabel').textContent = access.permanent
    ? `Chave Vitalícia · R$ 97,00` : `Chave Semanal · R$ 22,90`;
  if ($('#pixKeyInput'))  $('#pixKeyInput').value = 'Gerando PIX...';
  if ($('#pixQrImg'))  { $('#pixQrImg').src = ''; $('#pixQrImg').style.display = 'none'; }
  if ($('#pixPayLink')) { $('#pixPayLink').href = '#'; $('#pixPayLink').textContent = 'Carregando...'; }
  if ($('#confirmPaymentBtn')) { $('#confirmPaymentBtn').disabled = true; }
  showCheckoutStep(1);
  paidModal?.showModal();

  try {
    // Chama o backend pra criar o PIX real no Mercado Pago
    const res  = await fetch('/api/create-payment', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ planType }),
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      if ($('#pixKeyInput')) $('#pixKeyInput').value = 'Erro ao gerar PIX. Tente novamente.';
      return;
    }

    _pendingOrderId = data.orderId;

    // Preenche QR Code (imagem base64 do MP) e copia-e-cola
    if ($('#pixQrImg') && data.qrCodeBase64) {
      $('#pixQrImg').src = `data:image/png;base64,${data.qrCodeBase64}`;
      $('#pixQrImg').style.display = 'block';
    }
    if ($('#pixKeyInput')) $('#pixKeyInput').value = data.qrCode || '';
    if ($('#pixPayLink')) {
      // Link direto pro checkout do MP (abre no celular já com o PIX pronto)
      $('#pixPayLink').href = data.ticketUrl || '#';
      $('#pixPayLink').textContent = data.ticketUrl ? 'Abrir pagamento PIX' : 'PIX gerado';
    }
    if ($('#confirmPaymentBtn')) $('#confirmPaymentBtn').disabled = false;

    // Inicia polling automático
    startPolling(data.orderId, planType);

  } catch (err) {
    console.error(err);
    if ($('#pixKeyInput')) $('#pixKeyInput').value = 'Erro de conexão. Tente novamente.';
  }
}));

// ─── Menu ─────────────────────────────────────────────────────────────────────
$('#hamb')?.addEventListener('click', () => $('#navLinks')?.classList.toggle('open'));
$('#dashMenu')?.addEventListener('click', () => $('#sidebar')?.classList.toggle('open'));
$$('.nav nav a, .nav nav button').forEach(el => el.addEventListener('click', () => $('#navLinks')?.classList.remove('open')));
$$('.sidebar a:not(.brand)').forEach(link => link.addEventListener('click', () => {
  $$('.sidebar a:not(.brand)').forEach(el => el.classList.toggle('active', el === link));
  $('#sidebar')?.classList.remove('open');
}));

// ─── EmailJS ──────────────────────────────────────────────────────────────────
const EMAILJS_SERVICE          = 'service_xfigj0j';
const EMAILJS_TEMPLATE         = 'template_66qr99n';
const EMAILJS_TEMPLATE_WELCOME  = 'template_66qr99n';
const EMAILJS_SERVICE_NEW      = 'service_f1177fg';
const EMAILJS_TEMPLATE_RECOVERY = 'template_wmpoea7';
const EMAILJS_PUBLIC_OLD = 'zP279ErAvtQqvuGTO';
const EMAILJS_PUBLIC     = '7sBJtPMH64eNQ9sbU';

let _verifyCode = null, _verifyEmail = null;
function generateCode() { return String(Math.floor(100000 + Math.random() * 900000)); }

async function sendVerificationEmail(toEmail, toName, code) {
  try {
    if (typeof emailjs === 'undefined') throw new Error('EmailJS não carregado');
    emailjs.init(EMAILJS_PUBLIC_OLD);
    await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, { to_email:toEmail, to_name:toName||'Aluno', code, reply_to:'lumierecodeverify@gmail.com' });
    return { ok:true };
  } catch(e) { console.warn('[EmailJS]', e.message||e); return { ok:false, err:e }; }
}
async function sendWelcomeEmail(toEmail, toName, accessKey) {
  try {
    if (typeof emailjs === 'undefined') throw new Error('EmailJS não carregado');
    emailjs.init(EMAILJS_PUBLIC_OLD);
    await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE_WELCOME, { to_email:toEmail, to_name:toName||'Aluno', access_key:accessKey, reply_to:'lumierecodeverify@gmail.com' });
    return { ok:true };
  } catch(e) { console.warn('[EmailJS] Welcome', e.message||e); return { ok:false, err:e }; }
}
async function sendRecoveryEmail(toEmail, toName, code) {
  try {
    if (typeof emailjs === 'undefined') throw new Error('EmailJS não carregado');
    emailjs.init(EMAILJS_PUBLIC);
    await emailjs.send(EMAILJS_SERVICE_NEW, EMAILJS_TEMPLATE_RECOVERY, { to_email:toEmail, to_name:toName||'Aluno', code, reply_to:'lumierecodeverify@gmail.com' });
    return { ok:true };
  } catch(e) { console.warn('[EmailJS] Recovery', e.message||e); return { ok:false, err:e }; }
}

$('#sendCodeBtn')?.addEventListener('click', async () => {
  const name = $('#regName')?.value.trim(), email = $('#regEmail')?.value.trim();
  const pass = $('#regPass')?.value, key = ($('#regKey')?.value||'').trim().toUpperCase();
  if (!name||!email||!pass||!key) { $('#authMsg').textContent='Preencha todos os campos antes de continuar.'; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('#authMsg').textContent='Email inválido.'; return; }
  if (pass.length < 6) { $('#authMsg').textContent='Senha muito curta. Mínimo 6 caracteres.'; return; }
  if (!isValidKeyFormat(key)) { $('#authMsg').textContent='Chave inválida. Use uma chave criada pelo ADM.'; return; }
  const keyInfo = findAccessKey(key) || await fetchRemoteAccessKey(key);
  if (!keyInfo) { $('#authMsg').textContent='Esta chave ainda não foi liberada. Peça para o ADM gerar/liberar sua chave.'; return; }
  if (keyInfo.used || isKeyAlreadyUsed(key)) { $('#authMsg').textContent='Esta chave já foi utilizada.'; return; }
  const btn = $('#sendCodeBtn'); btn.textContent='Enviando...'; btn.disabled=true; $('#authMsg').textContent='';
  _verifyCode = generateCode(); _verifyEmail = email;
  const res = await sendVerificationEmail(email, name, _verifyCode);
  $('#regStep1').classList.add('hidden'); $('#regStep2').classList.remove('hidden'); $('#codeEmailLabel').textContent = email;
  if (res.ok) { $('#authMsg').textContent='✅ Código enviado! Verifique seu email (incluindo spam).'; }
  else { $('#authMsg').textContent=`⚠️ Email não configurado. Código de teste: ${_verifyCode}`; console.info('[DEV] Código:', _verifyCode); }
  btn.textContent='Enviar código de verificação'; btn.disabled=false; startResendCooldown();
});

let _resendCooldown = null;
function startResendCooldown() {
  const btn = $('#resendCodeBtn'); if (!btn) return;
  let s = 30; btn.disabled=true; btn.textContent=`Reenviar código (${s}s)`;
  clearInterval(_resendCooldown);
  _resendCooldown = setInterval(() => {
    s--;
    if (s <= 0) { clearInterval(_resendCooldown); btn.disabled=false; btn.textContent='Reenviar código'; }
    else btn.textContent=`Reenviar código (${s}s)`;
  }, 1000);
}
$('#resendCodeBtn')?.addEventListener('click', async () => {
  if (!_verifyEmail) return;
  _verifyCode = generateCode(); $('#authMsg').textContent='Reenviando...';
  const res = await sendVerificationEmail(_verifyEmail, $('#regName')?.value.trim()||'Aluno', _verifyCode);
  $('#authMsg').textContent = res.ok ? '✅ Novo código enviado!' : `⚠️ Código de teste: ${_verifyCode}`;
  if (!res.ok) console.info('[DEV]', _verifyCode);
  startResendCooldown();
});

$('#registerBtn')?.addEventListener('click', async () => {
  const code = ($('#regCode')?.value||'').trim();
  if (!_verifyCode||!_verifyEmail) { $('#authMsg').textContent='Solicite o código primeiro.'; return; }
  if (code !== _verifyCode) { $('#authMsg').textContent='❌ Código incorreto. Verifique e tente novamente.'; return; }
  $('#authMsg').textContent='Criando conta...';
  const name = $('#regName').value.trim(), key = ($('#regKey').value||'').trim().toUpperCase();
  const result = await activateAccount({ name, email:_verifyEmail, password:$('#regPass').value, key });
  if (!result.ok) { $('#authMsg').textContent=result.msg; return; }
  $('#authMsg').textContent='Enviando suas chaves por email...';
  const wRes = await sendWelcomeEmail(_verifyEmail, name, key);
  if (!wRes.ok) { console.info('[DEV] Key:', key); $('#authMsg').textContent=`⚠️ Email não configurado. Guarde sua key: ${key}`; setTimeout(() => { location.href='dashboard.html'; }, 3000); return; }
  location.href='dashboard.html';
});

$$('.tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.tab').forEach(el => el.classList.remove('active')); tab.classList.add('active');
  const t = tab.dataset.tab;
  $('#registerBox')?.classList.toggle('hidden', t!=='register');
  $('#loginBox')?.classList.toggle('hidden', t!=='login');
  $('#recoveryBox')?.classList.toggle('hidden', t!=='recovery');
  $('#upgradeBox')?.classList.toggle('hidden', t!=='upgrade');
  if ($('#authMsg')) $('#authMsg').textContent='';
}));
$('#openRecoveryBtn')?.addEventListener('click', () => {
  $$('.tab').forEach(el => el.classList.toggle('active', el.dataset.tab==='recovery'));
  $('#loginBox')?.classList.add('hidden'); $('#registerBox')?.classList.add('hidden'); $('#recoveryBox')?.classList.remove('hidden');
  if ($('#authMsg')) $('#authMsg').textContent='';
});

let _recEmail=null, _recCode=null;
$('#recVerifyBtn')?.addEventListener('click', async () => {
  const email=($('#recEmail')?.value||'').trim().toLowerCase(), accKey=($('#recRecoveryKey')?.value||'').trim().toUpperCase();
  if (!email||!accKey) { $('#authMsg').textContent='Preencha o email e sua chave de acesso.'; return; }
  const acc=accounts().find(a=>normalizedEmail(a.email)===email);
  if (!acc) { $('#authMsg').textContent='❌ Email não encontrado.'; return; }
  if (!acc.key||acc.key!==accKey) { $('#authMsg').textContent='❌ Chave de acesso não corresponde a esse email.'; return; }
  _recEmail=email; _recCode=generateCode(); $('#authMsg').textContent='Enviando código de recuperação...';
  const res=await sendRecoveryEmail(email, acc.name||'Aluno', _recCode);
  if (res.ok) { $('#authMsg').textContent='✅ Código enviado! Verifique seu email.'; }
  else { console.info('[DEV] Código de recuperação:', _recCode); $('#authMsg').textContent=`⚠️ Email não configurado. Código de teste: ${_recCode}`; }
  $('#recStep1').classList.add('hidden'); $('#recStep2').classList.remove('hidden');
});
$('#recSaveBtn')?.addEventListener('click', async () => {
  const code=($('#recCode2')?.value||'').trim(), np=$('#recNewPass')?.value||'', conf=$('#recConfirmPass')?.value||'';
  if (!_recCode||code!==_recCode) { $('#authMsg').textContent='❌ Código incorreto.'; return; }
  if (np.length<6) { $('#authMsg').textContent='Senha muito curta. Mínimo 6 caracteres.'; return; }
  if (np!==conf) { $('#authMsg').textContent='❌ As senhas não coincidem.'; return; }
  const list=accounts(); const idx=list.findIndex(a=>normalizedEmail(a.email)===_recEmail);
  if (idx<0) { $('#authMsg').textContent='Conta não encontrada.'; return; }
  list[idx].passHash=await hashPassword(np); list[idx].sessionToken=generateSessionToken(); setAccounts(list); _recCode=null;
  $('#authMsg').textContent='✅ Senha atualizada! Faça login com sua nova senha.';
  setTimeout(() => {
    $$('.tab').forEach(el=>el.classList.toggle('active', el.dataset.tab==='login'));
    $('#recoveryBox')?.classList.add('hidden'); $('#recStep1').classList.remove('hidden'); $('#recStep2').classList.add('hidden');
    $('#loginBox')?.classList.remove('hidden');
    if ($('#logEmail')) $('#logEmail').value=_recEmail||''; $('#authMsg').textContent='';
  }, 2000);
});
$('#loginBtn')?.addEventListener('click', async () => {
  $('#authMsg').textContent='Entrando...';
  const result=await login($('#logEmail').value.trim(), $('#logPass').value);
  if (!result.ok) { $('#authMsg').textContent=result.msg; return; }
  location.href=result.redirect||'dashboard.html';
});

$('#upgradeBtn')?.addEventListener('click', async () => {
  $('#authMsg').textContent='Verificando...';
  const result = await upgradeAccount({
    email: $('#upgEmail').value.trim(),
    password: $('#upgPass').value,
    key: ($('#upgKey').value||'').trim().toUpperCase()
  });
  if (!result.ok) { $('#authMsg').textContent=result.msg; return; }
  $('#authMsg').textContent=`✅ Plano atualizado para ${result.plan}! Redirecionando...`;
  setTimeout(() => { location.href='dashboard.html'; }, 1800);
});

// ─── Guard do dashboard ───────────────────────────────────────────────────────
function guardDashboard() {
  // Guarda universal: verifica sessão em QUALQUER página protegida
  const user=readJson('lm_user', null);
  if (!user || !user.active || !user.email) { location.replace('index.html'); return null; }
  if (!isValidKeyFormat(user.key)) { localStorage.removeItem('lm_user'); location.replace('index.html'); return null; }
  const list=accounts();
  const acc=list.find(a=>normalizedEmail(a.email)===normalizedEmail(user.email));
  if (!acc) { localStorage.removeItem('lm_user'); location.replace('index.html'); return null; }
  if (acc.sessionToken&&user.sessionToken&&acc.sessionToken!==user.sessionToken) {
    localStorage.removeItem('lm_user');
    // Não usa alert (bloqueia renderização) — redireciona silenciosamente com flag
    try { sessionStorage.setItem('lm_msg','Você entrou em outro dispositivo. Faça login novamente.'); } catch(e){}
    location.replace('index.html'); return null;
  }
  if (!user.permanent&&user.expiresAt&&new Date(user.expiresAt)<new Date()) {
    localStorage.removeItem('lm_user'); location.replace('index.html'); return null;
  }
  // Atualiza lastSeen para keepalive
  try { user.lastSeen=new Date().toISOString(); writeJson('lm_user', user); } catch(e){}
  return user;
}

function formatAccessInfo(access) {
  if (!access) return '';
  return access.permanent ? `${access.plan} - acesso vitalício` : `${access.plan} - ${access.days} dias`;
}

// ─── Liberação por dia ────────────────────────────────────────────────────────
function getDaysSinceActivation(user) {
  if (!user || !user.activatedAt) return 0;
  const activated = new Date(user.activatedAt);
  const now = new Date();
  // Zera horas pra contar dias inteiros (dia 1 = mesmo dia da ativação)
  const msPerDay = 86400000;
  const diff = Math.floor((now - activated) / msPerDay);
  return Math.max(0, diff);
}

// Quantos módulos estão desbloqueados agora
// Dia 0 (mesmo dia): 1 módulo | Dia 1: 2 | Dia 2: 3 ... até o total
function getUnlockedCount(user, totalModules) {
  const days = getDaysSinceActivation(user);
  return Math.min(days + 1, totalModules); // +1 porque dia 0 já libera o primeiro
}

// Retorna em quantos dias o módulo de índice `idx` será liberado
function daysUntilUnlock(idx, user) {
  const days = getDaysSinceActivation(user);
  return Math.max(0, idx - days);
}

// ─── Labels ───────────────────────────────────────────────────────────────────
const biotypeLabel  = v => ({ ecto:'Ectomorfo', meso:'Mesomorfo', endo:'Endomorfo', naosei:'A definir' }[v]||'A definir');
const genderLabel   = v => ({ male:'Homem', female:'Mulher' }[v]||'Perfil');
const styleFocusLabel = v => ({ pele:'Aparência e cuidado', roupa:'Estilo e caimento', postura:'Postura e confiança', fisico:'Físico e rotina' }[v]||'Visual geral');
const bodyTypeLabel   = v => ({ magro:'Magro', medio:'Médio', acima:'Acima do peso' }[v]||'Não informado');
const experienceLabel = v => ({ iniciante:'Iniciante', intermediario:'Intermediário', avancado:'Avançado' }[v]||'Não informado');
const sleepLabel  = v => ({ baixo:'Menos de 6h', medio:'6h a 7h', bom:'8h ou mais' }[v]||'Não informado');
const timeLabel   = v => ({ 15:'15 min/dia', 30:'30 min/dia', 45:'45+ min/dia' }[v]||'Não informado');
const goalLabel   = v => ({ massa:'Ganhar massa', definicao:'Definir', emagrecer:'Emagrecer com saúde', estilo:'Melhorar aparência' }[v]||'Evoluir aparência');

// ═════════════════════════════════════════════════════════════════════════════
// ── CONTEÚDO DOS MÓDULOS DO CURSO — VERSÃO PREMIUM ───────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function buildModuleContent(id, gender) {
  const isMale = gender === 'male';

  const modules = {

    // ── Módulo 1: Comece por aqui ──────────────────────────────────────────
    m_welcome: {
      eyebrow: 'Módulo 1',
      title: 'Comece por aqui: o básico que muda tudo',
      intro: 'Antes de procurar fórmula secreta, você precisa dominar o básico. A maioria das pessoas não parece cansada, descuidada ou sem presença por falta de genética perfeita. Muitas vezes, o problema é falta de rotina.',
      body: `
        <div class="safe-box"><p><strong>⚕️ Aviso importante:</strong> Este conteúdo não substitui médico, dermatologista, nutricionista, dentista, psicólogo ou qualquer profissional de saúde. Não use hormônios, medicamentos, dietas extremas ou procedimentos sem acompanhamento profissional.</p></div>

        <div class="module-section">
          <h3>O que este curso não é</h3>
          <p>Este curso não existe para te comparar com ninguém. Ele existe para te dar método. Você não vai encontrar aqui promessas impossíveis, dietas loucas ou técnicas que exijam genética perfeita.</p>
          <p>O que você vai encontrar é simples: rotina, consistência e os pequenos hábitos que a maioria das pessoas ignora — e que fazem toda a diferença.</p>
        </div>

        <div class="module-section">
          <h3>O que você vai trabalhar</h3>
          <div class="pillars-grid">
            ${['Pele','Sono','Postura','Cabelo','Grooming ou Maquiagem','Nutrição','Hidratação','Higiene','Estilo','Presença'].map(p=>`<div class="pillar-item">${p}</div>`).join('')}
          </div>
        </div>

        <div class="module-section">
          <h3 style="font-style:italic;opacity:.85">"Você não precisa virar outra pessoa. Precisa parar de abandonar a versão que já existe."</h3>
        </div>

        <div class="module-section">
          <h3>✅ Checklist inicial</h3>
          <div class="checklist-module" id="checklist-welcome">
            ${['Escolher 3 pontos principais para melhorar','Criar uma rotina simples e possível','Fazer o básico por 7 dias seguidos','Evitar exageros e mudanças bruscas','Marcar progresso todos os dias'].map(item=>`<label><input type="checkbox" data-mod-check="welcome" data-item="${item}"><span>${item}</span></label>`).join('')}
          </div>
        </div>

        <div class="task-box"><div class="task-title">📌 Tarefa de hoje</div><p>Escolha um hábito pequeno e possível para começar amanhã. Não precisa ser perfeito — precisa ser real.</p></div>
      `
    },

    // ── Módulo 2: Coisas que ninguém te mostrou ────────────────────────────
    m_fundamentals: {
      eyebrow: 'Módulo 2',
      title: 'Coisas que ninguém te mostrou sobre aparência',
      intro: 'Aparência não é só rosto. Aparência é conjunto. Uma pessoa pode mudar muito sua apresentação sem mudar quem ela é — quando ela melhora os detalhes que todo mundo percebe, mesmo sem perceber conscientemente.',
      body: `
        <div class="module-section">
          <h3>Os detalhes que fazem diferença</h3>
          <div class="pillars-grid">
            ${['Pele limpa','Cabelo alinhado','Postura melhor','Roupa com caimento','Hálito bom','Unhas cuidadas','Cheiro agradável','Sono em dia','Expressão descansada','Corpo com energia','Segurança ao andar'].map(p=>`<div class="pillar-item">${p}</div>`).join('')}
          </div>
        </div>

        <div class="module-section">
          <h3 style="font-style:italic;opacity:.85">"O segredo não é fazer uma coisa absurda. É parar de errar em dez coisas pequenas."</h3>
        </div>

        ${isMale ? `
        <div class="module-section">
          <h3>O que separa um homem comum de um homem bem cuidado</h3>
          <p>Não é o shape. Não é a mandíbula. É pele limpa, barba ou rosto alinhado, roupa sem amassado, tênis limpo, postura aberta e presença calma. São coisas que qualquer pessoa consegue fazer — e poucos fazem bem.</p>
        </div>` : `
        <div class="module-section">
          <h3>O que separa uma aparência comum de uma aparência bem cuidada</h3>
          <p>Não é a maquiagem cara. Não é o procedimento estético. É pele hidratada, cabelo limpo, roupa com caimento, sobrancelha alinhada e postura ereta. São hábitos simples — e a maioria das pessoas ignora pelo menos metade deles.</p>
        </div>`}

        <div class="module-section">
          <h3>✅ Escolha 5 detalhes para melhorar esta semana</h3>
          <div class="checklist-module">
            ${['Pele e rotina facial','Sono e descanso','Postura e alinhamento','Cabelo e grooming','Alimentação e hidratação','Estilo e caimento da roupa','Higiene e saúde bucal','Expressão e linguagem corporal'].map(item=>`<label><input type="checkbox" data-mod-check="fundamentals" data-item="${item}"><span>${item}</span></label>`).join('')}
          </div>
        </div>

        <div class="safe-box"><p>O foco é valorizar seus traços, não criar pressão estética. Cada pessoa tem estrutura própria — e o objetivo é cuidar melhor da que você já tem.</p></div>
      `
    },

    // ── Módulo 3: Manual do rosto limpo (masculino) ────────────────────────
    m_skin_male: {
      eyebrow: 'Módulo 3 — Masculino',
      title: 'Manual do rosto limpo: pare de parecer cansado sem precisar inventar moda',
      intro: 'A pele masculina costuma sofrer com oleosidade, suor, barba, lâmina, treino e falta de rotina. O objetivo não é usar mil produtos. O objetivo é fazer o simples bem feito — todos os dias.',
      body: `
        <div class="safe-box"><p><strong>⚕️ Aviso:</strong> Para acne persistente, rosácea ou condições de pele, procure um dermatologista. Este conteúdo é educativo.</p></div>

        <div class="module-section">
          <h3 style="font-style:italic;opacity:.85">"O erro silencioso: achar que skincare é frescura enquanto sua pele entrega cansaço."</h3>
        </div>

        <div class="module-section">
          <h3>☀️ Rotina da manhã</h3>
          <ol class="steps-list">
            <li>Lavar o rosto com água fria ou morna</li>
            <li>Usar sabonete facial adequado ao seu tipo de pele</li>
            <li>Aplicar hidratante leve</li>
            <li>Usar protetor solar — todos os dias, sem exceção</li>
            <li>Arrumar cabelo e barba antes de sair</li>
          </ol>
        </div>

        <div class="module-section">
          <h3>🌙 Rotina da noite</h3>
          <ol class="steps-list">
            <li>Lavar o rosto</li>
            <li>Remover suor, sujeira e oleosidade do dia</li>
            <li>Aplicar hidratante</li>
            <li>Não dormir com rosto oleoso ou sujo</li>
          </ol>
        </div>

        <div class="module-section">
          <h3>Seu tipo de pele</h3>
          <p><strong>Pele oleosa:</strong> Sabonete em gel, hidratante leve (oil-free) e protetor solar toque seco.</p>
          <p><strong>Pele seca:</strong> Sabonete suave, hidratante mais nutritivo. Evite lavar muitas vezes ao dia.</p>
          <p><strong>Pele sensível:</strong> Produtos sem perfume, sem esfoliação forte. Observe o que causa vermelhidão.</p>
          <p><strong>Pele acneica:</strong> Não espreme espinhas. Troque a fronha com frequência. Procure dermatologista se for constante.</p>
        </div>

        <div class="module-section">
          <h3>🪒 Barba</h3>
          <ul>
            <li>Barba cheia precisa estar limpa e bem aparada</li>
            <li>Barba falhada funciona melhor curta</li>
            <li>Rosto sem barba precisa estar limpo e barbeado</li>
            <li>Linhas naturais ficam melhor do que linhas muito artificiais</li>
            <li>Hidratar a região evita irritação</li>
          </ul>
        </div>

        <div class="task-box"><div class="task-title">📌 Tarefa: 7 dias de rotina</div>
          <div class="checklist-module">
            ${['Lavar rosto pela manhã','Usar protetor solar todos os dias','Lavar rosto à noite','Trocar a fronha','Não espremer espinhas'].map(i=>`<label><input type="checkbox" data-mod-check="skin_male" data-item="${i}"><span>${i}</span></label>`).join('')}
          </div>
        </div>
      `
    },

    // ── Módulo 3: Rotina de pele que dá para seguir (feminino) ────────────
    m_skin_female: {
      eyebrow: 'Módulo 3 — Feminino',
      title: 'Rotina de pele que realmente dá para seguir',
      intro: 'Uma pele bonita começa com constância, não com excesso. O erro mais comum é tentar usar muitos produtos ao mesmo tempo e acabar irritando a pele. Menos produto, mais consistência.',
      body: `
        <div class="safe-box"><p><strong>⚕️ Aviso:</strong> Para acne, rosácea ou condições específicas, procure um dermatologista. Este conteúdo é educativo.</p></div>

        <div class="module-section">
          <h3 style="font-style:italic;opacity:.85">"O glow não vem de 15 produtos. Vem de uma pele que parou de ser agredida."</h3>
        </div>

        <div class="module-section">
          <h3>☀️ Rotina da manhã</h3>
          <ol class="steps-list">
            <li>Limpeza suave</li>
            <li>Vitamina C — se a pele tolerar</li>
            <li>Hidratante</li>
            <li>Protetor solar — todos os dias, sem exceção</li>
            <li>Maquiagem opcional</li>
          </ol>
        </div>

        <div class="module-section">
          <h3>🌙 Rotina da noite</h3>
          <ol class="steps-list">
            <li>Remover maquiagem com água micelar, cleansing oil ou balm</li>
            <li>Segunda limpeza com sabonete facial suave (double cleansing)</li>
            <li>Aplicar hidratante</li>
            <li>Usar ativos com cuidado — sem misturar muitos ao mesmo tempo</li>
            <li>Dormir com a pele limpa</li>
          </ol>
        </div>

        <div class="module-section">
          <h3>O que é double cleansing?</h3>
          <p>Limpeza em duas etapas: a primeira remove maquiagem, protetor solar e oleosidade. A segunda limpa a pele com sabonete suave. Ideal para quem usa maquiagem ou protetor resistente — mas não precisa ser agressiva.</p>
        </div>

        <div class="module-section">
          <h3>⚠️ Cuidados que muita gente ignora</h3>
          <ul>
            <li>Não dormir maquiada — nunca</li>
            <li>Não esfregar o rosto com força</li>
            <li>Não misturar muitos ativos sem orientação</li>
            <li>Trocar a fronha com frequência</li>
            <li>Higienizar pincéis regularmente</li>
            <li>Usar protetor solar mesmo em dias nublados</li>
          </ul>
        </div>

        <div class="task-box"><div class="task-title">📌 Tarefa: 7 dias de rotina</div>
          <div class="checklist-module">
            ${['Limpeza suave pela manhã','Protetor solar todos os dias','Remover maquiagem à noite se usar','Hidratar antes de dormir','Observar sinais de irritação ou melhora'].map(i=>`<label><input type="checkbox" data-mod-check="skin_female" data-item="${i}"><span>${i}</span></label>`).join('')}
          </div>
        </div>
      `
    },

    // ── Módulo 4: Crioterapia ──────────────────────────────────────────────
    m_cryo: {
      eyebrow: 'Módulo 4',
      title: 'Crioterapia facial: o que funciona, o que não funciona e como fazer com segurança',
      intro: 'A crioterapia facial é o uso controlado do frio no rosto para ajudar com sensação de inchaço, cansaço e vermelhidão temporária. É uma técnica complementar — não substituição de rotina.',
      body: `
        <div class="safe-box"><p><strong>⚠️ Atenção:</strong> Não aplique gelo direto na pele por tempo prolongado. O uso incorreto pode causar irritação, queimadura por frio ou piorar sensibilidades. Em caso de dúvida, consulte um dermatologista.</p></div>

        <div class="module-section">
          <h3>Como fazer com segurança</h3>
          <ol class="steps-list">
            <li>Envolver o gelo em um pano limpo — nunca direto na pele</li>
            <li>Passar suavemente no rosto com movimentos leves</li>
            <li>Não pressionar com força nem ficar muito tempo na mesma região</li>
            <li>Usar por poucos minutos no máximo</li>
            <li>Hidratar a pele depois</li>
            <li>Usar protetor solar durante o dia</li>
          </ol>
        </div>

        <div class="module-section">
          <h3>Frequência recomendada</h3>
          <p>2 a 4 vezes por semana, ou em dias de maior inchaço. Não precisa fazer várias vezes ao dia — mais não é melhor aqui.</p>
        </div>

        <div class="module-section">
          <h3>❌ Quando evitar</h3>
          <p>Rosácea intensa, feridas abertas, queimaduras, sensibilidade alta ao frio, pele muito irritada ou condição de pele ativa.</p>
        </div>

        ${isMale ? `
        <div class="module-section">
          <h3>Para homens</h3>
          <p>Útil em manhãs de rosto inchado ou depois de noite ruim de sono. Combine com a rotina facial básica — não substitui limpeza, hidratação e protetor solar.</p>
        </div>` : `
        <div class="module-section">
          <h3>Para mulheres</h3>
          <p>Ice globes e gua sha frio também podem ser usados, sempre com movimentos leves e sem pressão excessiva. O objetivo é relaxar e reduzir aparência de inchaço — não forçar ou arrastar o rosto.</p>
        </div>`}

        <div class="task-box"><div class="task-title">📌 Tarefa</div><p>Testar a técnica no máximo 2 vezes na primeira semana e observar como a pele reage antes de continuar.</p></div>
      `
    },

    // ── Módulo 5: Cabelo, barba e presença (masculino) ─────────────────────
    m_hair_male: {
      eyebrow: 'Módulo 5 — Masculino',
      title: 'Cabelo, barba e presença: a diferença entre estar largado e estar alinhado',
      intro: 'Cabelo e barba moldam a percepção do rosto. Um corte ruim pode esconder seu potencial. Um corte certo pode deixar sua aparência mais limpa e organizada — sem precisar mudar quem você é.',
      body: `
        <div class="module-section">
          <h3 style="font-style:italic;opacity:.85">"O corte certo não muda quem você é. Ele só para de atrapalhar."</h3>
        </div>

        <div class="module-section">
          <h3>Cabelo</h3>
          <ul>
            <li>Escolher corte que combine com o formato do rosto</li>
            <li>Manter manutenção em dia — não deixar crescer sem forma</li>
            <li>Evitar cabelo oleoso ou sem estrutura</li>
            <li>Usar produto com moderação — não exagerar em gel ou pomada</li>
            <li>Lavar conforme necessidade do couro cabeludo</li>
          </ul>
        </div>

        <div class="module-section">
          <h3>Barba</h3>
          <ul>
            <li>Barba cheia precisa estar aparada e com linhas limpas</li>
            <li>Barba falhada funciona melhor mantida curta</li>
            <li>Rosto sem barba precisa estar limpo e bem barbeado</li>
            <li>Linhas naturais costumam ficar melhores que linhas muito artificiais</li>
            <li>Hidratar a região evita irritação e ressecamento</li>
          </ul>
        </div>

        <div class="module-section">
          <h3>Presença masculina</h3>
          <p>A presença não vem de tentar parecer intimidador. Vem de postura, calma, higiene e roupa bem ajustada.</p>
          <ul>
            <li>Ombros abertos sem forçar</li>
            <li>Queixo neutro</li>
            <li>Olhar relaxado</li>
            <li>Andar com calma e passos firmes</li>
            <li>Falar sem pressa exagerada</li>
            <li>Roupa limpa e com bom caimento</li>
          </ul>
        </div>

        <div class="task-box"><div class="task-title">📌 Escolha uma melhoria de grooming para esta semana</div>
          <div class="checklist-module">
            ${['Cortar ou organizar o cabelo','Aparar ou definir a barba','Ajustar a sobrancelha','Revisar o perfume','Limpar os tênis','Organizar roupas por caimento'].map(i=>`<label><input type="checkbox" data-mod-check="hair_male" data-item="${i}"><span>${i}</span></label>`).join('')}
          </div>
        </div>
      `
    },

    // ── Módulo 5: Cabelo, maquiagem e presença (feminino) ──────────────────
    m_hair_female: {
      eyebrow: 'Módulo 5 — Feminino',
      title: 'Cabelo, maquiagem e presença: detalhes que mudam sua energia visual',
      intro: 'Cabelo, maquiagem e postura são ferramentas de expressão — não obrigações. O objetivo é te ajudar a valorizar seus traços com naturalidade e consistência.',
      body: `
        <div class="module-section">
          <h3 style="font-style:italic;opacity:.85">"Maquiagem boa não apaga você. Ela organiza o que você quer mostrar."</h3>
        </div>

        <div class="module-section">
          <h3>Cabelo</h3>
          <ul>
            <li>Manter cabelo limpo — aparência de cabelo oleoso muda tudo</li>
            <li>Cuidar das pontas regularmente</li>
            <li>Evitar calor excessivo sem proteção térmica</li>
            <li>Escolher finalização compatível com seu tipo de fio</li>
            <li>Usar penteados que valorizem o rosto</li>
            <li>Fazer hidratação conforme necessidade</li>
          </ul>
        </div>

        <div class="module-section">
          <h3>Maquiagem</h3>
          <p>A maquiagem deve realçar, não esconder. Pontos fundamentais:</p>
          <ul>
            <li>Preparar a pele antes de aplicar</li>
            <li>Usar produtos compatíveis com seu tom</li>
            <li>Remover tudo antes de dormir — sempre</li>
            <li>Higienizar pincéis com frequência</li>
            <li>Evitar produtos vencidos</li>
          </ul>
        </div>

        <div class="module-section">
          <h3>Sobrancelhas</h3>
          <p>As sobrancelhas enquadram a expressão facial. O ideal é manter formato limpo e natural — sem exagerar na retirada.</p>
        </div>

        <div class="module-section">
          <h3>Presença feminina</h3>
          <ul>
            <li>Coluna alongada</li>
            <li>Queixo neutro</li>
            <li>Expressão relaxada — sem tensão no rosto</li>
            <li>Movimentos leves e conscientes</li>
            <li>Respiração calma</li>
            <li>Roupa confortável e bonita</li>
          </ul>
        </div>

        <div class="task-box"><div class="task-title">📌 Escolha uma melhoria para esta semana</div>
          <div class="checklist-module">
            ${['Organizar a rotina do cabelo','Limpar os pincéis de maquiagem','Ajustar a sobrancelha','Montar rotina de desmaquiagem','Separar looks que valorizem seu estilo','Praticar postura no espelho'].map(i=>`<label><input type="checkbox" data-mod-check="hair_female" data-item="${i}"><span>${i}</span></label>`).join('')}
          </div>
        </div>
      `
    },

    // ── Módulo 6: Nutrição ─────────────────────────────────────────────────
    m_nutrition: {
      eyebrow: 'Módulo 6',
      title: 'Nutrição sem loucura: o que sua pele, cabelo e corpo sentem primeiro',
      intro: 'Alimentação influencia pele, cabelo, energia e recuperação. Mas o objetivo não é dieta extrema. O objetivo é comer melhor de forma possível e sustentável — sem destruir a relação com comida.',
      body: `
        <div class="safe-box"><p><strong>⚕️ Aviso:</strong> Para dietas, suplementação, condições de saúde específicas ou objetivos intensos de composição corporal, consulte um nutricionista ou médico.</p></div>

        <div class="module-section">
          <h3 style="font-style:italic;opacity:.85">"Dieta que te destrói por dentro não melhora você por fora."</h3>
        </div>

        <div class="module-section">
          <h3>A base que funciona</h3>
          <ul>
            <li>Água ao longo do dia — não espere sentir sede</li>
            <li>Proteína suficiente em todas as refeições</li>
            <li>Frutas, verduras e legumes</li>
            <li>Carboidratos de qualidade</li>
            <li>Gorduras boas (azeite, ovos, abacate, castanhas)</li>
            <li>Menos ultraprocessados no dia a dia</li>
            <li>Menos exageros constantes de açúcar</li>
          </ul>
        </div>

        <div class="module-section">
          <h3>Nutrientes importantes para aparência</h3>
          <p><strong>Vitamina A:</strong> Relacionada à renovação celular e saúde da pele.</p>
          <p><strong>Vitamina C:</strong> Importante para colágeno e defesa antioxidante.</p>
          <p><strong>Vitamina E:</strong> Proteção celular e saúde da pele.</p>
          <p><strong>Vitamina D:</strong> Importante para imunidade e equilíbrio geral.</p>
          <p><strong>Zinco:</strong> Participa de processos ligados à pele, cicatrização e imunidade.</p>
          <p><strong>Ômega-3:</strong> Pode ajudar em processos inflamatórios e saúde geral.</p>
          <p><strong>Proteína:</strong> Base para cabelo, pele, unhas e recuperação muscular.</p>
        </div>

        ${isMale ? `
        <div class="module-section">
          <h3>Foco masculino</h3>
          <ul>
            <li>Proteína suficiente para recuperação e energia</li>
            <li>Hidratação constante — especialmente se treina</li>
            <li>Evitar álcool em excesso</li>
            <li>Não usar hormônios ou atalhos sem acompanhamento médico</li>
            <li>Consistência vale mais do que perfeição alimentar</li>
          </ul>
        </div>` : `
        <div class="module-section">
          <h3>Foco feminino</h3>
          <ul>
            <li>Comer o suficiente — restrição extrema prejudica pele, cabelo e humor</li>
            <li>Observar ferro e vitamina D com acompanhamento profissional</li>
            <li>Manter proteína adequada</li>
            <li>Hidratação constante</li>
            <li>Evitar dietas muito restritivas que cortem grupos alimentares inteiros</li>
          </ul>
        </div>`}

        <div class="task-box"><div class="task-title">📌 Tarefa: Monte um prato base por dia com</div>
          <div class="checklist-module">
            ${['Uma fonte de proteína','Um carboidrato de qualidade','Verduras ou legumes','Água durante a refeição','Uma fruta no dia'].map(i=>`<label><input type="checkbox" data-mod-check="nutrition" data-item="${i}"><span>${i}</span></label>`).join('')}
          </div>
        </div>
      `
    },

    // ── Módulo 7: Sono ─────────────────────────────────────────────────────
    m_sleep: {
      eyebrow: 'Módulo 7',
      title: 'Sono: o filtro natural que muita gente ignora',
      intro: 'Sono ruim aparece no rosto. Ele muda energia, humor, fome, pele, recuperação e expressão. Antes de procurar produtos caros, arrume o descanso.',
      body: `
        <div class="module-section">
          <h3 style="font-style:italic;opacity:.85">"Você pode comprar skincare caro, mas se dorme mal todo dia, seu rosto vai cobrar."</h3>
        </div>

        <div class="module-section">
          <h3>Por que o sono importa para o visual</h3>
          <ul>
            <li>A pele se recupera durante a noite</li>
            <li>Inchaço e olheiras se intensificam com sono ruim</li>
            <li>Energia e humor refletem diretamente na expressão</li>
            <li>Cortisol elevado por privação de sono prejudica a pele</li>
            <li>Recuperação muscular acontece durante o sono</li>
          </ul>
        </div>

        <div class="module-section">
          <h3>🌙 2 horas antes de dormir</h3>
          <ul>
            <li>Reduzir telas — não precisa ser zero, mas menos</li>
            <li>Evitar luz forte e estímulos intensos</li>
            <li>Evitar refeições muito pesadas</li>
            <li>Organizar o ambiente do quarto</li>
          </ul>
        </div>

        <div class="module-section">
          <h3>1 hora antes</h3>
          <ul>
            <li>Banho</li>
            <li>Skincare noturno</li>
            <li>Separar roupa do dia seguinte</li>
            <li>Deixar o quarto mais escuro</li>
          </ul>
        </div>

        <div class="module-section">
          <h3>☀️ Ao acordar</h3>
          <ul>
            <li>Beber água antes do café</li>
            <li>Pegar luz natural — abre o ciclo do dia</li>
            <li>Fazer movimento leve</li>
            <li>Evitar celular imediatamente, se possível</li>
          </ul>
        </div>

        ${isMale ? `
        <div class="module-section">
          <h3>Dica masculina</h3>
          <p>Tente não dormir sempre pressionando o mesmo lado do rosto. Sono de qualidade ajuda na recuperação do treino, na energia e na aparência descansada.</p>
        </div>` : `
        <div class="module-section">
          <h3>Dica feminina</h3>
          <p>Uma fronha de seda ou touca de cetim pode reduzir atrito no cabelo durante a noite. Máscara de dormir pode ajudar se o quarto tiver muita luz.</p>
        </div>`}

        <div class="task-box"><div class="task-title">📌 Tarefa: 7 dias de sono melhor</div>
          <div class="checklist-module">
            ${['Dormir e acordar em horários parecidos','Reduzir tela pelo menos 30 min antes de dormir','Fazer rotina noturna de pele','Beber água ao acordar'].map(i=>`<label><input type="checkbox" data-mod-check="sleep" data-item="${i}"><span>${i}</span></label>`).join('')}
          </div>
        </div>
      `
    },

    // ── Módulo 8: Postura ──────────────────────────────────────────────────
    m_posture: {
      eyebrow: 'Módulo 8',
      title: 'Postura: o upgrade gratuito que quase ninguém leva a sério',
      intro: 'Postura muda como você ocupa espaço. Ela não serve para fingir confiança. Serve para o corpo comunicar presença — sem precisar dizer nada.',
      body: `
        <div class="module-section">
          <h3 style="font-style:italic;opacity:.85">"Antes de tentar parecer confiante, pare de se esconder na própria postura."</h3>
        </div>

        <div class="module-section">
          <h3>Pontos fundamentais de alinhamento</h3>
          <ul>
            <li>Queixo neutro — nem para cima, nem para baixo</li>
            <li>Pescoço alinhado com a coluna</li>
            <li>Ombros relaxados para trás, sem tensão</li>
            <li>Coluna ereta sem rigidez exagerada</li>
            <li>Respiração calma e baixa</li>
            <li>Evitar cabeça projetada para frente</li>
            <li>Evitar tensão acumulada no rosto</li>
          </ul>
        </div>

        ${isMale ? `
        <div class="module-section">
          <h3>Presença masculina</h3>
          <ul>
            <li>Ombros abertos sem parecer forçado</li>
            <li>Passos firmes e calmos</li>
            <li>Olhar relaxado — não tenso, não vago</li>
            <li>Falar com clareza e sem pressa</li>
            <li>Evitar postura curvada no celular e no computador</li>
          </ul>
          <p>Sobre mewing: é apenas uma postura leve da língua no céu da boca. Não promete mudança facial — não acredite em exageros sobre isso.</p>
        </div>` : `
        <div class="module-section">
          <h3>Elegância e porte</h3>
          <ul>
            <li>Coluna longa — imagine um fio puxando o topo da cabeça para cima</li>
            <li>Pescoço alinhado, não projetado</li>
            <li>Expressão tranquila</li>
            <li>Movimentos leves e conscientes</li>
            <li>Respiração baixa e calma</li>
            <li>Porte elegante sem rigidez</li>
          </ul>
        </div>`}

        <div class="module-section">
          <h3>Exercício diário — 5 minutos</h3>
          <ol class="steps-list">
            <li>Ficar em pé encostado na parede</li>
            <li>Encostar nuca, costas e quadril na parede</li>
            <li>Relaxar os ombros — não forçar para trás</li>
            <li>Manter queixo neutro</li>
            <li>Respirar fundo 3 vezes</li>
            <li>Sair da parede e caminhar mantendo o alinhamento</li>
          </ol>
        </div>

        <div class="task-box"><div class="task-title">📌 Tarefa</div><p>Fazer o exercício de postura por 5 minutos todos os dias durante uma semana. Só isso.</p></div>
      `
    },

    // ── Módulo 9: Estilo ───────────────────────────────────────────────────
    m_style: {
      eyebrow: 'Módulo 9',
      title: 'A diferença entre roupa cara e aparência bem cuidada',
      intro: 'Estilo não é sobre marca. É sobre caimento, limpeza, combinação e intenção. Roupa simples bem usada vence roupa cara mal escolhida.',
      body: `
        <div class="module-section">
          <h3 style="font-style:italic;opacity:.85">"Roupa cara mal usada perde para roupa simples bem escolhida."</h3>
        </div>

        <div class="module-section">
          <h3>O checklist que muita gente ignora</h3>
          <ul>
            <li>Roupas limpas e sem amassado</li>
            <li>Bom caimento — nem larga demais, nem apertada demais</li>
            <li>Cores que combinam entre si</li>
            <li>Tênis ou sapato limpo</li>
            <li>Perfume na medida certa</li>
            <li>Unhas cuidadas</li>
            <li>Hálito em dia</li>
            <li>Cabelo organizado</li>
          </ul>
        </div>

        ${isMale ? `
        <div class="module-section">
          <h3>Para homens</h3>
          <ul>
            <li>Camisetas com bom caimento — sem largura excessiva</li>
            <li>Calça sem sobra demais nas pernas</li>
            <li>Tênis limpo — detalhe que todo mundo percebe</li>
            <li>Barba e cabelo em harmonia com a roupa</li>
            <li>Perfume sem exagero — menos é mais</li>
            <li>Peças básicas de qualidade valem mais que peças de grife mal usadas</li>
          </ul>
        </div>` : `
        <div class="module-section">
          <h3>Para mulheres</h3>
          <ul>
            <li>Roupas que combinem com seu estilo pessoal — não com o de todo mundo</li>
            <li>Cabelo e acessórios em harmonia</li>
            <li>Maquiagem opcional e equilibrada</li>
            <li>Sapatos limpos e cuidados</li>
            <li>Acessórios simples — sem excesso visual</li>
            <li>Peças confortáveis que te deixem segura</li>
          </ul>
        </div>`}

        <div class="task-box"><div class="task-title">📌 Monte 3 combinações de roupa</div>
          <div class="checklist-module">
            ${['Para o dia a dia','Para sair ou socializar','Para uma ocasião mais arrumada'].map(i=>`<label><input type="checkbox" data-mod-check="style" data-item="${i}"><span>${i}</span></label>`).join('')}
          </div>
        </div>
      `
    },

    // ── Módulo 10: Higiene ─────────────────────────────────────────────────
    m_hygiene: {
      eyebrow: 'Módulo 10',
      title: 'Detalhes invisíveis que todo mundo percebe',
      intro: 'Algumas coisas quase ninguém comenta, mas todo mundo nota: hálito, cheiro, unhas, cabelo oleoso, roupa mal cuidada, tênis sujo. São os detalhes silenciosos que separam quem parece arrumado de quem realmente está arrumado.',
      body: `
        <div class="safe-box"><p><strong>⚕️ Aviso:</strong> Para saúde bucal, consulte um dentista regularmente. Este conteúdo não substitui acompanhamento profissional.</p></div>

        <div class="module-section">
          <h3 style="font-style:italic;opacity:.85">"O cuidado que ninguém vê é o que faz parecer que você sempre está arrumado."</h3>
        </div>

        <div class="module-section">
          <h3>Checklist de higiene completa</h3>
          <ul>
            <li>Escovar os dentes corretamente — mínimo 2x ao dia</li>
            <li>Usar fio dental</li>
            <li>Limpar a língua</li>
            <li>Cuidar do hálito</li>
            <li>Manter unhas limpas e aparadas</li>
            <li>Lavar roupas com regularidade</li>
            <li>Cuidar do cheiro corporal</li>
            <li>Manter cabelo limpo</li>
          </ul>
        </div>

        <div class="module-section">
          <h3>✅ Checklist semanal</h3>
          <div class="checklist-module">
            ${['Trocar fronha','Trocar ou lavar toalha','Cortar ou limar unhas','Organizar cabelo, barba ou sobrancelha','Verificar escova de dentes (trocar a cada 3 meses)','Limpar tênis ou sapatos','Separar roupas limpas da semana'].map(i=>`<label><input type="checkbox" data-mod-check="hygiene" data-item="${i}"><span>${i}</span></label>`).join('')}
          </div>
        </div>
      `
    },

    // ── Módulo 11: Rotina semanal ──────────────────────────────────────────
    m_weekly: {
      eyebrow: 'Módulo 11',
      title: 'A rotina que parece simples, mas muda sua presença',
      intro: 'A evolução vem da repetição. Uma rotina simples feita todos os dias vale mais do que uma rotina perfeita feita uma vez. Use este módulo como referência para organizar sua semana.',
      body: `
        <div class="module-section">
          <h3 style="font-style:italic;opacity:.85">"Aparência é rotina, não sorte."</h3>
        </div>

        <div class="module-section">
          <h3>☀️ Manhã — o básico que abre o dia</h3>
          <ul>
            <li>Beber água ao acordar</li>
            <li>Lavar o rosto</li>
            <li>Hidratar e usar protetor solar</li>
            <li>Arrumar cabelo ${isMale ? 'e barba' : ''}</li>
            <li>Conferir postura antes de sair</li>
          </ul>
        </div>

        <div class="module-section">
          <h3>Durante o dia</h3>
          <ul>
            <li>Manter hidratação</li>
            <li>Comer de forma equilibrada</li>
            <li>Corrigir postura quando perceber que está curvado</li>
            <li>Evitar tocar o rosto com frequência</li>
            ${isMale ? '<li>Caminhar ou treinar se estiver no plano</li>' : '<li>Fazer movimento — caminhada já conta</li>'}
          </ul>
        </div>

        <div class="module-section">
          <h3>🌙 Noite — fechar o dia bem</h3>
          <ul>
            <li>Limpar o rosto</li>
            <li>${isMale ? 'Manter barba cuidada' : 'Remover maquiagem se usar'}</li>
            <li>Hidratar</li>
            <li>Organizar roupa do dia seguinte</li>
            <li>Reduzir tela antes de dormir</li>
            <li>Priorizar sono de qualidade</li>
          </ul>
        </div>

        <div class="module-section">
          <h3>Revisão semanal — 10 minutos</h3>
          <div class="checklist-module">
            ${['Revisar o que funcionou na semana','Trocar fronha','Ajustar cabelo, barba ou sobrancelha','Organizar roupas da próxima semana','Planejar treino ou caminhada','Identificar um hábito para melhorar'].map(i=>`<label><input type="checkbox" data-mod-check="weekly_mod" data-item="${i}"><span>${i}</span></label>`).join('')}
          </div>
        </div>
      `
    }
  };
  return modules[id] || { eyebrow:'Módulo', title:'Conteúdo', intro:'', body:'' };
}

// ─── Definição dos módulos por gênero ─────────────────────────────────────────
function getCourseModules(gender) {
  const isMale = gender === 'male';
  const base = [
    { id:'m_welcome',      title:'O básico que muda tudo',              desc:'Entenda a proposta do curso e organize seus primeiros hábitos com método.',  time:'10 min', tag:'essencial', importance:'Primeiro passo obrigatório' },
    { id:'m_fundamentals', title:'Coisas que ninguém te mostrou',       desc:'Os detalhes que todo mundo percebe — e que a maioria ainda ignora.',          time:'12 min', tag:'essencial', importance:'Base do curso' },
    { id:'m_cryo',         title:'Crioterapia: como fazer com segurança', desc:'O uso correto do frio para aparência descansada e sem inchaço.',            time:'8 min',  tag:'opcional',  importance:'Técnica complementar' },
    { id:'m_nutrition',    title:'Nutrição sem loucura',                 desc:'O que sua pele, cabelo e corpo sentem primeiro quando você come melhor.',     time:'18 min', tag:'essencial', importance:'Pilar interno' },
    { id:'m_sleep',        title:'Sono: o filtro natural',               desc:'Dormir bem transforma mais a aparência do que qualquer produto caro.',        time:'12 min', tag:'essencial', importance:'Pilar de recuperação' },
    { id:'m_posture',      title:'Postura: o upgrade gratuito',          desc:'Alinhe o corpo e transmita presença sem precisar mudar quem você é.',        time:'10 min', tag:'diario',    importance:'Impacto imediato' },
    { id:'m_style',        title:'A diferença entre caro e bem cuidado', desc:'Estilo é caimento, limpeza e intenção — não etiqueta.',                       time:'12 min', tag:'diario',    importance:'Apresentação pessoal' },
    { id:'m_hygiene',      title:'Detalhes invisíveis que todos percebem', desc:'O checklist silencioso que separa quem parece cuidado de quem está.',       time:'8 min',  tag:'essencial', importance:'Base obrigatória' },
    { id:'m_weekly',       title:'A rotina que muda sua presença',       desc:'Transforme tudo em uma rotina simples, repetível e sustentável.',            time:'10 min', tag:'diario',    importance:'Manutenção contínua' },
  ];
  const genderSpecific = isMale
    ? [
        { id:'m_skin_male',  title:'Manual do rosto limpo',           desc:'Skincare masculino simples: pare de parecer cansado sem inventar moda.',     time:'15 min', tag:'essencial', importance:'Cuidado diário' },
        { id:'m_hair_male',  title:'Cabelo, barba e presença',        desc:'A diferença entre estar largado e estar alinhado — na prática.',             time:'12 min', tag:'diario',    importance:'Grooming completo' }
      ]
    : [
        { id:'m_skin_female', title:'Rotina de pele que dá para seguir', desc:'Skincare feminino com constância: limpeza, hidratação e proteção solar.',    time:'15 min', tag:'essencial', importance:'Cuidado diário' },
        { id:'m_hair_female', title:'Cabelo, maquiagem e presença',      desc:'Detalhes que mudam sua energia visual — sem obrigação, com propósito.',     time:'12 min', tag:'diario',    importance:'Autocuidado completo' }
      ];
  return [...base.slice(0,2), ...genderSpecific, ...base.slice(2)];
}

// ─── Dados do Painel Diário ───────────────────────────────────────────────────
function getDailyTasks(gender) {
  const isMale = gender === 'male';
  const morning = isMale
    ? ['Beber água ao acordar','Lavar o rosto','Usar hidratante','Usar protetor solar','Arrumar o cabelo ou barba','Conferir postura antes de sair','Evitar tocar o rosto']
    : ['Beber água ao acordar','Lavar o rosto','Usar hidratante','Usar protetor solar','Cuidar do cabelo','Conferir postura antes de sair','Evitar tocar o rosto'];
  const night = isMale
    ? ['Lavar o rosto à noite','Remover oleosidade e suor do dia','Aplicar hidratante noturno','Organizar roupa do dia seguinte','Reduzir tela antes de dormir','Dormir no horário planejado']
    : ['Remover maquiagem se usou','Segunda limpeza do rosto','Aplicar hidratante noturno','Organizar roupa do dia seguinte','Reduzir tela antes de dormir','Dormir no horário planejado'];
  return { morning, night };
}

// ─── Jornada de 14 dias ───────────────────────────────────────────────────────
const JOURNEY_DAYS = [
  { day:1,  title:'Rotina facial',          desc:'Monte e siga a rotina facial básica pela primeira vez. Simples, sem exagero.' },
  { day:2,  title:'Sono em dia',            desc:'Organize seu horário de dormir e acordar. Reduza tela antes de deitar.' },
  { day:3,  title:'Cabelo e grooming',      desc:'Ajuste cabelo, barba, sobrancelha ou maquiagem conforme seu perfil.' },
  { day:4,  title:'Hidratação',             desc:'Beba água ao longo do dia e mantenha alimentação simples e real.' },
  { day:5,  title:'Postura',               desc:'Pratique o exercício de postura contra a parede por 5 minutos.' },
  { day:6,  title:'Crioterapia',            desc:'Teste a técnica do frio com segurança. Uma vez. Observe como a pele reage.' },
  { day:7,  title:'Revisão visual',         desc:'Observe sua expressão e postura no espelho. Sem comparação. Só observação.' },
  { day:8,  title:'Repita a rotina',        desc:'Repita a rotina facial sem adicionar produtos novos. Consistência é tudo.' },
  { day:9,  title:'Movimento',             desc:'Caminhe ou treine com segurança. Algo simples já transforma a energia do dia.' },
  { day:10, title:'Nutrição base',          desc:'Prepare uma refeição com proteína, carboidrato e vegetais. Um prato de verdade.' },
  { day:11, title:'Sono sem tela',          desc:'Reduza tela antes de dormir e observe a qualidade do sono nessa noite.' },
  { day:12, title:'Guarda-roupa',           desc:'Reveja o caimento das suas peças. Monte uma combinação nova com o que tem.' },
  { day:13, title:'Grooming completo',      desc:'Reveja cabelo, barba, maquiagem ou sobrancelha. O que faz parte da sua rotina.' },
  { day:14, title:'Revisão final',          desc:'Olhe para onde você chegou em 14 dias. Não é magia — é método. Mantenha.' },
];

// ─── Storage do curso ─────────────────────────────────────────────────────────
const getCourseDone    = () => readJson('lm_course_done', []);
const setCourseDone    = (v) => writeJson('lm_course_done', v);
const getDailyDone     = () => readJson('lm_daily', {});
const setDailyDone     = (v) => writeJson('lm_daily', v);
const getJourneyDone   = () => readJson('lm_journey', []);
const setJourneyDone   = (v) => writeJson('lm_journey', v);
const getModChecks     = () => readJson('lm_mod_checks', {});
const setModChecks     = (v) => writeJson('lm_mod_checks', v);

// ─── Renderização da área do curso ────────────────────────────────────────────
function renderCourseArea(profile, user) {
  const gender = profile.gender || 'male';
  const isMale = gender === 'male';
  const courseArea = $('#courseArea');
  if (!courseArea) return;

  // Se user não foi passado, tenta ler do storage
  if (!user) user = readJson('lm_user', {});

  // Cabeçalho personalizado
  $('#carePlanTitle').textContent = isMale ? 'Plano Masculino — presença, grooming, postura, pele e disciplina diária' : 'Plano Feminino — pele, autocuidado, postura, cabelo e presença';
  $('#carePlanSubtitle').textContent = isMale
    ? 'Seu plano foi montado para te ajudar a construir uma aparência mais limpa, forte e bem cuidada. Aqui o foco não é promessa milagrosa. É método: pele, sono, postura, cabelo, barba, nutrição e presença. Você vai seguir pequenas ações todos os dias até o básico virar automático.'
    : 'Seu plano foi montado para te ajudar a valorizar sua aparência com rotina, cuidado e constância. Aqui o foco não é comparação. É método: pele, sono, cabelo, postura, nutrição, estilo e autocuidado. Você vai seguir pequenas ações todos os dias para se sentir mais cuidada e presente.';

  courseArea.classList.remove('hidden');
  renderTodayCard(gender, user);
  renderCourseModules(gender, user);
  renderDailyPanel(gender);
  renderJourney();
  updateCourseProgress(gender, user);
}

function tagClass(tag) {
  return { essencial:'tag-essencial', diario:'tag-diario', avancado:'tag-avancado', opcional:'tag-opcional' }[tag] || 'tag-essencial';
}
function tagLabel(tag) {
  return { essencial:'Essencial', diario:'Diário', avancado:'Avançado', opcional:'Opcional' }[tag] || tag;
}

let activeModuleId = null;

function renderTodayCard(gender, user) {
  const modules = getCourseModules(gender);
  const unlockedCount = getUnlockedCount(user, modules.length);
  const days = getDaysSinceActivation(user);
  const done = getCourseDone();

  const todayMod = modules.slice(0, unlockedCount).find(m => !done.includes(m.id));

  let el = $('#todayCard');
  if (!el) {
    const container = $('#courseArea');
    const header = container?.querySelector('.care-plan-header');
    el = document.createElement('div');
    el.id = 'todayCard';
    if (header) header.after(el); else container?.prepend(el);
  }

  if (!todayMod) {
    const nextLocked = modules[unlockedCount];
    if (nextLocked) {
      const daysLeft = daysUntilUnlock(unlockedCount, user);
      el.innerHTML = `
        <div class="today-card today-waiting">
          <div class="today-icon">⏳</div>
          <div class="today-body">
            <p class="today-eyebrow">Próximo módulo</p>
            <b class="today-title">${nextLocked.title}</b>
            <p class="today-desc">Disponível em <strong>${daysLeft} dia${daysLeft !== 1 ? 's' : ''}</strong>. Continue praticando o que aprendeu.</p>
          </div>
        </div>`;
    } else {
      el.innerHTML = `
        <div class="today-card today-done-all">
          <div class="today-icon">🏆</div>
          <div class="today-body">
            <p class="today-eyebrow">Curso concluído</p>
            <b class="today-title">Parabéns! Você completou todos os módulos.</b>
            <p class="today-desc">Continue revisando e mantendo sua rotina.</p>
          </div>
        </div>`;
    }
    return;
  }

  el.innerHTML = `
    <div class="today-card">
      <div class="today-icon">🎯</div>
      <div class="today-body">
        <p class="today-eyebrow">Módulo do dia — Dia ${days + 1}</p>
        <b class="today-title">${todayMod.title}</b>
        <p class="today-desc">${todayMod.desc}</p>
      </div>
      <button class="btn primary today-btn" onclick="openModuleModal('${todayMod.id}','${gender}')">Abrir agora</button>
    </div>`;
}

function renderCourseModules(gender, user) {
  const grid = $('#courseModulesGrid');
  if (!grid) return;
  if (!user) user = readJson('lm_user', {});
  const modules = getCourseModules(gender);
  const done = getCourseDone();
  const unlockedCount = getUnlockedCount(user, modules.length);

  grid.innerHTML = modules.map((mod, idx) => {
    const isLocked = idx >= unlockedCount;
    const isDone = !isLocked && done.includes(mod.id);
    const daysLeft = isLocked ? daysUntilUnlock(idx, user) : 0;
    const genderBadge = mod.id.endsWith('_male') ? '♂ Masculino' : mod.id.endsWith('_female') ? '♀ Feminino' : '';

    if (isLocked) {
      return `
      <div class="module-card-course locked">
        <div class="card-top">
          <div class="card-meta">
            <span class="card-tag ${tagClass(mod.tag)}">${tagLabel(mod.tag)}</span>
            ${genderBadge ? `<span class="card-gender-badge">${genderBadge}</span>` : ''}
            <span class="badge-locked">🔒 Em ${daysLeft}d</span>
          </div>
          <h3>${mod.title}</h3>
          <p>${mod.desc}</p>
          <div class="card-info">
            <span>⏱ ${mod.time}</span>
            <span>📅 Disponível em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="card-bottom">
          <button class="btn secondary" disabled>🔒 Bloqueado</button>
        </div>
      </div>`;
    }

    return `
    <div class="module-card-course ${isDone ? 'done' : ''}" data-module-id="${mod.id}">
      <div class="card-top">
        <div class="card-meta">
          <span class="card-tag ${tagClass(mod.tag)}">${tagLabel(mod.tag)}</span>
          ${genderBadge ? `<span class="card-gender-badge">${genderBadge}</span>` : ''}
          ${isDone ? '<span class="badge-done">✓ Concluído</span>' : '<span class="badge-new">● Disponível</span>'}
        </div>
        <h3>${mod.title}</h3>
        <p>${mod.desc}</p>
        <div class="card-info">
          <span>⏱ ${mod.time}</span>
          <span>★ ${mod.importance}</span>
        </div>
      </div>
      <div class="card-bottom">
        <button class="btn ${isDone ? 'secondary' : 'primary'}" onclick="openModuleModal('${mod.id}','${gender}')">${isDone ? 'Revisar módulo' : 'Abrir módulo'}</button>
      </div>
    </div>`;
  }).join('');
}

function openModuleModal(moduleId, gender) {
  activeModuleId = moduleId;
  const content = buildModuleContent(moduleId, gender);
  $('#modalEyebrow').textContent = content.eyebrow;
  $('#modalTitle').textContent = content.title;
  $('#modalIntro').textContent = content.intro;
  $('#modalBody').innerHTML = content.body;
  // Restaurar checkboxes
  restoreModChecks();
  // Listener nos checkboxes do modal
  $$('#modalBody [data-mod-check]').forEach(inp => {
    inp.addEventListener('change', () => {
      const checks = getModChecks();
      const key = `${inp.dataset.modCheck}_${inp.dataset.item}`;
      checks[key] = inp.checked;
      setModChecks(checks);
    });
  });
  const done = getCourseDone();
  $('#modalComplete').textContent = done.includes(moduleId) ? '✓ Módulo já concluído' : 'Marcar como concluído';
  $('#moduleDialog').showModal();
}

function restoreModChecks() {
  const checks = getModChecks();
  $$('#modalBody [data-mod-check]').forEach(inp => {
    const key = `${inp.dataset.modCheck}_${inp.dataset.item}`;
    if (checks[key]) inp.checked = true;
  });
}

$('#moduleClose')?.addEventListener('click', () => $('#moduleDialog')?.close());
$('#modalClose2')?.addEventListener('click', () => $('#moduleDialog')?.close());
$('#modalComplete')?.addEventListener('click', () => {
  if (!activeModuleId) return;
  const done = getCourseDone();
  if (!done.includes(activeModuleId)) done.push(activeModuleId);
  setCourseDone(done);
  $('#moduleDialog')?.close();
  const profile = readJson('lm_profile', {});
  const user = readJson('lm_user', {});
  renderCourseArea(profile, user);
});

function updateCourseProgress(gender, user) {
  if (!user) user = readJson('lm_user', {});
  const modules = getCourseModules(gender);
  const unlockedCount = getUnlockedCount(user, modules.length);
  const done = getCourseDone().filter(id => modules.some(m => m.id === id));
  const unlockedDone = done.filter(id => {
    const idx = modules.findIndex(m => m.id === id);
    return idx < unlockedCount;
  });
  const pct = unlockedCount ? Math.round((unlockedDone.length / unlockedCount) * 100) : 0;
  const days = getDaysSinceActivation(user);
  $('#courseProgressPct').textContent = `${pct}%`;
  $('#courseProgressLabel').textContent = `${unlockedDone.length} de ${unlockedCount} módulos liberados concluídos`;
  $('#courseProgressCount').textContent = `${unlockedCount}/${modules.length} liberados`;
  $('#courseProgressBar').style.width = `${pct}%`;
  $('#progressPercent').textContent = `${pct}%`;
  $('#lessonCount').textContent = `${unlockedDone.length}/${unlockedCount}`;
  // Mostra dia atual na quick-stat
  const dayEl = $('#currentDay');
  if (dayEl) dayEl.textContent = `Dia ${days + 1}`;
}

// ─── Painel Diário ────────────────────────────────────────────────────────────
function renderDailyPanel(gender) {
  const tasks = getDailyTasks(gender);
  const today = new Date().toDateString();
  const saved = getDailyDone();
  // Limpa tarefas de outro dia
  if (saved._date !== today) { writeJson('lm_daily', { _date: today }); }
  const fresh = getDailyDone();

  const renderList = (items, containerId) => {
    const el = $(`#${containerId}`);
    if (!el) return;
    el.innerHTML = items.map(task => {
      const key = `${containerId}_${task}`;
      const isDone = !!fresh[key];
      return `<div class="daily-task ${isDone?'done-task':''}" onclick="toggleDailyTask('${containerId}','${task.replace(/'/g,"\\'")}',this)">
        <input type="checkbox" ${isDone?'checked':''} onclick="event.stopPropagation();toggleDailyTask('${containerId}','${task.replace(/'/g,"\\'")}',this.closest('.daily-task'))">
        <span>${task}</span>
      </div>`;
    }).join('');
  };
  renderList(tasks.morning, 'dailyTasksGrid');
  renderList(tasks.night, 'dailyNightGrid');
}

window.toggleDailyTask = function(containerId, task, el) {
  const key = `${containerId}_${task}`;
  const saved = getDailyDone();
  saved[key] = !saved[key];
  setDailyDone(saved);
  el.classList.toggle('done-task', !!saved[key]);
  el.querySelector('input[type=checkbox]').checked = !!saved[key];
};

// ─── Jornada 14 dias ──────────────────────────────────────────────────────────
function renderJourney() {
  const grid = $('#journeyGrid');
  if (!grid) return;
  const done = getJourneyDone();
  grid.innerHTML = JOURNEY_DAYS.map(d => {
    const isDone = done.includes(d.day);
    return `<div class="journey-day ${isDone?'day-done':''}">
      <div class="day-num">${d.day}</div>
      <div class="day-content">
        <b>Dia ${d.day} — ${d.title}</b>
        <p>${d.desc}</p>
        <div class="day-check">
          <input type="checkbox" id="jday-${d.day}" ${isDone?'checked':''} onchange="toggleJourneyDay(${d.day},this)">
          <label for="jday-${d.day}">${isDone?'Concluído':'Marcar como feito'}</label>
        </div>
      </div>
    </div>`;
  }).join('');
}

window.toggleJourneyDay = function(day, el) {
  const done = getJourneyDone();
  const idx = done.indexOf(day);
  if (idx >= 0) done.splice(idx, 1); else done.push(day);
  setJourneyDone(done);
  const card = el.closest('.journey-day');
  card.classList.toggle('day-done', el.checked);
  el.nextElementSibling.textContent = el.checked ? 'Concluído' : 'Marcar como feito';
};

// ─── Abas do curso ────────────────────────────────────────────────────────────
function initCourseTabs() {
  $$('[data-tab-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('[data-tab-target]').forEach(b => b.classList.toggle('active', b === btn));
      $$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === btn.dataset.tabTarget));
    });
  });
}

// ─── Diagnóstico e dashboard ──────────────────────────────────────────────────
function calculateBMI(weight, heightCm) { const h = heightCm / 100; return weight / (h * h); }
function bmiLabel(bmi) {
  if (bmi < 18.5) return 'baixo peso';
  if (bmi < 25)   return 'faixa comum';
  if (bmi < 30)   return 'sobrepeso';
  return 'atenção à saúde';
}

function chooseRoute(data) {
  const bmi = calculateBMI(data.weight, data.height);
  if (data.goal==='estilo'||data.styleFocus==='pele'||data.styleFocus==='roupa'||data.styleFocus==='postura') return 'styleFirst';
  if (data.biotype==='ecto'||data.goal==='massa'||data.bodyType==='magro'||bmi<18.5) return 'massStart';
  if (data.biotype==='endo'||data.goal==='emagrecer'||data.bodyType==='acima'||bmi>=28) return 'healthCut';
  return 'definition';
}

function saveProfile(data) {
  const routeKey = chooseRoute(data);
  const bmi = calculateBMI(data.weight, data.height);
  writeJson('lm_profile', { ...data, routeKey, bmi:bmi.toFixed(1), bmiLabel:bmiLabel(bmi), generatedAt:new Date().toISOString() });
}

function renderProfilePanel(user, profile={}) {
  if (!$('#profilePanel')) return;
  $('#profileName').textContent = user.name||'--';
  $('#profileEmail').textContent = user.email||'--';
  $('#profilePlan').textContent = user.plan||'--';
  $('#profileStatus').textContent = user.permanent ? 'Vitalício' : 'Ativo';
  $('#profileKey').textContent = user.key||'--';
  $('#profileValidity').textContent = user.permanent ? 'Vitalícia' : (user.expiresAt ? new Date(user.expiresAt).toLocaleDateString('pt-BR') : '--');
  $('#profileActivated').textContent = user.activatedAt ? new Date(user.activatedAt).toLocaleDateString('pt-BR') : '--';
  $('#profileGender').textContent = genderLabel(profile.gender);
  $('#profileBiotype').textContent = biotypeLabel(profile.biotype);
  $('#profileMeasures').textContent = profile.weight&&profile.height ? `${profile.weight}kg / ${profile.height}cm` : 'Diagnóstico pendente';
  $('#profileGoal').textContent = profile.goal ? goalLabel(profile.goal) : 'Diagnóstico pendente';
}

function renderDashboard() {
  const user = guardDashboard();
  if (!user) return;

  $('#studentName').textContent = user.name||'Aluno';
  $('#accountPlan').textContent = formatAccessInfo(user);
  $('#accountStatus').textContent = user.permanent ? 'Vitalício' : 'Ativo';
  $('#accountExpire').textContent = user.permanent ? 'Não expira' : `Expira em: ${new Date(user.expiresAt).toLocaleDateString('pt-BR')}`;

  const profile = readJson('lm_profile', {});
  renderProfilePanel(user, profile);

  if (!profile.routeKey) {
    $('#courseArea')?.classList.add('hidden');
    $('#routeShort').textContent = 'Pendente';
    showWelcomeSequence();
    return;
  }

  document.body.dataset.gender = profile.gender || 'male';
  $('#welcomeFlow')?.classList.add('hidden');
  $('#calculationFlow')?.classList.add('hidden');
  $('#onboarding')?.classList.add('hidden');

  const gLabel = profile.gender === 'female' ? 'Feminino' : 'Masculino';
  $('#routeShort').textContent = gLabel;

  renderCourseArea(profile, user);
  initCourseTabs();
}

// ─── Fluxo de diagnóstico ─────────────────────────────────────────────────────
let welcomeTimer = null, currentQuestionStep = 1, pendingProfile = null;

function showWelcomeSequence() {
  const welcome = $('#welcomeFlow'), onboarding = $('#onboarding'), course = $('#courseArea');
  if (!welcome||!onboarding) return;
  document.body.classList.add('diagnosis-mode');
  course?.classList.add('hidden');
  $('#calculationFlow')?.classList.add('hidden');
  onboarding.classList.add('hidden');
  welcome.classList.remove('hidden'); welcome.classList.add('show');
}
function showQuestions() {
  clearTimeout(welcomeTimer);
  document.body.classList.add('diagnosis-mode');
  $('#welcomeFlow')?.classList.add('hidden');
  $('#calculationFlow')?.classList.add('hidden');
  $('#onboarding')?.classList.remove('hidden'); $('#onboarding')?.classList.add('show');
  setQuestionStep(1);
}
function showCalculationThenResult(data) {
  pendingProfile = data;
  document.body.classList.add('diagnosis-mode');
  $('#onboarding')?.classList.add('hidden');
  $('#welcomeFlow')?.classList.add('hidden');
  $('#courseArea')?.classList.add('hidden');
  $('#calculationFlow')?.classList.remove('hidden'); $('#calculationFlow')?.classList.add('show');
  window.scrollTo({ top:0, behavior:'smooth' });
  clearTimeout(welcomeTimer);
  welcomeTimer = setTimeout(() => {
    saveProfile(pendingProfile); pendingProfile = null;
    $('#calculationFlow')?.classList.add('hidden');
    document.body.classList.remove('diagnosis-mode');
    renderDashboard();
    window.scrollTo({ top:0, behavior:'smooth' });
  }, 1900);
}
function setQuestionStep(step) {
  const total = $$('.question-step').length||1;
  step = Math.max(1, Math.min(step, total));
  currentQuestionStep = step;
  $$('.question-step').forEach(s => s.classList.toggle('active', Number(s.dataset.step)===step));
  if ($('#currentQuestion')) $('#currentQuestion').textContent = step;
  if ($('#totalQuestions')) $('#totalQuestions').textContent = total;
  if ($('#quizBar')) $('#quizBar').style.width = `${Math.round((step/total)*100)}%`;
  const active = $(`.question-step[data-step="${step}"]`);
  if ($('#questionHint')) $('#questionHint').textContent = active?.dataset.hint||'Continue respondendo.';
  $('#onboarding')?.scrollIntoView({ behavior:'smooth', block:'start' });
}
function validateQuestionStep(step) {
  const section = $(`.question-step[data-step="${step}"]`);
  const fields = section ? [...section.querySelectorAll('input[required],select[required],textarea[required]')] : [];
  const invalid = fields.find(f => !f.value);
  if (invalid) {
    if (invalid.type==='hidden') { const grid=$(`.choice-grid[data-target="${invalid.id}"]`); grid?.classList.add('needs-choice'); grid?.scrollIntoView({behavior:'smooth',block:'center'}); return false; }
    invalid.reportValidity(); invalid.focus(); return false;
  }
  return true;
}
function collectQuizData() {
  return {
    gender: $('#gender').value||localStorage.getItem('lm_gender')||'male',
    weight:+$('#weight').value, height:+$('#height').value, age:+$('#age').value,
    waist:+$('#waist').value, biotype:$('#biotype').value, bodyType:$('#bodyType').value,
    experience:$('#experience').value, trainingDays:$('#trainingDays').value,
    sleep:$('#sleep').value, goal:$('#goal').value, time:$('#time').value,
    styleFocus:$('#styleFocus').value, difficulty:($('#difficulty')?.value||'').trim()
  };
}
function firstMissingStep() {
  const required = [['gender',0],['weight',1],['height',2],['age',3],['waist',4],['biotype',5],['bodyType',6],['experience',7],['trainingDays',8],['sleep',9],['goal',10],['time',11],['styleFocus',12]];
  const missing = required.find(([id]) => !String($(`#${id}`)?.value||'').trim());
  return missing ? missing[1] : null;
}
function finishQuiz() {
  const ms = firstMissingStep();
  if (ms !== null) { if (ms===0) { showWelcomeSequence(); return; } setQuestionStep(ms); validateQuestionStep(ms); return; }
  showCalculationThenResult(collectQuizData());
}

$('#finishQuiz')?.addEventListener('click', finishQuiz);
$('#profileForm')?.addEventListener('submit', e => { e.preventDefault(); finishQuiz(); });
$('#skipWelcome')?.addEventListener('click', showQuestions);

$$('[data-gender]').forEach(btn => btn.addEventListener('click', () => {
  const gender = btn.dataset.gender;
  $('#gender').value = gender;
  localStorage.setItem('lm_gender', gender);
  document.body.dataset.gender = gender;
  $$('[data-gender]').forEach(el => el.classList.toggle('selected', el===btn));
  showQuestions();
}));

$$('[data-biotype]').forEach(btn => btn.addEventListener('click', () => {
  $('#biotype').value = btn.dataset.biotype;
  $('#bodyTypeCards')?.classList.remove('needs-choice');
  $$('[data-biotype]').forEach(el => el.classList.toggle('selected', el===btn));
}));

$$('[data-choice-target]').forEach(btn => btn.addEventListener('click', () => {
  const target=btn.dataset.choiceTarget, value=btn.dataset.choiceValue;
  const input=$(`#${target}`); if (!input) return;
  input.value=value;
  btn.closest('.choice-grid')?.classList.remove('needs-choice');
  $$(`[data-choice-target="${target}"]`).forEach(el => el.classList.toggle('selected', el===btn));
  window.setTimeout(() => setQuestionStep(currentQuestionStep+1), 260);
}));

$$('[data-next-step]').forEach(btn => btn.addEventListener('click', () => {
  if (!validateQuestionStep(currentQuestionStep)) return;
  setQuestionStep(Number(btn.dataset.nextStep));
}));
$$('[data-prev-step]').forEach(btn => btn.addEventListener('click', () => setQuestionStep(Number(btn.dataset.prevStep))));

$('#redoProfile')?.addEventListener('click', () => { localStorage.removeItem('lm_profile'); localStorage.removeItem('lm_course_done'); $('#courseArea')?.classList.add('hidden'); showWelcomeSequence(); });
$('#profileRedo')?.addEventListener('click', () => { localStorage.removeItem('lm_profile'); localStorage.removeItem('lm_course_done'); $('#courseArea')?.classList.add('hidden'); showWelcomeSequence(); });
$('#logout')?.addEventListener('click', () => { localStorage.removeItem('lm_user'); location.href='index.html'; });

// ─── Reveal animation ─────────────────────────────────────────────────────────
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); }), { threshold:.12 });
  $$('.reveal').forEach(el => observer.observe(el));
} else {
  $$('.reveal').forEach(el => el.classList.add('show'));
}

// ─── Init ─────────────────────────────────────────────────────────────────────
// renderDashboard é chamada pelo dashboard-shared.js — não precisa de condição aqui
