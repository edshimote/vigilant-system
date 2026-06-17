/**
 * auth-guard.js — Lumié
 * Guard universal de sessão. Incluir no <head> de TODAS as páginas protegidas.
 * Bloqueia acesso sem login, mantém sessão estável entre páginas.
 */
(function () {
  'use strict';

  var ADM_EMAIL = 'suporte@lumie.com';
  var ADM_PANEL = 'painel-lumie-interno.html';

  // Oculta imediatamente para evitar flash de conteúdo protegido
  document.documentElement.style.visibility = 'hidden';

  function bail(reason) {
    try { sessionStorage.setItem('lm_redirect_reason', reason || 'unauth'); } catch(e){}
    window.history.replaceState(null, '', 'index.html');
    window.location.replace('index.html');
  }

  function isAdmPage() {
    return window.location.pathname.includes('painel-lumie-interno');
  }

  function validate() {
    var raw;
    try { raw = localStorage.getItem('lm_user'); } catch(e) { bail('storage'); return; }
    if (!raw) { bail('no_session'); return; }

    var u;
    try { u = JSON.parse(raw); } catch(e) { bail('bad_json'); return; }

    // Campos obrigatórios
    if (!u || typeof u !== 'object')    { bail('invalid_obj'); return; }
    if (!u.active)                       { bail('inactive'); return; }
    if (typeof u.email !== 'string' || !u.email.includes('@')) { bail('bad_email'); return; }
    if (typeof u.sessionToken !== 'string' || u.sessionToken.length < 16) { bail('bad_token'); return; }

    // Chave de acesso deve existir
    if (!u.key || typeof u.key !== 'string') { bail('no_key'); return; }

    // Sessão expirada (apenas planos semanais)
    if (!u.permanent && u.expiresAt) {
      if (new Date(u.expiresAt) < new Date()) { bail('expired'); return; }
    }

    // Página do painel ADM: exige isAdm + email correto
    if (isAdmPage()) {
      if (!u.isAdm || u.email.toLowerCase().trim() !== ADM_EMAIL) {
        bail('not_adm'); return;
      }
    } else {
      // Usuário ADM tentando acessar área de aluno: redireciona para o painel
      if (u.isAdm && u.email.toLowerCase().trim() === ADM_EMAIL) {
        window.location.replace(ADM_PANEL);
        return;
      }
    }

    // Verifica consistência com lm_accounts (evita sessionToken adulterado)
    try {
      var accsRaw = localStorage.getItem('lm_accounts');
      if (accsRaw) {
        var accs = JSON.parse(accsRaw);
        if (Array.isArray(accs)) {
          var match = accs.find(function(a) {
            return a && a.email && a.email.toLowerCase() === u.email.toLowerCase();
          });
          if (match && match.sessionToken && match.sessionToken !== u.sessionToken) {
            // Token diferente do registrado → sessão inválida (logout em outro dispositivo)
            localStorage.removeItem('lm_user');
            bail('token_mismatch'); return;
          }
        }
      }
    } catch(e) { /* se lm_accounts corrompido, permite com base na validação local */ }

    // Tudo OK — mostra a página
    document.documentElement.style.visibility = '';

    // Atualiza timestamp de última atividade para keepalive de sessão
    try {
      u.lastSeen = new Date().toISOString();
      localStorage.setItem('lm_user', JSON.stringify(u));
    } catch(e) {}
  }

  // Executa imediatamente (síncrono)
  validate();

  // Revalida quando o usuário volta para a aba (visibilitychange)
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      try {
        var raw = localStorage.getItem('lm_user');
        if (!raw) { bail('session_lost'); return; }
        var u = JSON.parse(raw);
        if (!u || !u.active) { bail('session_lost'); return; }
        if (!u.permanent && u.expiresAt && new Date(u.expiresAt) < new Date()) {
          bail('expired'); return;
        }
      } catch(e) { bail('recheck_error'); }
    }
  });

  // Expõe função de leitura do usuário logado para uso nas páginas
  window.LumieAuth = {
    getUser: function () {
      try { return JSON.parse(localStorage.getItem('lm_user') || 'null'); } catch(e) { return null; }
    },
    logout: function () {
      localStorage.removeItem('lm_user');
      window.location.replace('index.html');
    },
    getProgress: function () {
      try {
        var raw = localStorage.getItem('lumieDashboardStateV3') || localStorage.getItem('lumieDashboardStateV2');
        if (!raw) return { completedModules: [], totalModules: 8, percent: 0 };
        var s = JSON.parse(raw);
        var completed = Array.isArray(s.completedModules) ? s.completedModules.length : 0;
        var total = 8;
        return { completedModules: s.completedModules || [], totalModules: total, percent: Math.round((completed / total) * 100) };
      } catch(e) { return { completedModules: [], totalModules: 8, percent: 0 }; }
    },
    getDiagnosis: function () {
      try {
        var raw = localStorage.getItem('lumieDashboardStateV3') || localStorage.getItem('lumieDashboardStateV2');
        if (!raw) return null;
        return JSON.parse(raw).diagnosis || null;
      } catch(e) { return null; }
    },
    updateProfile: function (updates) {
      try {
        var u = this.getUser();
        if (!u) return false;
        var allowed = ['name', 'avatarColor', 'avatarEmoji', 'displayBio'];
        var changed = false;
        allowed.forEach(function(k) {
          if (updates[k] !== undefined) { u[k] = updates[k]; changed = true; }
        });
        if (!changed) return false;
        localStorage.setItem('lm_user', JSON.stringify(u));
        // Sincroniza nome no lm_accounts
        try {
          var accs = JSON.parse(localStorage.getItem('lm_accounts') || '[]');
          var idx = accs.findIndex(function(a) { return a.email && a.email.toLowerCase() === u.email.toLowerCase(); });
          if (idx >= 0) {
            allowed.forEach(function(k) { if (updates[k] !== undefined) accs[idx][k] = updates[k]; });
            localStorage.setItem('lm_accounts', JSON.stringify(accs));
          }
        } catch(e) {}
        return true;
      } catch(e) { return false; }
    }
  };
})();
