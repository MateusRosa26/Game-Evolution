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
   * Rito de classe: o jogador classless escolhe uma classe (gate quest+gold; a
   * sim valida). Uma via — não dá pra ritar de novo. `cls` nunca é "classless".
   */
  | { type: "chooseClass"; cls: PlayerClass }
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
  /** Conversar com um NPC próximo (abre/avança o diálogo na sim). */
  | { type: "talk"; npcId: number }
  /** Escolher uma opção do diálogo ativo. */
  | { type: "dialogueChoice"; optionId: string }
  /** Fechar o diálogo ativo (Esc / clicar fora). */
  | { type: "closeDialogue" }
  /** Abrir a loja de um NPC mercador próximo (a sim monta o sortimento). */
  | { type: "openShop"; npcId: number }
  /** Comprar 1 unidade de um item do sortimento da loja aberta. */
  | { type: "buyItem"; templateId: string }
  /** Vender uma instância de item do bolso à loja aberta. */
  | { type: "sellItem"; instanceId: number }
  /** Fechar a loja aberta (Esc / clicar fora). */
  | { type: "closeShop" }
  /** Abrir um baú próximo (saque single-use: concede o loot ao bolso na sim). */
  | { type: "openChest"; chestId: string }
  /** Abrir um container (mochila equipada, cadáver próximo, mochila aninhada). */
  | { type: "openContainer"; containerId: number }
  | { type: "closeContainer"; containerId: number }
  /**
   * Mover item/gold entre lugares (drag & drop). A sim valida TUDO:
   * distância, posse, tipo de slot, regra 2H. Pilha de ouro = move/funde (item).
   */
  | { type: "moveItem"; from: ItemRef; to: ItemRef }
  /** Saquear gold de um container (clique na pilha). */
  | { type: "lootGold"; containerId: number; slot: number }
  /**
   * Usar um consumível que o jogador carrega (comida/poção). `ref` aponta a
   * instância (slot de bolso). A sim valida posse, lê o efeito do template e
   * aplica (cura instantânea / saciedade), consumindo 1 unidade. Itens sem
   * efeito de uso são ignorados.
   */
  | { type: "useItem"; ref: ItemRef }
  /**
   * Cozinha uma receita (design/itens/COZINHA.md). A sim valida posse dos inputs
   * no bolso, gates (fonte de calor / água-doce / quest), consome os inputs (incl.
   * vasilhame) e produz 1 unidade do prato. Receita = conhecimento, não skill.
   */
  | { type: "cook"; recipeId: string }
  /** Falar no canal Local (vira balão sobre a cabeça + linha no chat). */
  | { type: "say"; text: string }
  /** DEV/teste: desbloqueia TODAS as peças do catálogo no guarda-roupa. */
  | { type: "debugGrantOutfit" }
  | { type: "stop" };

/**
 * Projeção da progressão do jogador no snapshot (DESIGN-EVOLUCAO.md §Camada
 * Sólida). Só dados serializáveis. Presente apenas na entidade do jogador.
 */
export interface PlayerProgressState {
  cls: PlayerClass;
  /** Total de ouro carregado (soma das pilhas no bolso — modelo Tibia jun/2026). */
  gold: number;
  /**
   * Capacidade de carga: peso atual carregado / máximo (cap). Derivado da Força
   * (`formulas.maxCarry`); `current` = soma do peso de equip + bolso + ouro.
   * Camada sólida (clara por contrato — a "decisão de mochila").
   */
  cap: { current: number; max: number };
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
  /**
   * Custo (em pontos livres) do PRÓXIMO ponto de cada atributo — custo
   * crescente por faixa (DESIGN-EVOLUCAO.md §Stats). Vem da sim
   * (`formulas.statPointCost`); o client só exibe, não computa a regra.
   */
  statPointCosts: Attributes;
}

/**
 * Status effect ativo numa entidade, projetado no snapshot (DESIGN-EVOLUCAO.md
 * §"Magias e Skills": "Visível no snapshot para o client futuro"). Só o que o
 * client precisa para mostrar ícone/contador — a mecânica vive na sim.
 */
export interface StatusEffectState {
  /**
   * queimadura (fogo, DoT) / lentidão / veneno (tipado p/ Rogue T2) /
   * "Bem Alimentado" (regen da comida) / "Saciado" (buff de stat de prato preparado).
   */
  kind: "burn" | "slow" | "poison" | "wellFed" | "meal";
  /** ms restantes até expirar. */
  remainingMs: number;
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
  /** Andar (z-level) — SISTEMA-ANDARES.md. O client renderiza só o andar do
   *  próprio jogador e filtra entidades por este z. Overworld = 0; subsolo < 0. */
  z: number;
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
  /**
   * Mecânica de mob em WINDUP (telegrafado — MECANICAS-DE-MOB.md). Presente só
   * enquanto o mob avisa um move; o client desenha o aviso (tile/animação) e a
   * janela de desvio. `resolveAt` = tempo lógico (ms) em que o efeito resolve.
   */
  telegraph?: { moveId: string; kind: string; resolveAt: number; tiles?: Vec2[] };
  /** Progressão — presente SOMENTE na entidade do jogador (undefined p/ mobs). */
  progress?: PlayerProgressState;
  /** Skills conhecidas — SOMENTE na entidade do jogador (undefined p/ mobs). */
  skills?: KnownSkillState[];
  /**
   * Arma equipada — SOMENTE na entidade do jogador (undefined p/ mobs). Apenas a
   * identidade (instanceId/templateId/nome); o ledger é oculto e não trafega.
   */
  weapon?: EquippedWeaponState;
  /** Equipamento nos 11 slots — SOMENTE o jogador dono (UI de equip). */
  equipment?: Partial<Record<EquipSlot, EquippedItemView>>;
  /** Containers ABERTOS deste jogador (mochila/cadáveres) — janelas da UI. */
  containers?: ContainerView[];
  /** Id do container do bolso/mochila equipada (Tab abre). SÓ o dono. */
  backpackContainerId?: number;
  /** Diálogo ativo — SOMENTE o jogador dono (presente enquanto conversa). */
  dialogue?: DialogueViewState;
  /** Loja ativa — SOMENTE o jogador dono (presente enquanto negocia). */
  shop?: ShopViewState;
  /** Receitas de cozinha + se dá pra fazer agora (COZINHA.md) — SÓ o dono. */
  recipes?: RecipeView[];
  /** Diário de quests — SOMENTE o jogador dono. */
  quests?: QuestJournalEntry[];
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
/** Canais do chat (MVP): fala local, mensagens de sistema, falas de NPC. */
export type ChatChannel = "local" | "system" | "npc";

export type SnapshotEvent =
  /**
   * Linha de chat (online-ready): canal + texto. `speakerId` (entidade que
   * falou) posiciona o balão sobre a cabeça (local/npc). `recipientId`, se
   * presente, é mensagem PRIVADA — só esse jogador a vê (loot/level/quest).
   */
  | { kind: "chat"; channel: ChatChannel; text: string; speakerId?: number; speakerName?: string; recipientId?: number }
  /** Dano aplicado — floating damage text no alvo + animação de ATAQUE no atacante. */
  | { kind: "damage"; targetId: number; attackerId: number; amount: number; pos: Vec2 }
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
  /** Cadáveres saqueáveis no chão (decai na sim). */
  corpses: CorpseView[];
  /** Baús do mundo (placement estático; estado de saque é per-jogador na sim). */
  chests: ChestView[];
  /** Eventos one-shot deste tick (não persistem). */
  events: SnapshotEvent[];
}

export type ServerMessage =
  | { type: "welcome"; playerId: number; map: MapData }
  | { type: "snapshot"; snap: Snapshot };

// ─────────────────────────── Itens / inventário ───────────────────────────

/** Os 11 slots de equipamento (DESIGN-ITENS.md — modelo Tibia, decidido). */
export type EquipSlot =
  | "helmet"
  | "armor"
  | "legs"
  | "boots"
  | "hand1"
  | "hand2"
  | "necklace"
  | "ring1"
  | "ring2"
  | "backpack"
  | "utility";

/** Referência de um lugar de item (origem/destino do drag & drop). */
export type ItemRef =
  /** Slot numérico dentro de um container aberto. */
  | { kind: "container"; containerId: number; slot: number }
  /** Slot de equipamento do próprio jogador. */
  | { kind: "equip"; slot: EquipSlot };

/** Item dentro de um container (projeção mínima p/ UI + tooltip). */
export interface ContainedItemView {
  slot: number;
  instanceId: number;
  templateId: string;
  name: string;
}

/** Pilha de ouro num container (cadáver ou bolso) — item empilhável (modelo Tibia). */
export interface GoldPileView {
  slot: number;
  amount: number;
}

/** Container aberto (mochila, cadáver…) — uma janela na UI por view. */
export interface ContainerView {
  containerId: number;
  name: string;
  capacity: number;
  items: ContainedItemView[];
  goldPiles: GoldPileView[];
}

/** Item equipado num slot (projeção). */
export interface EquippedItemView {
  instanceId: number;
  templateId: string;
  name: string;
}

/** Cadáver saqueável no chão (projeção de mundo — qualquer um vê). */
export interface CorpseView {
  id: number;
  pos: Vec2;
  /** Andar (z-level) do cadáver — client só mostra os do andar atual. */
  z: number;
  /** Espécie do morto (client escolhe o sprite do corpo). */
  species: string | null;
  name: string;
}

export interface ChestView {
  /** Id estável do baú (o client manda em `openChest`). */
  id: string;
  pos: Vec2;
  /** Andar (z-level) — client só mostra os do andar atual. */
  z: number;
  name: string;
}

/** Uma opção clicável do diálogo (a sim decide as opções; o client só mostra). */
export interface DialogueOptionView {
  id: string;
  label: string;
}

/**
 * Diálogo ativo do jogador — projeção da sim (texto + opções). O client
 * renderiza a janela; toda transição é comando → sim decide (zero regra no client).
 */
export interface DialogueViewState {
  npcId: number;
  npcName: string;
  text: string;
  options: DialogueOptionView[];
}

/** Uma linha do sortimento de loja projetada ao client (item + preço). */
export interface ShopEntryView {
  templateId: string;
  name: string;
  /** Preço em ouro: em `sells` = custo de compra; em `buys` = o que o NPC paga. */
  price: number;
}

/**
 * Loja ativa do jogador — projeção da sim. `sells` = o que o NPC vende ao
 * jogador; `buys` = o que ele COMPRA (o client cruza com o bolso para listar os
 * itens vendáveis que o jogador possui). Toda transação é comando → sim valida.
 */
export interface ShopViewState {
  npcId: number;
  npcName: string;
  sells: ShopEntryView[];
  buys: ShopEntryView[];
}

/** Uma receita de cozinha projetada (COZINHA.md): pode fazer agora? por quê não? */
export interface RecipeView {
  id: string;
  name: string;
  /** Tem todos os ingredientes E os gates (calor/água/quest) atendidos. */
  canCook: boolean;
  /** Lista dos inputs (nome × qtd) — a UI mostra o que a receita pede. */
  inputs: { name: string; qty: number }[];
  /** Motivo de não poder fazer (faltam ingredientes / sem calor / sem água). */
  reason?: string;
}

/**
 * Entrada do diário de quests (projeção). Contador SÓ nas diretas
 * (SISTEMA-QUESTS.md — decisão jun/2026); abertas/segredos nunca.
 */
export interface QuestJournalEntry {
  id: string;
  name: string;
  /** Texto da entrada no diário (as palavras do NPC / registro). */
  entry: string;
  /** Contador discreto ("4/8") — só quests diretas com etapa de caça. */
  counter?: { cur: number; max: number };
  completed: boolean;
}

/** Lado do cliente: envia comandos, recebe mensagens. */
export interface ClientTransport {
  send(cmd: ClientCommand): void;
  onMessage(cb: (msg: ServerMessage) => void): void;
}
