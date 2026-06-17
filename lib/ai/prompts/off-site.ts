// Prompt de détection de présence off-site (envoyé à Perplexity, qui fait une
// recherche web). On demande un verdict JSON strict pour une plateforme donnée.
// La sortie est ensuite parsée + validée par Zod côté lib/analysis/off-site-presence.ts.

export function buildOffSitePresencePrompt(params: {
  brandName: string
  siteUrl: string
  platformName: string
  platformDomain: string
}): string {
  const { brandName, siteUrl, platformName, platformDomain } = params
  return [
    `Recherche sur le web si l'entreprise « ${brandName} » (site officiel : ${siteUrl}) possède une page, une fiche ou un profil OFFICIEL sur ${platformName} (domaine ${platformDomain}).`,
    '',
    `Sois STRICT : ne réponds "present" que si tu trouves une page sur ${platformDomain} qui correspond bien à CETTE entreprise précise (même activité / même site), pas un simple homonyme.`,
    `Si tu ne trouves pas de page la concernant sur ${platformDomain}, réponds "absent".`,
    `Si tu n'es pas sûr, réponds "unknown".`,
    '',
    'Réponds UNIQUEMENT par un objet JSON, sans aucun texte autour, au format exact :',
    '{"status":"present|absent|unknown","url":"<URL exacte du profil ou null>","raison":"<une phrase courte>"}',
  ].join('\n')
}
