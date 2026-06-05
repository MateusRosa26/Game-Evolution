import type { AttributeKey, Attributes, Dir8, EntityKind, Facing, MapData, PlayerClass, Vec2 } from "./types";
import type { OutfitState } from "./outfits";

/**
 * Protocolo cliente ⇄ simulação.
 *
 * IMPORTANTE: este protocolo é desenhado como se fosse rede desde o dia 1.
 * Hoje trafega por um LocalTransport (mesma página); no futuro online,
 * trafega por WebSocket sem mudar o formato.
 */

export type ClientCommand =
  /** WASD: direção mantida (null = soltou as teclas). */
  | { type: "setDir"; dir: Dir8 | null }
  /** Click-to-move: a simulação faz o pathfinding (como Tibia/RO). */
  | { type: "walkTo"; x: number; y: number }
  /** Seleciona alvo para auto-attack (null = limpa o alvo). */
  | { type: "selectTarget"; entityId: number | null }
  /** Distribui 1 ponto de atributo livre (a sim valida se há ponto). */
  | { type: "allocateStatPoint"; attr: AttributeKey }
  /**
   * Usa uma skill. `targetId` é o alvo selecionado (monstro p/ ofensivas;
   * aliado/self p/ cura — omitido = self). A sim valida conhecida/mana/cooldown
   * e RESOLVE instantaneamente (estilo runa de Tibia). Spam no ar não custa nada.
   */
  | { type: "useSkill"; skillId: string; targetId?: number | null }
  /**
   * DEV/teste: concede uma skill ao jogador (compra em NPC é M2+). Atalho do
   * harness para exercitar as 6 skills sem trocar de classe. ✏️ remover/gat em M2.
   */
  | { type: "debugGrantSkill"; skillId: string }
  /**
   * Define o outfit completo (3 peças + cores — `shared/outfits.ts`). A sim
   * VALIDA: peça existe, slot certo, está no guarda-roupa do jogador e cor é
   * índice da grade. ✏️ desbloqueio por quest/conteúdo pago alimenta o
   * guarda-roupa no futuro — a validação de posse já mora aqui.
   */
  | { type: "setOutfit"; outfit: OutfitState }
  /** DEV/teste: desbloqueia TODAS as peças do catálogo no guarda-roupa. */
  | { type: "debugGrantOutfit" }
  | { type: "stop" };

/**
 * Projeção da progressão do jogador no snapshot (DESIGN-EVOLUCAO.md §Camada
 * Sólida). Só dados serializáveis. Presente apenas na entidade do jogador.
 */
export interface PlayerProgressState {
  cls: PlayerClass;
  level: number;
  /** XP TOTAL acumulado (desde o nível 1, cumulativo — NÃO o do nível atual). */
  xp: number;
  /** XP TOTAL acumulado necessário para ATINGIR o próximo nível (cumulativo). */
  xpForNextLevel: number;
  /**
   * XP TOTAL acumulado necessário para ATINGIR o nível atual (o "piso" do nível,
   * cumulativo). Vem da sim (`xpForLevel(level)`); o client não pode computá-lo.
   * Progresso dentro do nível = `(xp - xpLevelFloor) / (xpForNextLevel - xpLevelFloor)`.
   */
  xpLevelFloor: number;
  attributes: Attributes;
  /** Pontos de atributo livres não distribuídos. */
  freeStatPoints: number;
}

/**
 * Status effect ativo numa entidade, projetado no snapshot (DESIGN-EVOLUCAO.md
 * §"Magias e Skills": "Visível no snapshot para o client futuro"). Só o que o
 * client precisa para mostrar ícone/contador — a mecânica vive na sim.
 */
export interface StatusEffectState {
  /** queimadura (fogo, DoT) / lentidão / veneno (tipado p/ Rogue T2). */
  kind: "burn" | "slow" | "poison";
  /** Ticks restantes até expirar (×TICK_MS = ms para o client). */
  remainingTicks: number;
}

/**
 * Uma skill conhecida do jogador, projetada no snapshot (para a hotbar/HUD).
 * DESIGN-EVOLUCAO.md pede "skills conhecidas do player (id, cooldown restante
 * em ms, custo)". Mana já vem em `EntityState.mp`.
 */
export interface KnownSkillState {
  id: string;
  /** Cooldown RESTANTE em ms (0 = pronta). */
  cooldownMs: number;
  /** Custo de mana por cast. */
  manaCost: number;
}

/**
 * Arma equipada do jogador, projetada no snapshot (DESIGN-EVOLUCAO.md §"Itens
 * são instâncias" — mínimo para a HUD futura). Só a IDENTIDADE da instância:
 * o LEDGER (contadores de Marca) é OCULTO por design (§"Visibilidade": Marcas são
 * secretas) e NUNCA vai ao snapshot.
 */
export interface EquippedWeaponState {
  /** ID da instância equipada (estável dentro da sessão). */
  instanceId: number;
  /** ID do template (stats compartilhados). */
  templateId: string;
  /** Nome exibível da arma (pt-BR). */
  name: string;
}

export interface EntityState {
  id: number;
  kind: EntityKind;
  name: string;
  /** Espécie da criatura (escolhe o sprite no client); null para player/npc. */
  species: string | null;
  /** Tile lógico atual. */
  pos: Vec2;
  facing: Facing;
  /** Duração do passo atual em ms — o cliente usa para animar a transição. */
  stepMs: number;
  /** True se a entidade iniciou um passo neste tick. */
  moving: boolean;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  /** Status effects ativos (queimadura/slow/veneno). Vazio = nenhum. */
  status: StatusEffectState[];
  /** Progressão — presente SOMENTE na entidade do jogador (undefined p/ mobs). */
  progress?: PlayerProgressState;
  /** Skills conhecidas — SOMENTE na entidade do jogador (undefined p/ mobs). */
  skills?: KnownSkillState[];
  /**
   * Arma equipada — SOMENTE na entidade do jogador (undefined p/ mobs). Apenas a
   * identidade (instanceId/templateId/nome); o ledger é oculto e não trafega.
   */
  weapon?: EquippedWeaponState;
  /**
   * Outfit do personagem (peças + cores — `shared/outfits.ts`) — SOMENTE
   * jogadores. Estado da sim: no online, todos veem o outfit de todos.
   */
  outfit?: OutfitState;
  /** Peças possuídas (ids) — SOMENTE o próprio jogador (para a UI de outfit). */
  wardrobe?: string[];
  /**
   * Alvo selecionado — SOMENTE jogadores. Por-entidade (não global no snapshot):
   * cada jogador tem o SEU alvo; o client lê o da própria entidade. null = nenhum.
   */
  targetId?: number | null;
}

/**
 * Eventos one-shot encaminhados ao client num snapshot (feedback visual).
 * Não são estado — acontecem uma vez no tick e o client reage (floating text,
 * morte). São a projeção dos eventos da sim relevantes ao jogador.
 */
export type SnapshotEvent =
  /** Dano aplicado — para floating damage text. */
  | { kind: "damage"; targetId: number; amount: number; pos: Vec2 }
  /** Entidade morreu — para efeito/limpeza visual. */
  | { kind: "death"; entityId: number; pos: Vec2 }
  /**
   * Cast de skill resolvido — dados suficientes para o client ANIMAR o projétil/
   * golpe DEPOIS (responsabilidade futura do client). A sim já resolveu o efeito;
   * isto é só feedback visual. `from`→`to` é origem→destino (alvo, ou ponta da
   * linha p/ Lança de Gelo). DESIGN-EVOLUCAO.md §"deixe dados suficientes…".
   */
  | { kind: "cast"; skillId: string; casterId: number; from: Vec2; to: Vec2 }
  /** Cura aplicada — para floating text verde futuro. `amount` = HP restaurado. */
  | { kind: "heal"; skillId: string | null; casterId: number; targetId: number; amount: number; pos: Vec2 }
  /**
   * Camada EMERGENTE (DESIGN-EVOLUCAO.md §"Visibilidade") — dica vaga e
   * atmosférica disparada UMA vez aos ~50% do progresso de uma Marca/Mutação/
   * Caminho. CHEAT-PROOF E DESIGN DE MISTÉRIO: NUNCA carrega contador, threshold,
   * categoria ou id — só o texto do hint. O client não pode inferir progresso.
   */
  | { kind: "trackingHint"; text: string }
  /**
   * Desbloqueio de uma Marca/Mutação/Caminho — o "momento screenshotável". Carrega
   * só o que o client precisa para celebrar: categoria (item/skill/personagem),
   * NOME próprio e flavor. JAMAIS contadores/progresso (DESIGN-EVOLUCAO.md
   * §"Visibilidade"). A UI de toast é wave futura; por ora o client só loga.
   */
  | { kind: "trackingUnlock"; category: "mark" | "mutation" | "path"; name: string; flavorText: string };

/**
 * NOTA (online): snapshots são FULL a cada tick — decisão consciente do M1
 * (transport local, custo zero). Na migração para rede, trocar por
 * delta-encoding (baseline + diff por entidade + ack do client); o formato
 * já é serializável e o ponto único de emissão (`Simulation.emitSnapshot`)
 * concentra a mudança.
 */
export interface Snapshot {
  tick: number;
  entities: EntityState[];
  /** Eventos one-shot deste tick (não persistem). */
  events: SnapshotEvent[];
}

export type ServerMessage =
  | { type: "welcome"; playerId: number; map: MapData }
  | { type: "snapshot"; snap: Snapshot };

/** Lado do cliente: envia comandos, recebe mensagens. */
export interface ClientTransport {
  send(cmd: ClientCommand): void;
  onMessage(cb: (msg: ServerMessage) => void): void;
}
