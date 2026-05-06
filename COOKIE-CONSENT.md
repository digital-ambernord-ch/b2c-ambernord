# Cookie consent — operator guide

This site implements a GDPR/ePrivacy-compliant cookie consent system. Read this
file before adding any third-party tag, changing the cookie policy, or moving
analytics vendors.

## Files

- [public/js/cookie-consent.js](public/js/cookie-consent.js) — module
- [public/css/cookie-consent.css](public/css/cookie-consent.css) — banner + modal styling
- [public/index.html](public/index.html) — banner + modal HTML, gated `<script>` placeholders
- `public/data/<lang>/common.json` — `cookie.*` translations + per-cookie disclosure list

## Architecture in one paragraph

`cookie-consent.js` reads/writes a single first-party cookie `cookie_consent`
(JSON: categories, version, timestamp). On every page load it scans for
`<script type="text/plain" data-cookie-category="…">` placeholders and clones
them into live `<script type="text/javascript">` only for granted categories.
Categories: `necessary` (always on), `analytics`, `marketing`. The banner
appears whenever no valid consent is stored; the modal is reachable from the
footer at any time. Withdrawal clears the cookie record AND deletes the
documented vendor cookies for the just-revoked category.

## How to add a new vendor

### Pattern A — `<script type="text/plain">` placeholder (preferred for tag pixels)

Use this when the vendor gives you raw `<script>` tags to paste. Wrap them
exactly like this in `index.html`, near the existing GA/TikTok placeholders:

```html
<script type="text/plain" data-cookie-category="analytics" src="https://example.com/loader.js" async></script>
<script type="text/plain" data-cookie-category="analytics">
  /* inline init */
</script>
```

Pick the category that matches the vendor's purpose:
- `analytics` — usage measurement (GA, Plausible, Matomo when not anonymized)
- `marketing` — ad pixels, retargeting (TikTok, Meta, LinkedIn, Google Ads)

The consent module will activate the placeholder once the user grants the
matching category. Nothing fires before that — including the network request
to load the vendor's JS.

### Pattern B — programmatic SDK with consent API

Use this when the vendor exposes a `consent` API (Google Consent Mode v2,
Meta `fbq('consent', …)`). Default everything to `denied` on page load and
call the update inside an `onChange` listener:

```js
gtag('consent', 'default', {
  ad_storage:        'denied',
  analytics_storage: 'denied',
  ad_user_data:      'denied',
  ad_personalization:'denied'
});

window.cookieConsent.onChange((state) => {
  gtag('consent', 'update', {
    analytics_storage:  state.analytics ? 'granted' : 'denied',
    ad_storage:         state.marketing ? 'granted' : 'denied',
    ad_user_data:       state.marketing ? 'granted' : 'denied',
    ad_personalization: state.marketing ? 'granted' : 'denied'
  });
});
```

This pattern still requires the underlying script to be gated by Pattern A
(because loading the script itself is a network ping). Use Pattern B *in
addition to* Pattern A, not instead of it.

## After adding a vendor

1. Register every cookie/storage key the vendor sets in `VENDOR_COOKIES` inside
   [cookie-consent.js](public/js/cookie-consent.js). Withdrawal sweeps these
   names and expires them; missing names → leaked cookies after revoke.

2. Update `cookie.categories.<cat>.list` in **all four** common.json files
   (`public/data/{de,en,fr,it}/common.json`). Each cookie must show **name,
   purpose, retention**. Translate purpose+retention. Use `<li><strong>cookie_name</strong>
   — purpose. Provider. Retention.</li>`.

3. Bump `CONSENT_VERSION` in [cookie-consent.js](public/js/cookie-consent.js)
   so existing visitors are re-prompted with the new disclosure.

4. Update `public/_headers` CSP if the vendor lives on a new origin
   (`script-src`, `connect-src`, `img-src` for tracking pixels).

5. Manually verify in DevTools Network panel that no request to the vendor
   fires before clicking Accept.

## How to bump the version

```js
// In public/js/cookie-consent.js, top of the IIFE:
const CONSENT_VERSION = '2026-q2';   // was '2025-q1'
```

Change this whenever the cookie disclosure changes (added/removed vendor,
changed purpose, changed retention). All existing `cookie_consent` cookies
become invalid (the `v` field no longer matches), so the banner re-prompts on
next visit. The user must reaffirm their choice with the new disclosure on
file.

Use a calendar-quarter or YYYY-MM string. Don't reuse old values.

## How to test

Run through this checklist before shipping any change to the consent system:

1. **Empty cookies → banner appears.**
   Open DevTools → Application → Cookies → delete `cookie_consent`. Reload.
   Banner shown.

2. **Zero third-party requests before consent.**
   DevTools → Network → filter "googletagmanager" + "analytics.tiktok". Reload
   the page. There must be **zero** matching requests until you click Accept.

3. **Reject all → reload → still zero requests.**
   Click Reject. Reload. No requests to vendors.

4. **Accept all → reload → vendor scripts load.**
   Click Accept. Reload. `gtag/js` and `events.js` (TikTok) appear in Network.

5. **Toggle off in modal → vendor cookies cleared.**
   Open modal via footer. Toggle Analytics off. Save. Check Application →
   Cookies. `_ga`, `_ga_*` cookies are gone.

6. **Footer link reopens modal at any time.**
   Click "Cookie-Einstellungen" in the footer. Modal opens. Toggles reflect
   current state.

7. **Version bump re-prompts.**
   Change `CONSENT_VERSION` to a new value. Reload. Banner re-appears even
   though `cookie_consent` cookie still exists.

8. **Keyboard navigation.**
   Tab through the modal. Focus stays inside. Esc closes. Tab+Shift cycles
   backwards. Focus returns to the trigger element on close.

9. **Screen reader.**
   Use VoiceOver / NVDA. Banner announced as dialog. Buttons have meaningful
   labels.

10. **Cookie attributes.**
    DevTools → Application → Cookies → `cookie_consent`. Verify
    `SameSite=Lax`, `Secure` (on HTTPS), `Path=/`, `Expires` ~1 year out.

11. **Equal visual weight.**
    Manual check: Accept and Reject buttons same size, same contrast, same
    color. Settings is intentionally a tertiary "ghost" button — that is
    permitted by CNIL guidance as long as Reject is at the top level.

## Strictly necessary exemptions

Cookies set by the site itself for its own operation do **not** require
consent. Currently:

- `cookie_consent` — the consent record itself (mandatory: how would we
  remember "rejected" without a cookie?)
- `localStorage.lang` — selected UI language. Survives across navigations;
  no third party. Documented under "necessary" but stored in localStorage,
  not as a cookie.

Do not add anything else under "necessary" without checking the EDPB's
opinions on what qualifies. Session-state and CSRF tokens are fine. Tracking
disguised as "session" is not.

## CSP

`public/_headers` already allows the third-party origins used today:

- `script-src`: `cdnjs.cloudflare.com` (GSAP), `js.stripe.com`, GA, TikTok
- `connect-src`: `api.stripe.com`, `api.web3forms.com`, GA, TikTok
- `img-src`: GA / TikTok pixel beacons

Adding a new vendor on a new origin = update CSP first, then add the
gated `<script type="text/plain">` placeholder.

## What this implementation does NOT do

- It does not implement Google Tag Manager. If you switch to GTM, change the
  placeholder script to load `gtm.js` instead and use Consent Mode v2 inside
  the container itself.
- It does not implement IAB TCF v2.4. If you ever need to publish ad
  inventory through SSPs, you'll need a TCF-CMP (e.g. Cookiebot, Didomi,
  Usercentrics) — those are paid services. The first-party consent we
  collect here is sufficient for direct vendor pixels (GA, TikTok, Meta
  business pixel, etc.) but not for IAB-mediated programmatic ads.
- It does not log consent events server-side. For first-party-only sites
  this is best practice but not required by Art. 7(1) — the cookie itself
  contains enough to demonstrate the choice. If you start running paid
  campaigns at scale, add a server endpoint and POST the consent record
  inside `cookieConsent.onChange`.

## Public API

```js
window.cookieConsent.get()           // → state | null
window.cookieConsent.set(partial)    // → merges, saves, re-evaluates
window.cookieConsent.acceptAll()
window.cookieConsent.rejectAll()
window.cookieConsent.withdraw()
window.cookieConsent.openSettings()
window.cookieConsent.onChange(fn)    // → unsubscribe fn
window.cookieConsent.version         // → CONSENT_VERSION string
```

Bind UI controls via `data-cookie-action="…"` (delegated handler in the
module). Never use `onclick=`. The accepted actions are:
`accept-all`, `reject-all`, `open-settings`, `close-settings`,
`save-selection`.
