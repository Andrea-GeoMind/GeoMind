import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'

vi.mock('@/lib/env', () => ({
  env: { OPENROUTER_API_KEY: 'sk-or-test', PERPLEXITY_API_KEY: 'pplx-test' },
}))

import { CLAUDE_MODEL } from '@/lib/ai/connectors/claude'
import { CHATGPT_MODEL } from '@/lib/ai/connectors/chatgpt'
import { GEMINI_MODEL } from '@/lib/ai/connectors/gemini'
import { MODEL_PRICING } from '@/lib/ai/cost'

/**
 * Régression de coût sur les connecteurs.
 *
 * Deux anomalies mesurées sur le prompt réel de production (3 exécutions
 * chacune) faisaient monter une analyse à ~1,65 $ :
 *  - Claude via l'outil natif `web_search_20250305` : boucle agentique, chaque
 *    tour renvoyant tout le contexte accumulé → 39 163 tokens d'entrée ;
 *  - ChatGPT sur un modèle à raisonnement (gpt-5-mini) → 29 776 tokens.
 * Les deux sont passés au plugin `web` sur un modèle non raisonneur : 3 568 et
 * 2 928 tokens, à couverture de sources égale ou meilleure.
 */
/**
 * Source sans les commentaires : ceux-ci citent volontairement les mécanismes
 * écartés pour expliquer pourquoi, et ne doivent pas déclencher les gardes.
 */
const source = (f: string) =>
  readFileSync(`lib/ai/connectors/${f}.ts`, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')

describe('connecteurs — garde-fous de coût', () => {
  it('aucun connecteur n’utilise la boucle agentique web_search', () => {
    for (const f of ['claude', 'chatgpt', 'gemini', 'perplexity']) {
      expect(source(f), `${f} : outil natif web_search détecté`).not.toContain('web_search_20250305')
      expect(source(f)).not.toContain('max_uses')
    }
  })

  it('les moteurs qui cherchent plafonnent explicitement leurs résultats', () => {
    for (const f of ['claude', 'chatgpt', 'gemini']) {
      expect(source(f), `${f} : plugin web sans max_results`).toMatch(
        /plugins:\s*\[\{\s*id:\s*'web',\s*max_results:\s*\d+\s*\}\]/
      )
    }
  })

  it('n’emploie aucun modèle à raisonnement — ils font exploser l’entrée avec le plugin web', () => {
    const raisonneurs = ['gpt-5-mini', 'gpt-5-nano', 'o1', 'o3']
    for (const model of [CLAUDE_MODEL, CHATGPT_MODEL, GEMINI_MODEL]) {
      for (const r of raisonneurs) {
        expect(model, `${model} est un modèle à raisonnement`).not.toContain(r)
      }
    }
  })

  it('chaque modèle utilisé a un tarif connu, sinon le coût est compté à zéro', () => {
    for (const model of [CLAUDE_MODEL, CHATGPT_MODEL, GEMINI_MODEL]) {
      expect(Object.keys(MODEL_PRICING), `${model} absent de MODEL_PRICING`).toContain(model)
    }
  })

  it('reste sous un plafond de coût par appel aux tarifs constatés', () => {
    // Entrées mesurées + marge : détecte un retour à un modèle cher.
    const MESURE = { [CLAUDE_MODEL]: 3568, [CHATGPT_MODEL]: 2928, [GEMINI_MODEL]: 2949 }
    for (const [model, input] of Object.entries(MESURE)) {
      const p = MODEL_PRICING[model as keyof typeof MODEL_PRICING]
      const coutEntree = (input / 1_000_000) * p.input
      expect(coutEntree, `${model} : entrée trop chère`).toBeLessThan(0.01)
    }
  })
})

describe('coût facturé plutôt que calculé', () => {
  it('chaque connecteur demande le coût à OpenRouter', () => {
    for (const f of ['claude', 'chatgpt', 'gemini', 'perplexity']) {
      expect(source(f), `${f} : n'active pas usage.include`).toMatch(
        /usage:\s*\{\s*include:\s*true\s*\}/
      )
    }
  })

  it('chaque connecteur préfère le coût facturé à la table locale', () => {
    // La table ne connaît que les tokens ; la facture inclut la recherche web.
    // Mesuré : la part manquante allait de 53 % à 95 % du coût réel.
    for (const f of ['claude', 'chatgpt', 'gemini', 'perplexity']) {
      expect(source(f), `${f} : computeCost utilisé sans repli sur le coût facturé`).toMatch(
        /cost_usd:\s*cost\s*\?\?\s*computeCost\(/
      )
    }
  })
})
