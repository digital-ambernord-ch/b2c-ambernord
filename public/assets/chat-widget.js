/* =============================================================================
 * AmberNord — AI support chat widget (self-mounting, dependency-free).
 *
 * Mounts itself to <body> at runtime: injects its own <style> (all selectors
 * scoped under `.ancb-`) and its own DOM. It does NOT touch existing markup,
 * SPA routing or stylesheets. Included once site-wide via a single <script>.
 *
 * Talks to the Cloudflare Pages Function at POST /api/chat. History is kept in
 * memory only (no cookies / localStorage) → no consent needed.
 *
 * Design tokens are taken from the site's CSS custom properties where they
 * exist, with hardcoded fallbacks (values extracted in Phase 1).
 * ===========================================================================*/
(function () {
  'use strict';

  // Guard against double-injection (e.g. hot reload / accidental double include).
  if (window.__ancbMounted) return;
  window.__ancbMounted = true;

  /* --- Cloudflare Turnstile (bot protection) ------------------------------- *
   * Paste the PUBLIC Turnstile *site key* below. It is safe to expose. The
   * matching SECRET key lives only on the server (env.TURNSTILE_SECRET).
   * If left blank, the widget still works but sends no token — and the server
   * will reject requests once TURNSTILE_SECRET is configured. So: set this
   * BEFORE deploying with the secret enabled.
   * Recommended Turnstile widget mode: "Managed", execution "execute".        */
  var TURNSTILE_SITEKEY = '0x4AAAAAADlHSrHV1duuF-p8';
  var TS_API = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

  /* --- Localised UI strings (bot replies are localised server-side) -------- */
  var STRINGS = {
    de: {
      aria: 'AmberNord Support-Chat', open: 'Chat öffnen', close: 'Chat schliessen',
      title: 'AmberNord Hilfe',
      greeting: 'Hallo! 👋 Wie kann ich helfen? Fragen Sie mich zu Produkten, Inhaltsstoffen, Versand oder Bestellungen.',
      placeholder: 'Nachricht schreiben…', send: 'Senden',
      error: 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder schreiben Sie an info@ambernord.ch.',
      nudge: 'Chatten Sie mit mir 👋'
    },
    en: {
      aria: 'AmberNord support chat', open: 'Open chat', close: 'Close chat',
      title: 'AmberNord Help',
      greeting: 'Hi! 👋 How can I help? Ask me about products, ingredients, shipping or orders.',
      placeholder: 'Type a message…', send: 'Send',
      error: 'Something went wrong. Please try again or email info@ambernord.ch.',
      nudge: 'Chat with me 👋'
    },
    fr: {
      aria: 'Chat d’assistance AmberNord', open: 'Ouvrir le chat', close: 'Fermer le chat',
      title: 'Aide AmberNord',
      greeting: 'Bonjour ! 👋 Comment puis-je aider ? Posez-moi vos questions sur les produits, ingrédients, la livraison ou les commandes.',
      placeholder: 'Écrire un message…', send: 'Envoyer',
      error: 'Une erreur est survenue. Réessayez ou écrivez à info@ambernord.ch.',
      nudge: 'Discutez avec moi 👋'
    },
    it: {
      aria: 'Chat di assistenza AmberNord', open: 'Apri la chat', close: 'Chiudi la chat',
      title: 'Aiuto AmberNord',
      greeting: 'Ciao! 👋 Come posso aiutarti? Chiedimi di prodotti, ingredienti, spedizione o ordini.',
      placeholder: 'Scrivi un messaggio…', send: 'Invia',
      error: 'Si è verificato un errore. Riprova o scrivi a info@ambernord.ch.',
      nudge: 'Chatta con me 👋'
    }
  };

  function getLang() {
    var l;
    try { l = localStorage.getItem('lang'); } catch (e) { /* ignore */ }
    l = l || document.documentElement.getAttribute('lang') || 'de';
    l = String(l).slice(0, 2).toLowerCase();
    return STRINGS[l] ? l : 'de';
  }
  var S = STRINGS[getLang()];

  /* --- Styles — every selector scoped under .ancb- ------------------------- */
  var CSS = [
    ':root{}', /* no globals: all rules are .ancb- scoped below */

    '.ancb-launcher{',
    '  position:fixed;right:24px;bottom:24px;z-index:4000;',
    '  width:60px;height:60px;border:none;border-radius:50%;cursor:pointer;',
    '  display:grid;place-items:center;padding:0;',
    '  background:var(--color-gold,#EDA323);color:#0a0a0a;',
    '  box-shadow:0 6px 20px rgba(237,163,35,0.45),0 4px 14px rgba(0,0,0,0.4);',
    '  transition:transform .2s var(--ease-out,cubic-bezier(.25,.8,.25,1)),background .2s ease,box-shadow .2s ease;',
    '  font-family:var(--font-sans,"Montserrat",sans-serif);',
    '}',
    '.ancb-launcher:hover{background:var(--color-gold-hover,#f0b543);transform:translateY(-2px) scale(1.05);box-shadow:0 8px 26px rgba(237,163,35,0.6);}',
    '.ancb-launcher:focus-visible{outline:2px solid #fff;outline-offset:2px;}',
    '.ancb-launcher svg{width:26px;height:26px;display:block;transition:opacity .18s ease,transform .18s ease;}',
    '.ancb-launcher .ancb-ico-close{position:absolute;opacity:0;transform:rotate(-90deg) scale(.7);}',
    '.ancb-launcher--open .ancb-ico-chat{opacity:0;transform:rotate(90deg) scale(.7);}',
    '.ancb-launcher--open .ancb-ico-close{opacity:1;transform:rotate(0) scale(1);}',
    /* One-off attention pulse while the nudge is showing */
    '.ancb-launcher--attn{animation:ancb-pulse 2s ease-out 3;}',
    '@keyframes ancb-pulse{0%{box-shadow:0 6px 20px rgba(237,163,35,.45),0 0 0 0 rgba(237,163,35,.5);}70%{box-shadow:0 6px 20px rgba(237,163,35,.45),0 0 0 14px rgba(237,163,35,0);}100%{box-shadow:0 6px 20px rgba(237,163,35,.45),0 0 0 0 rgba(237,163,35,0);}}',

    /* "Chat with me" nudge bubble — appears above the launcher after a delay */
    '.ancb-nudge{position:fixed;right:24px;bottom:98px;z-index:4000;max-width:210px;',
    '  display:flex;align-items:center;gap:8px;padding:10px 10px 10px 13px;',
    '  background:var(--color-surface-2,#121212);color:var(--color-text,#fff);',
    '  border:1px solid var(--color-border-gold,rgba(237,163,35,.3));border-radius:12px;',
    '  box-shadow:0 8px 24px rgba(0,0,0,.45);',
    '  font-family:var(--font-sans,"Montserrat",sans-serif);font-size:13px;line-height:1.3;cursor:pointer;',
    '  opacity:0;visibility:hidden;transform:translateY(8px);',
    '  transition:opacity .3s var(--ease-smooth,cubic-bezier(.165,.84,.44,1)),transform .3s var(--ease-smooth,cubic-bezier(.165,.84,.44,1)),visibility .3s;}',
    '.ancb-nudge.ancb-nudge--show{opacity:1;visibility:visible;transform:translateY(0);}',
    '.ancb-nudge::after{content:"";position:absolute;right:24px;bottom:-6px;width:11px;height:11px;',
    '  background:var(--color-surface-2,#121212);border-right:1px solid var(--color-border-gold,rgba(237,163,35,.3));',
    '  border-bottom:1px solid var(--color-border-gold,rgba(237,163,35,.3));transform:rotate(45deg);}',
    '.ancb-nudge__text{flex:1;}',
    '.ancb-nudge__x{flex:none;border:none;background:none;color:var(--color-text-dim,#888);cursor:pointer;',
    '  font-size:16px;line-height:1;padding:2px 4px;border-radius:5px;transition:color .2s ease;}',
    '.ancb-nudge__x:hover,.ancb-nudge__x:focus-visible{color:var(--color-gold,#EDA323);outline:none;}',

    '.ancb-panel{',
    '  position:fixed;right:24px;bottom:96px;z-index:4000;',
    '  width:380px;max-width:calc(100vw - 32px);',
    '  height:560px;max-height:calc(100dvh - 132px);',
    '  display:flex;flex-direction:column;overflow:hidden;',
    '  background:rgba(16,16,16,.82);color:var(--color-text,#fff);',
    '  -webkit-backdrop-filter:blur(22px) saturate(1.3);backdrop-filter:blur(22px) saturate(1.3);',
    '  border:1px solid var(--color-border-gold,rgba(237,163,35,.18));border-radius:16px;',
    '  box-shadow:0 18px 50px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,.05);',
    '  font-family:var(--font-sans,"Montserrat",sans-serif);',
    '  transform-origin:bottom right;',
    '  opacity:0;visibility:hidden;pointer-events:none;',
    '  transform:translateY(14px) scale(.98);',
    '  transition:opacity .26s var(--ease-smooth,cubic-bezier(.165,.84,.44,1)),',
    '             transform .26s var(--ease-smooth,cubic-bezier(.165,.84,.44,1)),',
    '             visibility .26s;',
    '}',
    '.ancb-panel.ancb-open{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0) scale(1);}',

    '.ancb-header{display:flex;align-items:center;gap:10px;padding:14px 16px;',
    '  background:rgba(20,20,20,.55);border-bottom:1px solid var(--color-border,rgba(255,255,255,.07));}',
    '.ancb-dot{width:8px;height:8px;border-radius:50%;background:var(--color-gold,#EDA323);box-shadow:0 0 8px rgba(237,163,35,.7);flex:none;}',
    '.ancb-title{font-family:var(--font-serif,"Playfair Display",Georgia,serif);font-size:16px;font-weight:600;color:var(--color-text,#fff);flex:1;line-height:1.2;}',
    '.ancb-close{background:none;border:none;color:var(--color-text-dim,#888);cursor:pointer;padding:6px;border-radius:8px;display:grid;place-items:center;transition:color .2s ease,background .2s ease;}',
    '.ancb-close:hover,.ancb-close:focus-visible{color:var(--color-gold,#EDA323);background:rgba(255,255,255,.05);outline:none;}',
    '.ancb-close svg{width:18px;height:18px;display:block;}',

    '.ancb-log{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:16px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch;}',
    '.ancb-log::-webkit-scrollbar{width:8px;}',
    '.ancb-log::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:8px;}',

    '.ancb-msg{max-width:85%;padding:10px 13px;font-size:14px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere;}',
    '.ancb-msg--bot{align-self:flex-start;background:rgba(34,34,34,.65);border:1px solid var(--color-border,rgba(255,255,255,.08));color:var(--color-text-muted,#d0d0d0);border-radius:12px 12px 12px 4px;}',
    '.ancb-msg--user{align-self:flex-end;background:var(--color-gold,#EDA323);color:#0a0a0a;font-weight:500;border-radius:12px 12px 4px 12px;}',
    '.ancb-msg--error{border-color:rgba(220,80,80,.5);color:#f3b4b4;}',
    /* Clickable links inside bot replies (internal site paths + email) */
    '.ancb-link{color:var(--color-gold,#EDA323);text-decoration:underline;text-underline-offset:2px;font-weight:500;cursor:pointer;word-break:break-word;}',
    '.ancb-link:hover,.ancb-link:focus-visible{color:var(--color-gold-hover,#f0b543);outline:none;}',

    '.ancb-typing{display:inline-flex;gap:4px;align-items:center;}',
    '.ancb-typing span{width:6px;height:6px;border-radius:50%;background:var(--color-text-dim,#888);animation:ancb-bounce 1.2s infinite ease-in-out;}',
    '.ancb-typing span:nth-child(2){animation-delay:.18s;}',
    '.ancb-typing span:nth-child(3){animation-delay:.36s;}',
    '@keyframes ancb-bounce{0%,80%,100%{transform:translateY(0);opacity:.4;}40%{transform:translateY(-4px);opacity:1;}}',

    '.ancb-form{display:flex;gap:8px;align-items:flex-end;padding:12px;border-top:1px solid var(--color-border,rgba(255,255,255,.07));background:rgba(16,16,16,.5);}',
    '.ancb-input{flex:1;resize:none;max-height:96px;min-height:42px;padding:11px 12px;font-family:inherit;font-size:14px;line-height:1.4;',
    '  color:var(--color-text,#fff);background:rgba(8,8,8,.55);',
    '  border:1px solid var(--color-border,rgba(255,255,255,.07));border-radius:10px;outline:none;transition:border-color .2s ease;}',
    '.ancb-input::placeholder{color:var(--color-text-dim,#888);}',
    '.ancb-input:focus{border-color:var(--color-gold,#EDA323);}',
    '.ancb-send{flex:none;width:42px;height:42px;border:none;border-radius:10px;cursor:pointer;display:grid;place-items:center;',
    '  background:var(--color-gold,#EDA323);color:#0a0a0a;transition:background .2s ease,opacity .2s ease,transform .15s ease;}',
    '.ancb-send:hover:not(:disabled){background:var(--color-gold-hover,#f0b543);transform:translateY(-1px);}',
    '.ancb-send:focus-visible{outline:2px solid #fff;outline-offset:2px;}',
    '.ancb-send:disabled{opacity:.45;cursor:not-allowed;}',
    '.ancb-send svg{width:18px;height:18px;display:block;}',

    /* Desktop resize grip — anchored top-left (panel is pinned bottom-right) */
    '.ancb-resize{position:absolute;top:0;left:0;width:22px;height:22px;z-index:5;cursor:nwse-resize;touch-action:none;}',
    '.ancb-resize::before{content:"";position:absolute;top:7px;left:7px;width:7px;height:7px;',
    '  border-top:2px solid var(--color-text-dim,#888);border-left:2px solid var(--color-text-dim,#888);',
    '  border-radius:1px;opacity:.45;transition:opacity .2s ease,border-color .2s ease;}',
    '.ancb-resize:hover::before{opacity:1;border-color:var(--color-gold,#EDA323);}',
    /* While dragging the grip, suppress the open/close transition so it tracks the pointer */
    '.ancb-panel.ancb-resizing{transition:none;}',

    /* Mobile: full-width bottom sheet */
    '@media (max-width:600px){',
    '  .ancb-panel{right:0;left:0;bottom:0;width:100%;max-width:100%;height:82dvh;max-height:82dvh;border-radius:16px 16px 0 0;transform-origin:bottom center;transform:translateY(100%);}',
    '  .ancb-panel.ancb-open{transform:translateY(0);}',
    '  .ancb-launcher{right:16px;bottom:16px;}',
    '  .ancb-nudge{right:16px;bottom:88px;}',
    '  .ancb-nudge::after{right:26px;}',
    '  .ancb-resize{display:none;}', /* no drag-to-resize on the full-screen mobile sheet */
    '}',

    /* Respect reduced-motion */
    '@media (prefers-reduced-motion:reduce){',
    '  .ancb-panel,.ancb-launcher,.ancb-launcher svg,.ancb-send,.ancb-close,.ancb-nudge{transition:none;}',
    '  .ancb-typing span,.ancb-launcher--attn{animation:none;}',
    '}'
  ].join('');

  /* --- Inline SVG icons (static, trusted) --------------------------------- */
  var ICON_CHAT = '<svg class="ancb-ico-chat" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.9-5.2A8.38 8.38 0 0 1 4 12a8.5 8.5 0 0 1 8.5-8.5A8.38 8.38 0 0 1 21 11.5z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_CLOSE = '<svg class="ancb-ico-close" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* --- Build DOM ----------------------------------------------------------- */
  var style = document.createElement('style');
  style.id = 'ancb-style';
  style.textContent = CSS;
  document.head.appendChild(style);

  var launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'ancb-launcher';
  launcher.setAttribute('aria-label', S.open);
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', 'ancb-panel');
  launcher.innerHTML = ICON_CHAT + ICON_CLOSE;

  var panel = document.createElement('div');
  panel.className = 'ancb-panel';
  panel.id = 'ancb-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', S.aria);
  panel.setAttribute('aria-hidden', 'true');

  var logId = 'ancb-log';
  panel.innerHTML =
    '<div class="ancb-header">' +
      '<span class="ancb-dot" aria-hidden="true"></span>' +
      '<span class="ancb-title">' + escapeHtml(S.title) + '</span>' +
      '<button type="button" class="ancb-close" aria-label="' + escapeHtml(S.close) + '">' + ICON_X + '</button>' +
    '</div>' +
    '<div class="ancb-log" id="' + logId + '" role="log" aria-live="polite" aria-relevant="additions"></div>' +
    '<form class="ancb-form">' +
      '<textarea class="ancb-input" rows="1" aria-label="' + escapeHtml(S.placeholder) + '" placeholder="' + escapeHtml(S.placeholder) + '"></textarea>' +
      '<button type="submit" class="ancb-send" aria-label="' + escapeHtml(S.send) + '">' + ICON_SEND + '</button>' +
    '</form>' +
    '<div class="ancb-resize" aria-hidden="true"></div>';

  // "Chat with me" nudge bubble (decorative prompt; the launcher is the real
  // control, so the nudge is aria-hidden and not in the tab order).
  var nudge = document.createElement('div');
  nudge.className = 'ancb-nudge';
  nudge.setAttribute('aria-hidden', 'true');
  nudge.innerHTML =
    '<span class="ancb-nudge__text">' + escapeHtml(S.nudge) + '</span>' +
    '<button type="button" class="ancb-nudge__x" tabindex="-1" aria-hidden="true">×</button>';

  document.body.appendChild(launcher);
  document.body.appendChild(panel);
  document.body.appendChild(nudge);

  /* --- Turnstile token plumbing ------------------------------------------- *
   * Loads the Turnstile API lazily (on first chat open), renders one hidden
   * widget in "execute" mode, and fetches a FRESH single-use token before each
   * message. Gracefully no-ops if no site key is configured.                  */
  var tsEnabled = TURNSTILE_SITEKEY && TURNSTILE_SITEKEY.indexOf('__') !== 0;
  var tsContainer = null, tsWidgetId = null, tsLoading = null, tsResolve = null;

  if (tsEnabled) {
    tsContainer = document.createElement('div');
    tsContainer.style.cssText = 'position:fixed;width:0;height:0;overflow:hidden;left:-9999px;bottom:0;';
    document.body.appendChild(tsContainer);
  }

  function loadTurnstileApi() {
    if (window.turnstile) return Promise.resolve();
    if (tsLoading) return tsLoading;
    tsLoading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = TS_API; s.async = true; s.defer = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('turnstile load failed')); };
      document.head.appendChild(s);
    });
    return tsLoading;
  }

  function ensureTsWidget() {
    return loadTurnstileApi().then(function () {
      if (tsWidgetId !== null) return;
      tsWidgetId = window.turnstile.render(tsContainer, {
        sitekey: TURNSTILE_SITEKEY,
        size: 'invisible',
        execution: 'execute',
        callback: function (token) { if (tsResolve) { var r = tsResolve; tsResolve = null; r(token); } },
        'error-callback': function () { if (tsResolve) { var r = tsResolve; tsResolve = null; r(''); } },
        'timeout-callback': function () { if (tsResolve) { var r = tsResolve; tsResolve = null; r(''); } }
      });
    });
  }

  // Resolves to a fresh token, or '' if Turnstile is off/unavailable. Never
  // rejects — a missing token is handled by the server (friendly message).
  function getTurnstileToken() {
    if (!tsEnabled) return Promise.resolve('');
    return ensureTsWidget().then(function () {
      return new Promise(function (resolve) {
        var settled = false;
        tsResolve = function (t) { if (!settled) { settled = true; resolve(t || ''); } };
        // Safety timeout so a stuck challenge never hangs the UI.
        setTimeout(function () { if (!settled) { settled = true; tsResolve = null; resolve(''); } }, 8000);
        try { window.turnstile.reset(tsWidgetId); window.turnstile.execute(tsWidgetId); }
        catch (e) { if (!settled) { settled = true; tsResolve = null; resolve(''); } }
      });
    }).catch(function () { return ''; });
  }

  var log = panel.querySelector('.ancb-log');
  var form = panel.querySelector('.ancb-form');
  var input = panel.querySelector('.ancb-input');
  var sendBtn = panel.querySelector('.ancb-send');
  var closeBtn = panel.querySelector('.ancb-close');
  var resizeHandle = panel.querySelector('.ancb-resize');
  var nudgeX = nudge.querySelector('.ancb-nudge__x');
  var nudgeDone = false; // once dismissed or chat opened, never show again

  /* --- State + helpers ----------------------------------------------------- */
  var history = [{ role: 'assistant', content: S.greeting }];
  var pending = false;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function scrollBottom() { log.scrollTop = log.scrollHeight; }

  /* Linkifies a bot reply WITHOUT ever using innerHTML on model output: every
     piece is either a text node or an <a> element we build ourselves, so markup
     still can't be injected. Recognises internal site paths (e.g. /b2b/ or
     /ritual/#ritual-recipes-section) and email addresses. Internal paths are
     RELATIVE on purpose — they resolve against whatever host serves the page
     (*.pages.dev now, ambernord.ch later) and never need editing. */
  var LINK_RE = /(\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)+(?:#[a-z][a-z0-9-]*)?)|([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi;

  function appendRich(el, text) {
    var last = 0, m;
    LINK_RE.lastIndex = 0;
    while ((m = LINK_RE.exec(text)) !== null) {
      if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
      var a = document.createElement('a');
      a.className = 'ancb-link';
      if (m[1]) {                       // internal site path → SPA link
        a.setAttribute('href', m[1]);
        a.setAttribute('data-link', '');
      } else {                          // email → mailto
        a.setAttribute('href', 'mailto:' + m[2]);
      }
      a.textContent = m[0];
      el.appendChild(a);
      last = m.index + m[0].length;
    }
    if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
  }

  // User bubbles use textContent only (no markup ever). Bot bubbles run through
  // appendRich so site paths/emails become real links — still no innerHTML.
  function addBubble(role, text, isError) {
    var el = document.createElement('div');
    el.className = 'ancb-msg ' + (role === 'user' ? 'ancb-msg--user' : 'ancb-msg--bot') + (isError ? ' ancb-msg--error' : '');
    if (role === 'user') {
      el.textContent = text;
    } else {
      appendRich(el, text);
      var internal = el.querySelectorAll('a[data-link]');
      if (internal.length) {
        // Hand the new links to the SPA router (smooth nav + #section scroll;
        // falls back to a normal full-page link if the router isn't present).
        if (typeof window.attachLinkListeners === 'function') window.attachLinkListeners();
        // Close the panel on navigation so the destination page is visible.
        internal.forEach(function (a) { a.addEventListener('click', closePanel); });
      }
    }
    log.appendChild(el);
    scrollBottom();
    return el;
  }

  function addTyping() {
    var el = document.createElement('div');
    el.className = 'ancb-msg ancb-msg--bot ancb-typing';
    el.setAttribute('aria-label', '…');
    el.innerHTML = '<span></span><span></span><span></span>';
    log.appendChild(el);
    scrollBottom();
    return el;
  }

  function setBusy(b) {
    pending = b;
    sendBtn.disabled = b;
    input.disabled = b;
  }

  function autosize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 96) + 'px';
  }

  /* --- Nudge bubble -------------------------------------------------------- */
  function hideNudge() {
    nudge.classList.remove('ancb-nudge--show');
    launcher.classList.remove('ancb-launcher--attn');
  }
  function retireNudge() { nudgeDone = true; hideNudge(); }
  function showNudge() {
    if (nudgeDone || panel.classList.contains('ancb-open')) return;
    nudge.classList.add('ancb-nudge--show');
    launcher.classList.add('ancb-launcher--attn');
  }

  function isMobile() { return window.matchMedia('(max-width:600px)').matches; }

  /* --- Mobile keyboard / viewport tracking -------------------------------- *
   * On phones the on-screen keyboard shrinks the *visual* viewport but not the
   * layout viewport, so a `bottom:0; height:82dvh` sheet ends up half-hidden
   * behind the keyboard. We pin the open panel to window.visualViewport instead:
   * height = visible height, bottom = the keyboard/browser-UI inset. This makes
   * the sheet fill the free screen top-to-bottom and follow the keyboard.      */
  function syncMobileViewport() {
    if (!isMobile() || !panel.classList.contains('ancb-open')) return;
    var vv = window.visualViewport;
    if (!vv) return;
    var inset = window.innerHeight - vv.height - vv.offsetTop;
    if (inset < 0) inset = 0;
    panel.style.height = vv.height + 'px';
    panel.style.maxHeight = vv.height + 'px';
    panel.style.bottom = inset + 'px';
    scrollBottom();
  }

  /* --- Open / close (CSS-transition driven; matches site easing tokens) ---- */
  function openPanel() {
    retireNudge();
    if (tsEnabled) { ensureTsWidget().catch(function () {}); } // warm up bot check
    panel.classList.add('ancb-open');
    panel.setAttribute('aria-hidden', 'false');
    launcher.classList.add('ancb-launcher--open');
    launcher.setAttribute('aria-expanded', 'true');
    launcher.setAttribute('aria-label', S.close);
    syncMobileViewport();
    setTimeout(function () { input.focus(); }, 60);
    scrollBottom();
  }
  function closePanel() {
    panel.classList.remove('ancb-open');
    panel.setAttribute('aria-hidden', 'true');
    launcher.classList.remove('ancb-launcher--open');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', S.open);
    // Drop the viewport-tracking inline styles so the next open recomputes them.
    // Desktop keeps any user-chosen drag size (it never sets `bottom`).
    if (isMobile()) {
      panel.style.height = '';
      panel.style.maxHeight = '';
      panel.style.bottom = '';
    }
    launcher.focus();
  }
  function toggle() { panel.classList.contains('ancb-open') ? closePanel() : openPanel(); }

  /* --- Send ---------------------------------------------------------------- */
  function send() {
    var text = input.value.trim();
    if (!text || pending) return;

    addBubble('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    autosize();
    setBusy(true);
    var typing = addTyping();

    getTurnstileToken().then(function (token) {
      return fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history, lang: getLang(), turnstileToken: token })
      });
    })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
      .then(function (r) {
        typing.remove();
        var reply = (r.data && r.data.reply) ? r.data.reply : S.error;
        var isErr = !r.ok || (r.data && r.data.error);
        addBubble('bot', reply, !!isErr);
        if (r.ok && r.data && r.data.reply) history.push({ role: 'assistant', content: r.data.reply });
      })
      .catch(function () {
        typing.remove();
        addBubble('bot', S.error, true);
      })
      .then(function () {
        setBusy(false);
        input.focus();
      });
  }

  /* --- Events -------------------------------------------------------------- */
  launcher.addEventListener('click', toggle);
  closeBtn.addEventListener('click', closePanel);
  // Click the nudge → open chat; click its × → just dismiss it.
  nudge.addEventListener('click', function (e) {
    if (e.target === nudgeX) { e.stopPropagation(); retireNudge(); return; }
    openPanel();
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); send(); });
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('ancb-open')) closePanel();
  });

  // Keep the open mobile sheet glued to the visible viewport (keyboard show/hide,
  // browser-UI collapse, orientation change).
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncMobileViewport);
    window.visualViewport.addEventListener('scroll', syncMobileViewport);
  }
  input.addEventListener('focus', function () { setTimeout(syncMobileViewport, 100); });

  // Stop touch scrolling from leaking to the page behind the open mobile sheet.
  // The message log scrolls natively (overscroll-behavior:contain keeps it from
  // chaining at its edges); every other touch in the panel is swallowed.
  panel.addEventListener('touchmove', function (e) {
    if (!isMobile()) return;
    if (e.target === input) return; // let the textarea handle its own gestures
    // Allow native scroll only when the log actually has overflow to scroll.
    if (log.contains(e.target) && log.scrollHeight > log.clientHeight) return;
    e.preventDefault();
  }, { passive: false });

  /* --- Desktop: drag the top-left grip to resize --------------------------- */
  (function initResize() {
    var MIN_W = 320, MIN_H = 380;
    var resizing = false, startX = 0, startY = 0, startW = 0, startH = 0;

    resizeHandle.addEventListener('pointerdown', function (e) {
      if (isMobile()) return; // mobile sheet is full-screen; no manual resize
      var rect = panel.getBoundingClientRect();
      resizing = true;
      startX = e.clientX; startY = e.clientY;
      startW = rect.width; startH = rect.height;
      panel.classList.add('ancb-resizing');
      document.documentElement.style.userSelect = 'none';
      try { resizeHandle.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
    });

    resizeHandle.addEventListener('pointermove', function (e) {
      if (!resizing) return;
      // Panel is anchored bottom-right, so dragging up/left (negative delta) grows it.
      var w = startW + (startX - e.clientX);
      var h = startH + (startY - e.clientY);
      var maxW = window.innerWidth - 48;
      var maxH = window.innerHeight - 132;
      panel.style.width = Math.max(MIN_W, Math.min(w, maxW)) + 'px';
      panel.style.height = Math.max(MIN_H, Math.min(h, maxH)) + 'px';
      panel.style.maxWidth = 'none';
      panel.style.maxHeight = 'none';
    });

    function endResize(e) {
      if (!resizing) return;
      resizing = false;
      panel.classList.remove('ancb-resizing');
      document.documentElement.style.userSelect = '';
      try { resizeHandle.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
    resizeHandle.addEventListener('pointerup', endResize);
    resizeHandle.addEventListener('pointercancel', endResize);

    // Re-clamp a user-resized panel if the window shrinks below its custom size.
    window.addEventListener('resize', function () {
      if (isMobile() || !panel.style.width) return;
      var maxW = window.innerWidth - 48, maxH = window.innerHeight - 132;
      if (parseFloat(panel.style.width) > maxW) panel.style.width = maxW + 'px';
      if (parseFloat(panel.style.height) > maxH) panel.style.height = maxH + 'px';
    });
  })();

  /* --- Initial render ------------------------------------------------------ */
  addBubble('bot', S.greeting);

  // Gentle "chat with me" prompt after a short delay (once per page load).
  setTimeout(showNudge, 9000);
})();
