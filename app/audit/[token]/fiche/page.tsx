import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { Logo } from '@/components/logo'
import { env } from '@/lib/env'
import { openAudit } from '@/lib/prospect-audit/access'
import { AUDIT_CONTACT, HOW_IT_WORKS, OFFER_TITLE, formatAuditDate, ordinal } from '@/lib/prospect-audit/copy'
import { hasOwnSite } from '@/lib/prospect-audit/issues'
import { citedLabel, findCell, issueCountLabel, presenceSummary, scoreLabel } from '@/lib/prospect-audit/view'
import { ENGINE_LABELS, INTENT_LABELS, PROSPECT_ENGINES } from '@/lib/prospect-audit/types'
import './fiche.css'

export const dynamic = 'force-dynamic'

/**
 * /audit/[token]/fiche — la feuille A4 laissée au commerce : les notes, la
 * présence dans les IA, le nombre de problèmes (sans le détail) et le QR code
 * qui mène à l'audit complet. Imprimée en PDF par Chrome.
 */
export default async function AuditSheetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const access = await openAudit(token)
  if (!access.ok) notFound()
  const doc = access.document
  const p = doc.prospect
  const auditUrl = new URL(`/audit/${token}`, env.NEXT_PUBLIC_SITE_URL).toString()
  const qr = await QRCode.toDataURL(auditUrl, { errorCorrectionLevel: 'M', margin: 0, width: 600 })
  const summary = presenceSummary(doc.answers)

  return (
    <div className="fiche">
      <header className="fiche-header">
        <Logo size={40} wordmarkClassName="text-2xl" />
        <div className="fiche-stamp">
          Audit de visibilité en ligne
          <br />
          du {formatAuditDate(doc.createdAt)}
        </div>
      </header>

      <h1>{p.name}</h1>
      <p className="fiche-addr">{p.address}</p>

      {doc.scores.global !== null ? (
        <div className="fiche-scores five">
          <div className="fiche-score main">
            <div className="fiche-score-label">Note globale</div>
            <div className="fiche-score-value">
              {doc.scores.global}
              <span className="fiche-score-unit"> / 100</span>
            </div>
          </div>
          <div className="fiche-score">
            <div className="fiche-score-label">Présence IA</div>
            <div className="fiche-score-value">{doc.scores.authority}</div>
          </div>
          <div className="fiche-score">
            <div className="fiche-score-label">Fiche Google</div>
            <div className="fiche-score-value">{doc.scores.place}</div>
          </div>
          <div className="fiche-score">
            <div className="fiche-score-label">Technique</div>
            <div className="fiche-score-value">{scoreLabel(doc.scores.technical)}</div>
          </div>
          <div className="fiche-score">
            <div className="fiche-score-label">Contenu</div>
            <div className="fiche-score-value">{scoreLabel(doc.scores.content)}</div>
          </div>
        </div>
      ) : (
        <div className="fiche-scores">
          <div className="fiche-score main">
            <div className="fiche-score-label">Présence dans les IA</div>
            <div className="fiche-score-cited">{citedLabel(summary)}</div>
          </div>
          <div className="fiche-score">
            <div className="fiche-score-label">Fiche Google</div>
            <div className="fiche-score-value">
              {doc.scores.place}
              <span className="fiche-score-unit"> / 100</span>
            </div>
          </div>
          <div className="fiche-score">
            <div className="fiche-score-label">Technique</div>
            <div className="fiche-score-value">—</div>
            <div className="fiche-score-hint">pas de site</div>
          </div>
          <div className="fiche-score">
            <div className="fiche-score-label">Contenu</div>
            <div className="fiche-score-value">—</div>
            <div className="fiche-score-hint">pas de site</div>
          </div>
        </div>
      )}

      <h2>Êtes-vous cité quand un client demande aux IA ?</h2>
      <table className="fiche-table">
        <thead>
          <tr>
            <th />
            {doc.questions.map((q) => (
              <th key={q.intent}>{INTENT_LABELS[q.intent]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PROSPECT_ENGINES.map((engine) => (
            <tr key={engine}>
              <th>{ENGINE_LABELS[engine]}</th>
              {doc.questions.map((q, qi) => {
                const cell = findCell(doc.answers, qi, engine)
                if (!cell || cell.status === 'failed') return <td key={q.intent}>—</td>
                return (
                  <td key={q.intent}>
                    {cell.cited ? (
                      <span className="fiche-yes">✓{cell.position ? ` ${ordinal(cell.position)}` : ''}</span>
                    ) : (
                      <span className="fiche-no">✗</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="fiche-caption">
        ✓ cité · ✗ absent. {citedLabel(summary)}. Questions posées comme un client, sans nommer votre
        commerce.
      </p>

      <div className="fiche-issues">{issueCountLabel(doc.issues.length)}</div>

      <div className="fiche-qr">
        {/* eslint-disable-next-line @next/next/no-img-element -- QR généré à la volée, en data URI */}
        <img src={qr} alt="QR code vers votre audit complet" />
        <div>
          <div className="fiche-qr-title">Votre audit complet et le plan d&apos;action</div>
          <div className="fiche-qr-text">
            Scannez le QR code : le détail des problèmes, qui est cité à votre place, les solutions et le
            plan sur une semaine.
          </div>
        </div>
      </div>

      <div className="fiche-steps">
        <div className="fiche-steps-title">Comment ça se passe</div>
        <ol>
          {HOW_IT_WORKS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="fiche-back">
          Je repasse le : <span className="fiche-blank" />
        </p>
      </div>

      <div className="fiche-offer">
        <div className="fiche-offer-title">{OFFER_TITLE}.</div>
        <p>
          Fiche Google complétée, avis (QR code et message type), 2 à 3 annuaires de votre secteur,{' '}
          {hasOwnSite(p) ? 'une page de votre site optimisée' : 'une page web à votre nom'}, les mêmes
          informations partout sur le web, présence dans les sources que lisent les IA.
        </p>
      </div>

      <footer className="fiche-footer">
        {AUDIT_CONTACT.name} · GeoMind · {AUDIT_CONTACT.phone} · {AUDIT_CONTACT.email} · {AUDIT_CONTACT.site}
      </footer>
    </div>
  )
}
