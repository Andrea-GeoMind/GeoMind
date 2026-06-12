/**
 * lib/analysis/errors.ts
 *
 * Traduction des erreurs techniques d'analyse en messages compréhensibles
 * par un patron de TPE (PLAN item 17). « Une erreur inattendue est survenue »
 * sans contexte = panique utilisateur ; on dit ce qui s'est passé et quoi faire.
 * Fonction pure, testée unitairement.
 */

const REFUND_NOTE = ' Vos crédits ont été remboursés automatiquement.'

interface ErrorPattern {
  test: RegExp
  message: string
}

const PATTERNS: ErrorPattern[] = [
  {
    test: /timeout|timed?\s?out|ETIMEDOUT|ECONNRESET|deadline/i,
    message:
      'Votre site a mis trop de temps à répondre pendant le crawl. Il est peut-être lent ou temporairement indisponible — réessayez dans quelques minutes.',
  },
  {
    test: /firecrawl|crawl/i,
    message:
      "Impossible de lire le contenu de votre site. Vérifiez que l'adresse est correcte, que le site est en ligne et qu'il ne bloque pas les robots (fichier robots.txt ou pare-feu).",
  },
  {
    test: /429|rate.?limit|too many requests|overloaded|capacity/i,
    message:
      'Les moteurs IA sont momentanément saturés. Ce n’est pas lié à votre site — réessayez dans une trentaine de minutes.',
  },
  {
    test: /401|403|forbidden|unauthorized|denied/i,
    message:
      "Votre site a refusé l'accès à nos robots d'analyse (protection anti-bot ou pare-feu). Autorisez les robots ou contactez votre webmaster.",
  },
  {
    test: /402|payment|insufficient.*(credit|fund|quota)/i,
    message:
      'Un service tiers utilisé par l’analyse est indisponible. Notre équipe est alertée — réessayez plus tard.',
  },
  {
    test: /404|not found/i,
    message:
      "La page d'accueil de votre site est introuvable (erreur 404). Vérifiez l'adresse enregistrée dans GeoMind.",
  },
]

/**
 * Convertit un message d'erreur brut en message utilisateur actionnable.
 * Toujours suffixé du rappel de remboursement (le job rembourse en cas d'échec).
 */
export function humanizeAnalysisError(rawMessage: string): string {
  const match = PATTERNS.find((p) => p.test.test(rawMessage))
  const base =
    match?.message ??
    "L'analyse a rencontré un incident technique de notre côté. Notre équipe est alertée — réessayez dans quelques minutes."
  return base + REFUND_NOTE
}
