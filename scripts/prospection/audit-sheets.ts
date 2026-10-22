import { mkdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import { chromium, type Page, type Response } from '@playwright/test'
import { PDFDocument } from 'pdf-lib'

/**
 * Feuilles A4 des audits prospects (ticket C-05b) : imprime /audit/[token]/fiche
 * en PDF (une page par audit), avec un aperçu PNG de chaque feuille et une
 * capture pleine page de l'audit en largeur téléphone.
 *
 * Usage :
 *   npx tsx scripts/prospection/audit-sheets.ts --ranks 1,8 [--out Visites.pdf | /chemin/absolu.pdf] [--base https://geomind.fr]
 *   Les feuilles sortent dans l'ordre des rangs donnés (audit-report.ts imprime l'ordre des tournées).
 *
 * Lit les liens dans ~/Downloads/Audits-C05b/liens.csv (écrit par audit-prospect.ts).
 * Refuse une feuille qui déborderait sur une 2e page.
 */

const OUT_DIR = join(homedir(), 'Downloads', 'Audits-C05b')

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}

interface LinkRow {
  rank: number
  name: string
  url: string
}

function readLinks(): LinkRow[] {
  const lines = readFileSync(join(OUT_DIR, 'liens.csv'), 'utf8').trim().split('\n').slice(1)
  const rows = lines.map((l) => {
    const [rank, name, url] = l.split(';')
    return { rank: Number(rank), name: name ?? '', url: url ?? '' }
  })
  // Le dernier lien d'un rang fait foi (un audit refait remplace le précédent)
  return [...new Map(rows.map((r) => [r.rank, r])).values()]
}

/** Ouvre une page, avec une reprise : un redéploiement Vercel peut couper une requête. */
async function open(page: Page, url: string): Promise<Response | null> {
  try {
    return await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
  } catch {
    return page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
  }
}

async function main(): Promise<void> {
  const ranks = (arg('--ranks') ?? '').split(',').filter(Boolean).map(Number)
  const base = arg('--base')
  const outArg = arg('--out') ?? 'Feuilles-audit.pdf'
  const out = isAbsolute(outArg) ? outArg : join(OUT_DIR, outArg)
  const links = readLinks()
  const selected = ranks.length ? ranks.map((r) => links.find((l) => l.rank === r)) : links
  if (selected.some((l) => !l)) throw new Error('Rang sans lien dans liens.csv')
  mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const merged = await PDFDocument.create()
  try {
    for (const link of selected as LinkRow[]) {
      const url = base ? link.url.replace(/^https?:\/\/[^/]+/, base) : link.url
      const prefix = join(OUT_DIR, String(link.rank).padStart(2, '0'))

      const sheet = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 })
      const res = await open(sheet, `${url}/fiche`)
      if (!res || res.status() !== 200) throw new Error(`${link.name} : fiche en HTTP ${res?.status()}`)
      await sheet.emulateMedia({ media: 'print' })
      // La feuille a une hauteur fixe et coupe ce qui dépasse sans ajouter de
      // page : on mesure la marge entre le pied de page et le bas de la feuille.
      const spareMm = await sheet.evaluate(() => {
        const fiche = document.querySelector('.fiche')!.getBoundingClientRect()
        const content = [...document.querySelectorAll('.fiche > *')].map((e) => e.getBoundingClientRect().bottom)
        return (fiche.bottom - Math.max(...content)) / (96 / 25.4)
      })
      if (spareMm < 3) throw new Error(`${link.name} : la feuille déborde (marge ${spareMm.toFixed(1)} mm)`)
      const gap = await sheet.evaluate(() => {
        const qr = document.querySelector('.fiche-qr')!.getBoundingClientRect().bottom
        const steps = document.querySelector('.fiche-steps-title')!.getBoundingClientRect().top
        return (steps - qr) / (96 / 25.4)
      })
      if (gap < 4) throw new Error(`${link.name} : la feuille est trop pleine (${gap.toFixed(1)} mm avant « Comment ça se passe »)`)
      const pdf = await sheet.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })
      const doc = await PDFDocument.load(pdf)
      if (doc.getPageCount() !== 1) throw new Error(`${link.name} : la feuille fait ${doc.getPageCount()} pages`)
      const [page] = await merged.copyPages(doc, [0])
      merged.addPage(page!)
      await sheet.screenshot({ path: `${prefix}-feuille.png`, fullPage: false })
      await sheet.close()

      const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
      await open(phone, url)
      await phone.screenshot({ path: `${prefix}-page.png`, fullPage: true })
      await phone.close()
      console.log(`  ${link.rank} ${link.name} : feuille + page (${gap.toFixed(0)} mm de réserve)`)
    }
  } finally {
    await browser.close()
  }
  const { writeFileSync } = await import('node:fs')
  writeFileSync(out, await merged.save())
  console.log(`PDF : ${out} (${merged.getPageCount()} page(s))`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
