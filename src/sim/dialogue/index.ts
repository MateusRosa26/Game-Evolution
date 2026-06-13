/**
 * Diálogo de NPCs — janela híbrida do design (SISTEMA-NPCS.md): opções
 * clicáveis cobrem o essencial; keywords digitáveis são camada v2 (✏️).
 *
 * O diálogo é AUTORITATIVO na sim: o client só renderiza `DialogueViewState`
 * e devolve `dialogueChoice`. Os nós são FUNÇÕES do estado do jogador (quests),
 * então oferta → andamento → report → pós-quest saem do mesmo lugar, sem
 * máquina de estados paralela.
 *
 * Falas = rascunho dos docs (✏️ Loremaster finaliza).
 *
 * TOPOLOGIA (jun/2026): cada NPC mora em `dialogue/npcs/<id>.ts`; tipos, opções
 * padrão e a factory `makeTrainer` vivem em `dialogue/shared.ts`. Este barrel
 * re-monta `DIALOGUES` e re-exporta o que `dialogue.ts` expunha. O specifier
 * `./dialogue` segue resolvendo pra cá (index do dir).
 */
import type { DialogueViewState } from "../../shared/protocol";
import type { NpcDialogue } from "./shared";
import { bartolo } from "./npcs/bartolo";
import { ricardo } from "./npcs/ricardo";
import { leonor } from "./npcs/leonor";
import { vincente } from "./npcs/vincente";
import { gabriel } from "./npcs/gabriel";

export type { DialogueChoiceResult, NpcDialogue } from "./shared";

/** Registro de diálogos por npcId (cresce com o elenco de NPCS.md). */
export const DIALOGUES: Record<string, NpcDialogue> = {
  bartolo,
  ricardo,
  leonor,
  vincente,
  gabriel,
};

/** Monta a projeção para o snapshot. */
export function dialogueView(
  npcEntityId: number,
  npcName: string,
  view: { text: string; options: { id: string; label: string }[] },
): DialogueViewState {
  return { npcId: npcEntityId, npcName, text: view.text, options: view.options };
}
