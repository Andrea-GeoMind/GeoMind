/**
 * GET /api/pixel/script.js — sert le script du Pixel GeoMind (PLAN item 29).
 *
 * Le client pose une seule balise <script> sur son site. Le script :
 * - n'envoie RIEN si le visiteur ne vient pas d'une IA (referrer non-IA),
 * - poste une « pageview » au chargement, puis une « action » sur clic
 *   tel:/mailto:, envoi de formulaire, ou lien de réservation.
 * Léger (< 1 Ko), sans dépendance, sans cookie.
 */

import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  const endpoint = `${env.NEXT_PUBLIC_SITE_URL}/api/pixel`

  const script = `(function(){
  try {
    var ref = document.referrer || '';
    // N'agir que si le visiteur vient d'une IA (filtre serveur de toute façon).
    var AI = /chatgpt\\.com|chat\\.openai\\.com|openai\\.com|perplexity\\.ai|claude\\.ai|anthropic\\.com|copilot\\.microsoft\\.com|bing\\.com\\/chat|gemini\\.google\\.com/i;
    if (!AI.test(ref)) return;
    var s = document.currentScript;
    var key = s && s.getAttribute('data-key');
    if (!key) return;
    var EP = ${JSON.stringify(endpoint)};
    function send(type, action){
      try {
        var payload = JSON.stringify({ k: key, t: type, r: ref, p: location.pathname, a: action || null });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(EP, new Blob([payload], { type: 'application/json' }));
        } else {
          fetch(EP, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
        }
      } catch (e) {}
    }
    send('pageview');
    document.addEventListener('click', function(ev){
      var el = ev.target && ev.target.closest ? ev.target.closest('a,button') : null;
      if (!el) return;
      var href = (el.getAttribute && el.getAttribute('href')) || '';
      if (/^tel:/i.test(href)) return send('action','tel');
      if (/^mailto:/i.test(href)) return send('action','mailto');
      if (/(calendly|cal\\.com|rdv|booking|reserv|rendez-vous|doctolib)/i.test(href)) return send('action','booking');
    }, true);
    document.addEventListener('submit', function(){ send('action','form'); }, true);
  } catch (e) {}
})();`

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
