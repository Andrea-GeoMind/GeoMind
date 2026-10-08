import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  buildActivityDigest,
  buildAssistantBudgetAlert,
  buildExpiryReminder,
  type DigestInput,
} from '@/lib/chantiers/notifications'
import { alertEmailFor } from '@/lib/chantiers/copy'
import { generateChantierToken } from '@/lib/chantiers/token'

const T0 = new Date('2026-10-06T18:00:00Z')
const at = (min: number) => new Date(T0.getTime() + min * 60_000)
const C = 'c0000000-0000-4000-8000-000000000000'
const E = 'e0000000-0000-4000-8000-000000000000'
const URL = `https://geomind.fr/dashboard/chantiers/${C}`

const SECRET_VALUES = ['Salle voûtée secrète', 'Fabrice Signataire', 'maries-2025.csv', '4 500', 'fictif@example.invalid']

const chantier = {
  id: C, ownerId: 'o', clientName: 'Oravis', contactEmail: null, status: 'open' as const,
  options: { extraFields: ['hse.liste_maries'] }, tokenHash: 'h', tokenExpiresAt: new Date('2026-10-12T10:00:00Z'),
  tokenRevokedAt: null, submittedAt: null as Date | null, activityNotifiedThrough: null, expiryReminderSentAt: null,
  createdAt: T0, updatedAt: T0,
}
const establishments = [{ id: E, chantierId: C, kind: 'venue' as const, name: 'Mas de Florette', website: null, position: 0, options: {}, createdAt: T0 }]
const sig = { textVersion: 'avis-2026-10', signedAt: at(5).toISOString(), ipTruncated: '1.2.3.0' }

const rev = (fieldKey: string, oldValue: unknown, newValue: unknown, min: number, estId: string | null = E) => ({
  id: `${fieldKey}-${min}`, chantierId: C, establishmentId: estId, fieldKey, oldValue, newValue,
  actor: 'client' as const, createdAt: at(min), updatedAt: at(min),
})

function input(over: Partial<DigestInput> = {}): DigestInput {
  return {
    chantier, establishments, since: T0, until: at(15), dashboardUrl: URL, assistantQuestions: [],
    answers: [
      { id: 'a1', chantierId: C, establishmentId: E, fieldKey: 'access.gbp', value: 'unsure', updatedBy: 'client', updatedAt: at(3) },
      { id: 'a2', chantierId: C, establishmentId: E, fieldKey: 'venue.plan_b_pluie', value: 'Salle voûtée secrète', updatedBy: 'client', updatedAt: at(4) },
      { id: 'a3', chantierId: C, establishmentId: null, fieldKey: 'decision.avis', value: { choice: 'yes', comment: '', signerName: 'Fabrice Signataire', signature: sig }, updatedBy: 'client', updatedAt: at(5) },
    ],
    files: [
      { id: 'f1', chantierId: C, establishmentId: E, fieldKey: 'files.photos', category: 'photo', storagePath: `${C}/f1`, originalName: 'terrasse.jpg', mimeType: 'image/jpeg', sizeBytes: 10, status: 'ready', expiresAt: null, deletedReason: null, deletedAt: null, createdAt: at(6) },
      { id: 'f2', chantierId: C, establishmentId: null, fieldKey: 'hse.liste_maries', category: 'personal_data', storagePath: `${C}/f2`, originalName: 'maries-2025.csv', mimeType: 'text/csv', sizeBytes: 10, status: 'ready', expiresAt: at(43200), deletedReason: null, deletedAt: null, createdAt: at(7) },
      { id: 'f0', chantierId: C, establishmentId: E, fieldKey: 'files.logo', category: 'logo', storagePath: `${C}/f0`, originalName: 'ancien-logo.png', mimeType: 'image/png', sizeBytes: 10, status: 'ready', expiresAt: null, deletedReason: null, deletedAt: null, createdAt: at(-60) },
    ],
    revisions: [
      rev('access.gbp', null, 'unsure', 3),
      rev('venue.plan_b_pluie', null, 'Salle voûtée secrète', 4),
      rev('venue.prix_haute_saison', 4000, 4500, 4),
      rev('decision.avis', null, { choice: 'yes' }, 5, null),
    ],
    ...over,
  }
}

describe('e-mail groupé', () => {
  const mail = buildActivityDigest(input())!

  it('objet clair : chantier, demandes d’aide, champs, fichiers, accords', () => {
    expect(mail.subject).toBe('[Oravis] 1 demande d’aide, 1 champ rempli, 1 champ modifié, 2 fichiers reçus, 1 accord signé')
  })

  it('demandes d’aide en tête, avant les champs', () => {
    expect(mail.text.indexOf('Demandes d’aide en attente (1)')).toBeLessThan(mail.text.indexOf('Champs remplis'))
    expect(mail.text).toMatch(/- Fiche Google : GeoMind ajouté comme gestionnaire — Mas de Florette/)
  })

  it('noms des champs et des fichiers, jamais les valeurs saisies ni le signataire', () => {
    expect(mail.text).toMatch(/- Plan B en cas de pluie — Mas de Florette/)
    expect(mail.text).toMatch(/Champs modifiés \(1\)\n- Prix de départ en haute saison — Mas de Florette/)
    expect(mail.text).toMatch(/- terrasse\.jpg — Photos — Mas de Florette/)
    expect(mail.text).toMatch(/Accords signés \(1\)\n- Démarche d’avis/)
    for (const secret of SECRET_VALUES) {
      expect(mail.text, secret).not.toContain(secret)
      expect(mail.html, secret).not.toContain(secret)
      expect(mail.subject, secret).not.toContain(secret)
    }
  })

  it('la liste des mariés : signalée, sans son nom de fichier', () => {
    expect(mail.text).toMatch(/- Liste des mariés des deux dernières saisons : fichier reçu \(données personnelles, conservé 30 jours\)/)
  })

  it('les fichiers et saisies d’avant la vague ne sont pas repris', () => {
    expect(mail.text).not.toContain('ancien-logo.png')
  })

  it('lien vers la vue GeoMind, jamais vers l’espace client', () => {
    expect(mail.text).toContain(`Voir le chantier : ${URL}`)
    expect(mail.text).not.toMatch(/\/chantier\/(?!s\/)/)
    expect(mail.html).toContain(`<a href="${URL}">`)
  })

  it('une demande d’aide n’est pas répétée dans « Champs remplis »', () => {
    const remplis = mail.text.slice(mail.text.indexOf('Champs remplis'), mail.text.indexOf('Champs modifiés'))
    expect(remplis).not.toContain('Fiche Google')
    expect(remplis).toContain('Plan B en cas de pluie')
  })

  it('une vague faite d’une seule demande d’aide envoie quand même un e-mail', () => {
    const base = input()
    const only = buildActivityDigest(
      input({ revisions: [rev('access.gbp', null, 'unsure', 3)], files: [], answers: base.answers.slice(0, 1) })
    )!
    expect(only.subject).toBe('[Oravis] 1 demande d’aide')
    expect(only.text).not.toContain('Champs remplis')
  })

  it('seule l’adresse de la vue GeoMind est cliquable (audit du 07/10/2026)', () => {
    const tricked = buildActivityDigest(
      input({ chantier: { ...chantier, clientName: 'Oravis https://evil.example/phish' } })
    )!
    expect(tricked.html.match(/<a href=/g)).toHaveLength(1)
    expect(tricked.html).toContain(`<a href="${URL}">`)
    expect(tricked.html).not.toContain('href="https://evil.example')
  })

  it('« J’ai terminé » en tout premier', () => {
    const done = buildActivityDigest(input({ chantier: { ...chantier, submittedAt: at(14) } }))!
    expect(done.subject).toMatch(/^\[Oravis\] « J’ai terminé », 1 demande d’aide/)
    expect(done.text.split('\n')[2]).toBe('Le client a cliqué sur « J’ai terminé » le 6 octobre 2026 à 20:14.')
  })

  it('rien de neuf → pas d’e-mail', () => {
    expect(buildActivityDigest(input({ since: at(20), until: at(30) }))).toBeNull()
  })

  it('HTML minimal : aucune image, aucun style lourd, texte échappé', () => {
    expect(mail.html).not.toMatch(/<img|<table|background|linear-gradient/)
    const hostile = buildActivityDigest(
      input({ chantier: { ...chantier, clientName: '<script>x</script>' } })
    )!
    expect(hostile.html).toContain('&lt;script&gt;')
  })

  it('aucun jeton de lien dans un e-mail', () => {
    const { token } = generateChantierToken()
    const withToken = buildActivityDigest(input({ chantier: { ...chantier, tokenHash: token } }))!
    expect(withToken.text).not.toContain(token)
  })
})

describe('questions à l’assistant dans l’e-mail groupé', () => {
  it('l’étape, l’établissement et le nombre, jamais la question', () => {
    const email = buildActivityDigest(
      input({
        revisions: [],
        files: [],
        answers: [],
        assistantQuestions: [
          { establishmentId: E, fieldKey: 'access.gbp', question: 'Mon code est 123456' } as never,
          { establishmentId: E, fieldKey: 'access.gbp' },
          { establishmentId: E, fieldKey: 'access.search_console' },
        ],
      })
    )!
    expect(email.text).toContain(
      'Questions à l’assistant : Fiche Google : GeoMind ajouté comme gestionnaire (Mas de Florette) × 2'
    )
    expect(email.text).toContain('Questions à l’assistant : Google Search Console : accès ajouté (Mas de Florette) × 1')
    expect(email.subject).toContain('3 questions à l’assistant')
    expect(email.text + email.html).not.toContain('123456')
  })
})

describe('alerte budget de l’assistant', () => {
  it('1 € : alerte, le bot continue ; 3 € : arrêt', () => {
    const alert = buildAssistantBudgetAlert({ level: 'alert', spentUsd: 1.02, alertEur: 1, stopEur: 3 })
    expect(alert.subject).toMatch(/seuil/)
    expect(alert.text).toMatch(/continue de répondre/)
    const stop = buildAssistantBudgetAlert({ level: 'stop', spentUsd: 3.01, alertEur: 1, stopEur: 3 })
    expect(stop.subject).toMatch(/arrêté/)
    expect(stop.html).not.toMatch(/<a /)
  })

  it('envoyée par l’échange qui franchit le seuil, dépense relue après enregistrement', () => {
    const route = readFileSync('app/chantier/assistant/route.ts', 'utf8')
    expect(route).toMatch(/const spentAfter = await assistantSpentSince\(dayStart\)/)
    expect(route).toMatch(/if \(crossed\) await sendAssistantBudgetAlert\(crossed, spentAfter/)
  })
})

describe('alerte d’expiration', () => {
  const base = { chantier, establishments, answers: input().answers, files: input().files, dashboardUrl: URL }

  it('objet et contenu', () => {
    const mail = buildExpiryReminder({ ...base, now: new Date('2026-10-05T10:00:00Z') })!
    expect(mail.subject).toBe('[Oravis] Le lien expire dans 7 jours, chantier non terminé')
    expect(mail.text).toMatch(/expire le 12 octobre 2026 \(dans 7 jours\)/)
    expect(mail.text).toMatch(/1 demande d’aide en attente/)
    expect(mail.text).toContain(URL)
    for (const secret of SECRET_VALUES) expect(mail.text).not.toContain(secret)
  })

  it('pas d’alerte si le client a terminé', () => {
    expect(buildExpiryReminder({ ...base, chantier: { ...chantier, submittedAt: T0 }, now: T0 })).toBeNull()
  })
})

describe('branchements', () => {
  it('destinataire réglable par chantier, Gmail par défaut', () => {
    expect(alertEmailFor({})).toBe('andrea.schwertz2008@gmail.com')
    expect(alertEmailFor({ alertEmail: 'autre@exemple.fr' })).toBe('autre@exemple.fr')
  })

  it('vague de 10 minutes par chantier', () => {
    const fn = readFileSync('lib/inngest/functions/chantier-activity-digest.ts', 'utf8')
    expect(fn).toMatch(/debounce: \{ key: 'event\.data\.chantierId', period: '10m', timeout: '30m' \}/)
    expect(fn).toMatch(/\{ event: 'chantier\.activity\.recorded' \}/)
  })

  it('l’activité du client déclenche la vague : saisie, fichier, « J’ai terminé »', () => {
    const actions = readFileSync('app/chantier/espace/actions.ts', 'utf8')
    expect(actions.match(/await recordChantierActivity\(access\.chantier\.id\)/g)).toHaveLength(3)
  })

  it('alerte d’expiration : cron quotidien, une fois par lien', () => {
    const fn = readFileSync('lib/inngest/functions/chantier-expiry-reminder.ts', 'utf8')
    expect(fn).toMatch(/\{ cron: '0 7 \* \* \*' \}/)
    const q = readFileSync('lib/db/queries/chantiers.ts', 'utf8')
    expect(q).toMatch(/expiryReminderSentAt: null,/)
  })

  it('la borne de l’e-mail groupé n’avance que si l’e-mail est parti', () => {
    const alerts = readFileSync('lib/chantiers/alerts.ts', 'utf8')
    const body = alerts.slice(alerts.indexOf('const sent = await sendEmail'), alerts.indexOf("return 'sent'"))
    expect(body).toMatch(/if \(!sent\) return 'send_failed'[\s\S]*activityNotifiedThrough: until/)
  })
})
