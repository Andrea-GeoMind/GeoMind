/**
 * lib/ai/engines.ts
 *
 * Registre serveur des moteurs IA : instanciation et modèles.
 *
 * Les quatre chaînes d'appel (analyse d'autorité, surveillance, réputation,
 * healthcheck) construisaient chacune leur propre tableau de connecteurs, et
 * `authority.ts` maintenait en plus une table `ENGINE_MODELS` recopiée à la
 * main — laquelle référençait encore le modèle ChatGPT retiré d'OpenRouter
 * bien après sa correction dans le connecteur. Ici les modèles sont importés
 * des connecteurs eux-mêmes : plus rien à resynchroniser.
 *
 * Ce module instancie des connecteurs qui lisent `env` — il est réservé au
 * serveur. Pour la liste des noms côté client, voir `IA_ENGINE_NAMES` dans
 * `lib/ai/connectors/base.ts`.
 */

import { ChatGPTConnector, CHATGPT_MODEL } from '@/lib/ai/connectors/chatgpt'
import { ClaudeConnector, CLAUDE_MODEL } from '@/lib/ai/connectors/claude'
import { GeminiConnector, GEMINI_MODEL } from '@/lib/ai/connectors/gemini'
import { PerplexityConnector, PERPLEXITY_MODEL } from '@/lib/ai/connectors/perplexity'
import type { IAEngine, IAEngineName } from '@/lib/ai/connectors/base'

/** Modèle réellement appelé par chaque connecteur — importé, jamais recopié. */
export const ENGINE_MODELS: Record<IAEngineName, string> = {
  chatgpt: CHATGPT_MODEL,
  claude: CLAUDE_MODEL,
  gemini: GEMINI_MODEL,
  perplexity: PERPLEXITY_MODEL,
}

/** Instancie les moteurs interrogés lors d'une analyse. */
export function createEngines(): IAEngine[] {
  return [
    new ChatGPTConnector(),
    new ClaudeConnector(),
    new GeminiConnector(),
    new PerplexityConnector(),
  ]
}
