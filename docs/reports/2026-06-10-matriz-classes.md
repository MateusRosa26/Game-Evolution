# Matriz de classes — sustain/damage × AD/AP

**Data:** 2026-06-10
**Decisão (criador):** as 4 classes formam uma matriz 2×2 limpa.

| | **Sustain** (durável, dano menor) | **Damage** (frágil, dano maior) |
|---|---|---|
| **AD** (físico — Str/Dex) | **Knight** | **Rogue** |
| **AP** (mágico — Int/Esp) | **Priest** | **Mage** |

- **Eixo sustain↔damage:** define o tradeoff sobrevivência↔dano.
- **Eixo AD↔AP:** define o tipo (físico steady vs mágico burst+mana) — o caster se equilibra pela ECONOMIA DE MANA (downtime), o martial pelo HP/sobrevivência.

## Mudanças estruturais aplicadas
1. **k de dano SIMÉTRICO** (Str/Dex/Int/Esp todos 0,05): gap de dano estável, não inverte (o k assimétrico fazia o knight ultrapassar o mago no late — furo, já que o knight também tanka).
2. **`hpPerLevel` re-tier p/ bater a matriz** (sustain durável > damage frágil):
   Knight 15 > **Priest 7→12** > **Rogue 9→7** > Mage 5. (Antes rogue>priest = carry mais durável que sustain, invertido.)
3. Bases de magia altas (Bola 15, Luz 14 > arma 10) — a vantagem do caster vem da base.

## Bateria de paridade (k simétrico + HP re-tier)

| classe (papel) | DPS burst (∞ mana) | DPS sustent. | HP L10 |
|---|---|---|---|
| Knight (AD sustain) | 12,7 | 12,7 | **249** |
| Priest (AP sustain) | 18,1 | 7,7 | **198** |
| Rogue (AD damage) | 15,9 | 15,9 | 161 |
| Mage (AP damage) | 25,4 | 10,3 | 135 |

- **Durabilidade: Knight > Priest > Rogue > Mage** ✓ (sustain durável, damage frágil).
- **Dano por tipo:** Rogue > Knight (AD), Mage > Priest (AP — em burst) ✓.
- **AD vs AP flavor:** AD = DPS steady (sem recurso); AP = burst alto + sustentado limitado por MANA (mage 25,4 burst → 10,3 sustentado). O mana é o downtime do caster.

## Pendências ✏️ (fine-tuning — #11 / T2)
1. **Economia de mana do caster:** o sustentado do mage/priest é mana-bound. A paridade de THROUGHPUT (XP/h) entre AD (steady) e AP (burst+mana) sai da régua de **regen de mana saciado + custo das magias** (#11). Hoje o mage sustentado (10,3) fica abaixo do rogue (15,9) — esperado, mas o gap fino depende disso.
2. **Priest sustentado baixo (7,7):** é AP-sustain (cura + durável agora), então dano menor é ok — mas confirmar o equilíbrio com o valor da cura (`curar_ferimentos`).
3. **Rogue = carry AD steady forte** (15,9 sem mana, fragilizado p/ 161 HP): o glass-cannon troca durabilidade por DPS. Re-checar XP/h vs as outras na bateria de throughput.
4. **Bases/k finos** + **curva de HP dos mobs por tier** fecham os números absolutos (#11).

## Veredito
A ESTRUTURA da matriz está realizada: durabilidade e dano agora seguem sustain↔damage × AD↔AP. Os números absolutos (mana, dano do priest, ratios de XP/h) são fine-tuning do #11, que precisa do regen/HP base e da curva de mobs.
