#!/usr/bin/env python3
"""
Segmentação de personagem PixelLab em fatias de outfit (canais de tintura).

INVARIANTE (critério do criador): PARTIÇÃO TOTAL — todo pixel opaco pertence
a exatamente UMA fatia (head/torso/legs). Bota faz parte da fatia pernas;
capa, escudo e espada fazem parte da fatia torso. A auditoria falha se
head+torso+legs != total de pixels opacos.

Tintura: dentro de cada fatia, pixels de MATERIAL-ASSINATURA (outline preto,
capa vermelha, madeira/couro, lâmina, pele) são marcados como NÃO-tingíveis
(valor 60 no canal — o runtime tinge só >127). O resto tinge.

Saída: mask_{d}{i}.png com R/G/B = fatia (255 tingível / 60 assinatura).
Uso: python3 tools/segment-character.py
"""
from PIL import Image
import colorsys
from collections import deque
import sys

DIR = "src/client/assets/img/walk"

def pixel_info(px, x, y):
    r, g, b, a = px[x, y]
    if a < 60:
        return None
    mx, mn = max(r, g, b), min(r, g, b)
    sat = 0 if mx == 0 else (mx - mn) / mx
    h = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)[0] * 360
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    return dict(sat=sat, h=h, lum=lum)

def is_signature(i):
    """Materiais que NUNCA recebem tinta (mas pertencem a uma fatia).
    NOTA: lâmina NÃO entra aqui — claro+dessaturado é o MESMO material do
    domo do elmo; a lâmina é separada por GEOMETRIA (componente fino) depois.
    """
    if i["lum"] < 34:
        return True  # outline universal
    if (i["h"] >= 325 or i["h"] <= 20) and i["sat"] >= 0.15:
        return True  # capa/echarpe vermelha
    if 15 <= i["h"] <= 55 and i["sat"] >= 0.30:
        return True  # madeira/couro/pele
    return i["sat"] > 0.5

def blade_pixels(info):
    """Lâmina por GEOMETRIA: componentes claros-dessat FINOS (largura <=4)
    ou fora do topo (centroide abaixo de y=30). O domo do elmo é a massa
    LARGA no topo — fica tingível."""
    bright = {p for p, i in info.items() if i["lum"] >= 175 and i["sat"] <= 0.18}
    seen, blades = set(), set()
    for start in bright:
        if start in seen:
            continue
        comp, q = {start}, deque([start])
        seen.add(start)
        while q:
            x, y = q.popleft()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + dx, y + dy)
                if n in bright and n not in seen:
                    seen.add(n)
                    comp.add(n)
                    q.append(n)
        xs = [p[0] for p in comp]
        ys = [p[1] for p in comp]
        w = max(xs) - min(xs) + 1
        h = max(ys) - min(ys) + 1
        cy = sum(ys) / len(ys)
        # lâmina = ALONGADA (fina num eixo, comprida no outro) e fora do elmo;
        # specs pequenos/largos do domo NÃO são lâmina (tingem junto — viram
        # o brilho do ramp da cor escolhida).
        density = len(comp) / (w * h)
        # linha (reta OU diagonal): densidade baixa no bbox + comprida
        if max(w, h) >= 8 and density <= 0.45 and cy >= 28:
            blades |= comp
    return blades

def load_info(path):
    im = Image.open(path).convert("RGBA")
    px = im.load()
    info = {}
    for y in range(64):
        for x in range(64):
            i = pixel_info(px, x, y)
            if i:
                info[(x, y)] = i
    return im, info

def segment(path, y_cuts, blade_zone=frozenset()):
    im, info = load_info(path)
    W = H = 64

    blades = blade_pixels(info)
    # TRANSFERÊNCIA ENTRE FRAMES: a lâmina some atrás do escudo em alguns
    # frames (componente curto demais p/ o critério geométrico). A zona =
    # união dilatada das lâminas CONFIANTES dos 4 frames da direção; qualquer
    # componente claro-dessaturado dentro dela é lâmina (poses mudam <2px).
    if blade_zone:
        bright = {p for p, i in info.items() if i["lum"] >= 150 and i["sat"] <= 0.22}
        seen = set()
        for start in bright:
            if start in seen:
                continue
            comp, q = {start}, deque([start])
            seen.add(start)
            while q:
                x, y = q.popleft()
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    n = (x + dx, y + dy)
                    if n in bright and n not in seen:
                        seen.add(n)
                        comp.add(n)
                        q.append(n)
            if len(comp) >= 5 and len(comp & blade_zone) >= max(3, len(comp) // 3):
                blades |= comp
    # DILATAÇÃO da lâmina (1 passe, ortogonal, estreita): bordas médias do aço
    # da lâmina entram; armadura adjacente não.
    grow = set()
    for (x, y) in blades:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            i = info.get(n)
            if n not in blades and i and i["lum"] >= 140 and i["sat"] <= 0.22:
                grow.add(n)
    blades |= grow

    base_sig = {p for p in info if is_signature(info[p]) or p in blades}
    # LIMPEZA DE ANTIALIAS (1 passe, conservadora): pixel tingível IMERSO em
    # assinatura (5+ dos 8 vizinhos) é fronteira de material → assinatura.
    grow = set()
    for p in info:
        if p in base_sig:
            continue
        x, y = p
        n_sig = sum(
            1
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1))
            if (x + dx, y + dy) in base_sig
        )
        if n_sig >= 4:
            grow.add(p)
    base_sig |= grow

    # FRAGMENTOS DE LÂMINA: componente claro pequeno a <=2px de uma lâmina
    # detectada pertence a ela (lâminas partidas por 1 pixel médio).
    bright = {p for p, i in info.items() if i["lum"] >= 175 and i["sat"] <= 0.18}
    for p in list(bright - blades):
        x, y = p
        if any(
            (x + dx, y + dy) in blades
            for dx in range(-2, 3)
            for dy in range(-2, 3)
        ):
            blades.add(p)
            base_sig.add(p)

    # ILHAS TINGÍVEIS MINÚSCULAS (<=5 px) = ruído de fronteira → assinatura.
    # Mata os "pingos" coloridos no escudo/elmo de uma vez; regiões reais têm
    # dezenas/centenas de pixels.
    paintable = set(info) - base_sig
    seen_t = set()
    for start in paintable:
        if start in seen_t:
            continue
        comp, q = {start}, deque([start])
        seen_t.add(start)
        while q:
            x, y = q.popleft()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + dx, y + dy)
                if n in paintable and n not in seen_t:
                    seen_t.add(n)
                    comp.add(n)
                    q.append(n)
        if len(comp) <= 5:
            base_sig |= comp

    def sig(p):
        return p in base_sig

    def wall(p):
        return p not in info or sig(p)

    def flood(seed_area, y0=0, y1=64):
        """Flood limitado à faixa [y0,y1] — âncora de slot: garante que o
        núcleo do torso não engula as pernas (e vice-versa) em frames onde
        não há outline separando cintura/quadril. Consistência entre frames."""
        seen, q = set(), deque()
        for s in seed_area:
            if s in info and not wall(s) and y0 <= s[1] <= y1:
                q.append(s)
                seen.add(s)
        while q:
            x, y = q.popleft()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + dx, y + dy)
                if n in seen or n not in info or wall(n) or not (y0 <= n[1] <= y1):
                    continue
                seen.add(n)
                q.append(n)
        return seen

    # núcleos por flood (outlines/assinaturas como paredes + âncoras de Y)
    helm = flood([(x, y) for y in range(2, 16) for x in range(16, 48)], 0, 30)
    torso = flood([(x, y) for y in range(30, 44) for x in range(10, 30)], 26, 48) - helm
    legs = flood([(x, y) for y in range(50, 62) for x in range(14, 48)], 44, 64) - helm - torso

    # PARTIÇÃO TOTAL: núcleos de flood + BANDAS Y para órfãos. A adoção por
    # vizinhança (BFS) era instável entre frames — quando um núcleo morria
    # (sementes todas em assinatura), a fatia vizinha engolia tudo e a perna
    # piscava de cor ao andar. Bandas Y são idênticas em todos os frames de
    # uma direção → fronteiras 100% consistentes. Cortes medidos no histograma
    # de Y dos pixels tingíveis (aglomerados separados por filas de outline).
    head_max, torso_max = y_cuts
    owner = {}
    for s, ch in ((helm, 0), (torso, 1), (legs, 2)):
        for p in s:
            owner[p] = ch
    for p in info:
        if p not in owner:
            y = p[1]
            owner[p] = 0 if y <= head_max else (1 if y <= torso_max else 2)

    # SUAVIZAÇÃO DE FATIAS: ilha de fatia errada (pixel cuja fatia difere de
    # 5+ dos 8 vizinhos) adota a fatia majoritária — mata pingos de adoção.
    for _ in range(2):
        changes = {}
        for p, ch in owner.items():
            x, y = p
            votes = [0, 0, 0]
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, 1), (1, -1), (-1, -1)):
                o = owner.get((x + dx, y + dy))
                if o is not None:
                    votes[o] += 1
            best = max(range(3), key=lambda c: votes[c])
            if best != ch and votes[best] >= 5:
                changes[p] = best
        owner.update(changes)

    # AUDITORIA: partição total obrigatória
    assert len(owner) == len(info), f"{path}: órfãos {len(info) - len(owner)}"

    mask = Image.new("RGB", (W, H), (0, 0, 0))
    mp = mask.load()
    counts = [0, 0, 0]
    exempt = 0
    for (x, y), ch in owner.items():
        counts[ch] += 1
        val = 60 if sig((x, y)) else 255
        if val == 60:
            exempt += 1
        c = [0, 0, 0]
        c[ch] = val
        mp[x, y] = tuple(c)
    return im, mask, len(info), counts, exempt

# Cortes Y por direção (head_max, torso_max) — medidos no histograma de
# tingíveis: sul/norte: elmo até 18, saia até 45; leste: elmo 17, botas em 44.
Y_CUTS = {"s": (18, 45), "e": (17, 43), "n": (18, 45)}

def main():
    total_report = []
    for d in ["s", "e", "n"]:
        # passe 1: zona de lâmina da direção (união dilatada das confiantes)
        zone = set()
        for i in range(4):
            _, info = load_info(f"{DIR}/{d}{i}.png")
            zone |= blade_pixels(info)
        zone |= {
            (x + dx, y + dy)
            for (x, y) in zone
            for dx in range(-2, 3)
            for dy in range(-2, 3)
        }
        for i in range(4):
            path = f"{DIR}/{d}{i}.png"
            im, mask, opaque, counts, exempt = segment(path, Y_CUTS[d], frozenset(zone))
            mask.save(f"{DIR}/mask_{d}{i}.png")
            assert sum(counts) == opaque, f"{path}: partição {sum(counts)} != {opaque}"
            total_report.append(
                f"{d}{i}: opacos={opaque} head={counts[0]} torso={counts[1]} "
                f"legs={counts[2]} assinatura={exempt} ✓ partição total"
            )
    print("\n".join(total_report))

if __name__ == "__main__":
    sys.exit(main())
