# Modelo de dano — HÍBRIDO quadrático-suave

**Data:** 2026-06-10
**Decisão (criador):** trocar o dano físico de **aditivo** (`arma + Str`) para **híbrido multiplicativo**: `dano = base_da_arma × (1 + atributo×k)`. A arma é o piso (loot importa); o atributo amplifica (sinergia gear×stat, feel Tibia). `k` pequeno → crescimento quadrático SUAVE, não explode.

## Implementação
- `formulas.physicalDamage = floor(base × (1 + attr×k))`. `STR_DAMAGE_K = DEX_DAMAGE_K = 0,05`.
- **Bases de arma re-escaladas ×~1,67** p/ preservar o T1 (knight/espada = 14): Espada Curta 6→10, Cega 4→7, Machado 8→13, Clava 6→10, Adaga 5→8, Punhos 2→3. Cooldowns inalterados.
- Buff de comida "+N na base" agora passa pelo multiplicador (recalcula `physicalDamage(attrs, base+N)`) → escala com o personagem.

## Verificação (zero ripple no M1)
- Knight espada T1 = **14** (idêntico ao aditivo) → rato em **2 golpes**, TTK preservado. Nenhuma recalibração de rato/XP necessária.
- Curva: Str8/arma10 = 14; Str24/arma18 = 39; Str45/arma30 = **97** (vs aditivo 51). Mais íngreme, mas longe da explosão do `arma×Str` puro (240). Multiplicador de Str: 1,4× (T1) → 3,25× (Str45).
- Buff +1 base: +1 no T1, +3 no late (escala ✓).

## ⚠️ Implicações a decidir (✏️ criador/Balancista)
1. **Skills físicas herdaram o modelo** (Golpe Forte/Apunhalar usam `physicalDamage`): `def.power` agora é +N na base, multiplicado. Os `power` foram calibrados no aditivo → **precisam de re-régua** sob o híbrido (já eram ✏️/T2).
2. ~~Magia/sagrado aditivos~~ **RESOLVIDO (criador):** unificados no híbrido, mas com
   **k de caster MENOR (0,02 vs martial 0,05)** e **base ALTA** (Bola 15, Lança 13,
   Luz 14 — todas > arma 10). Resultado: caster = dano front-loaded e ESTÁVEL (o
   poder vem das magias/base, não de empilhar Int/Esp); martial = base-baixa-mult-
   alto (recompensa investimento). Contraste medido (mesma base, só atributo): attr8
   → Knight 14 / Mago 17 / Priest 16; attr45 → 32 / 28 / 26. Caster compensa com
   alcance/AoE/burn. CURA segue aditiva (não é dano).
3. **k é placeholder (0,05):** a régua fina sai com a **curva de HP dos mobs por tier** — o dano cresce ~7× T1→T5 (14→97); o HP dos mobs precisa acompanhar pra TTK ficar estável. Bateria do regen core (#11) / T2.
4. **Re-régua das outras armas:** as bases foram escaladas uniformemente; o dano por classe/arma (machado, adaga p/ rogue) shiftou levemente — afinar no catálogo quando a bateria de armas rodar.

## Veredito
Modelo trocado com sucesso e **sem quebrar o T1**. A migração via re-escala de base foi limpa. Os números (k, power das skills, bases das outras armas, curva de HP) seguem ✏️ — a estrutura está certa.
