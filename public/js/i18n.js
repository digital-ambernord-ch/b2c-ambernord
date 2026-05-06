/* AmberNord i18n — fetch /data/<lang>/<page>.json, populate data-i18n* nodes, update head meta. */

window.loadI18n = async function (lang, page) {
  let data;
  try {
    const res = await fetch(`/data/${lang}/${page}.json`);
    if (!res.ok) throw new Error();
    data = await res.json();
  } catch {
    data = await (await fetch(`/data/de/${page}.json`)).json();
  }

  document.documentElement.setAttribute('lang', lang);

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = getPath(data, el.getAttribute('data-i18n'));
    if (v !== undefined) el.textContent = v;
  });

  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const v = getPath(data, el.getAttribute('data-i18n-html'));
    if (v !== undefined) el.innerHTML = v;
  });

  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const [attr, path] = el.getAttribute('data-i18n-attr').split(':');
    const v = getPath(data, path);
    if (v !== undefined) el.setAttribute(attr, v);
  });

  if (data.meta) {
    if (data.meta.title)       document.title = data.meta.title;
    if (data.meta.description) setMeta('description', data.meta.description);
    setMeta('robots', data.meta.robots || 'index, follow');

    if (data.meta.canonical) {
      const canonical = document.getElementById('canonical-tag');
      if (canonical) canonical.setAttribute('href', data.meta.canonical);
    }

    if (data.meta.og) {
      setOg('og:title',       data.meta.og.title);
      setOg('og:description', data.meta.og.description);
      setOg('og:image',       data.meta.og.image);
      setOg('og:type',        data.meta.og.type || 'website');
    }

    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    if (data.meta.hreflang) {
      Object.entries(data.meta.hreflang).forEach(([hl, href]) => setHreflang(hl, href));
    }
  }

  return data;
};

window.getLang = () => localStorage.getItem('lang') || 'de';
window.setLang = (lang) => { localStorage.setItem('lang', lang); location.reload(); };

function getPath(obj, path) {
  return path.split('.').reduce((a, k) => a?.[k], obj);
}

function setMeta(name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
  el.content = content;
}

function setOg(property, content) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
  el.content = content;
}

function setHreflang(lang, href) {
  const el = document.createElement('link');
  el.rel = 'alternate';
  el.hreflang = lang;
  el.href = href;
  document.head.appendChild(el);
}

/* Apply common (nav + footer + shared CTA) translations once on initial load.
   Page-specific loadI18n calls inside route inits then translate the #app
   content fragment. Both run against the same DOM, so they don't conflict. */
window.loadCommonI18n = async function () {
  const lang = window.getLang();
  let data;
  try {
    const res = await fetch(`/data/${lang}/common.json`);
    if (!res.ok) throw new Error();
    data = await res.json();
  } catch {
    try { data = await (await fetch(`/data/de/common.json`)).json(); } catch { return; }
  }

  document.documentElement.setAttribute('lang', lang);

  const apply = (selector, setter) => {
    document.querySelectorAll(selector).forEach((el) => {
      const key = el.getAttribute(selector === '[data-i18n]' ? 'data-i18n'
                : selector === '[data-i18n-html]' ? 'data-i18n-html'
                : 'data-i18n-attr');
      setter(el, key);
    });
  };

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const v = getPath(data, el.getAttribute('data-i18n'));
    if (v !== undefined) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const v = getPath(data, el.getAttribute('data-i18n-html'));
    if (v !== undefined) el.innerHTML = v;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const [attr, path] = el.getAttribute('data-i18n-attr').split(':');
    const v = getPath(data, path);
    if (v !== undefined) el.setAttribute(attr, v);
  });
};

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const lang = window.getLang();
    if (lang) document.documentElement.setAttribute('lang', lang);
    if (typeof window.loadCommonI18n === 'function') window.loadCommonI18n();
  });
}
