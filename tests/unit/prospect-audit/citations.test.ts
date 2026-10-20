import { describe, it, expect } from 'vitest'
import {
  actorMatches,
  analyseAnswer,
  buildNameMatcher,
  extractListedActors,
  rankCitedInstead,
} from '@/lib/prospect-audit/citations'

const LIST = `Voici quelques barbiers réputés dans le 1er arrondissement :

1. **Casa Barbershop Lyon** – 14 rue Romarin, très bien noté.
   - Site : https://casa-barbershop-lyon.com
   - Tarifs : à partir de 25 €
2. **Best Barber** - Montée de la Grande-Côte
3. [Industrie Barbers](https://industrie-barbers.fr) : ambiance vintage
4. **Le Barbier** (rue d'Algérie)

En résumé, le barbier idéal dépend de vos attentes.`

describe('extractListedActors', () => {
  it('garde les éléments numérotés, sans les puces de détail', () => {
    expect(extractListedActors(LIST)).toEqual([
      'Casa Barbershop Lyon',
      'Best Barber',
      'Industrie Barbers',
      'Le Barbier',
    ])
  })

  it('se rabat sur les puces quand la réponse n’est pas numérotée', () => {
    expect(extractListedActors('- **Studio Bellecour** : coloration\n- **Microlocks Lyon**')).toEqual([
      'Studio Bellecour',
      'Microlocks Lyon',
    ])
  })

  it('lit les titres numérotés', () => {
    expect(extractListedActors('### 1. Crossfit des Pentes\nTexte\n### 2. ATLAS Training\n')).toEqual([
      'Crossfit des Pentes',
      'ATLAS Training',
    ])
  })
})

describe('reconnaissance du nom', () => {
  it('un nom générique n’est reconnu que comme acteur de la liste', () => {
    const m = buildNameMatcher('Le Barbier')
    expect(m.distinctive).toBe(false)
    const res = analyseAnswer('Le barbier idéal est souvent celui du quartier.', [], {
      name: 'Le Barbier',
      domain: null,
      listingUrl: null,
    })
    expect(res.cited).toBe(false)
  })

  it('un nom distinctif est reconnu dans le texte, sans accent ni casse', () => {
    const res = analyseAnswer('Je vous conseille atlas TRAINING, un coach à la Croix-Rousse.', [], {
      name: 'ATLAS Training - Coaching sportif à Lyon',
      domain: 'atlas-training.fr',
      listingUrl: null,
    })
    expect(res.cited).toBe(true)
    expect(res.position).toBeNull()
  })

  it('donne le rang dans la liste et retire le commerce des concurrents', () => {
    const res = analyseAnswer(LIST, [], { name: 'Best barber', domain: null, listingUrl: null })
    expect(res).toMatchObject({ cited: true, position: 2 })
    expect(res.competitors).toEqual(['Casa Barbershop Lyon', 'Industrie Barbers', 'Le Barbier'])
  })

  it('reconnaît le domaine du site dans les sources', () => {
    const res = analyseAnswer('Plusieurs salles existent.', [
      { url: 'https://www.atlas-training.fr/contact', title: null, domain: 'atlas-training.fr' },
    ], { name: 'ATLAS Training', domain: 'atlas-training.fr', listingUrl: null })
    expect(res.cited).toBe(true)
  })

  it('reconnaît la page de plateforme de la fiche (Planity), pas la plateforme seule', () => {
    const target = { name: 'Le Barbier', domain: null, listingUrl: 'https://www.planity.com/le-barbier-69001-lyon' }
    const page = { url: 'https://www.planity.com/le-barbier-69001-lyon', title: null, domain: 'planity.com' }
    const other = { url: 'https://www.planity.com/autre-salon-69002', title: null, domain: 'planity.com' }
    expect(analyseAnswer('Réservez en ligne.', [page], target).cited).toBe(true)
    expect(analyseAnswer('Réservez en ligne.', [other], target).cited).toBe(false)
  })

  it('un nom court sans mot distinctif garde le nom complet', () => {
    const m = buildNameMatcher('2.11 | Atelier de coiffure')
    expect(actorMatches('2.11 Atelier de coiffure', m)).toBe(true)
    expect(actorMatches('Atelier de coiffure Saint-Paul', m)).toBe(false)
  })
})

describe('rankCitedInstead', () => {
  it('compte une fois par réponse et classe par fréquence', () => {
    expect(
      rankCitedInstead([
        { competitors: ['Studio Bellecour', 'Microlocks Lyon', 'studio bellecour'] },
        { competitors: ['Studio Bellecour'] },
        { competitors: ['Jean Louis David'] },
      ])
    ).toEqual([
      { name: 'Studio Bellecour', answers: 2 },
      { name: 'Jean Louis David', answers: 1 },
      { name: 'Microlocks Lyon', answers: 1 },
    ])
  })
})
