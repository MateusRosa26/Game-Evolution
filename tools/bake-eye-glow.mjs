#!/usr/bin/env node
// Bake do brilho de órbita (undead) em TODOS os frames finais de um mob.
// Detecta as órbitas (pixels escuros na faixa dos olhos do crânio), separa
// esquerda/direita e pinta um glint colorido + halo additivo SÓ onde há órbita
// real (threshold por lado) → 2 olhos frontal, 1 perfil, 0 de costas.
// Não-destrutivo: grava <frame>-glow.png ao lado.
//
// Uso: node tools/bake-eye-glow.mjs <species> [intensity] [r] [g] [b]
//   intensity: low|medium|high (default medium) · cor default âmbar

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";

function dec(buf){let p=8,w=0,h=0,ct=6;const id=[];while(p<buf.length){const l=buf.readUInt32BE(p),t=buf.toString("ascii",p+4,p+8),da=buf.subarray(p+8,p+8+l);if(t==="IHDR"){w=da.readUInt32BE(0);h=da.readUInt32BE(4);ct=da[9];}else if(t==="IDAT")id.push(da);else if(t==="IEND")break;p+=12+l;}const raw=inflateSync(Buffer.concat(id)),ch=ct===6?4:3,st=w*ch,o=new Uint8ClampedArray(w*h*4),cu=new Uint8Array(st),pr=new Uint8Array(st);let rp=0;for(let y=0;y<h;y++){const f=raw[rp++];for(let x=0;x<st;x++){const rb=raw[rp++],a=x>=ch?cu[x-ch]:0,b=pr[x],c=x>=ch?pr[x-ch]:0;let v=rb;if(f===1)v=rb+a;else if(f===2)v=rb+b;else if(f===3)v=rb+((a+b)>>1);else if(f===4){const pp=a+b-c,pa=Math.abs(pp-a),pb=Math.abs(pp-b),pc=Math.abs(pp-c);v=rb+(pa<=pb&&pa<=pc?a:pb<=pc?b:c);}cu[x]=v&255;}for(let x=0;x<w;x++){const si=x*ch,di=(y*w+x)*4;o[di]=cu[si];o[di+1]=cu[si+1];o[di+2]=cu[si+2];o[di+3]=ch===4?cu[si+3]:255;}pr.set(cu);}return{w,h,d:o};}
function png(w,h,d){const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;for(let x=0;x<w*4;x++)raw[y*(w*4+1)+1+x]=d[y*w*4+x];}const idat=deflateSync(raw),ct=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;ct[n]=c>>>0;}const crc=b=>{let c=0xFFFFFFFF;for(const x of b)c=ct[(c^x)&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0;};const chunk=(t,dt)=>{const len=Buffer.alloc(4);len.writeUInt32BE(dt.length);const tt=Buffer.from(t);const cc=Buffer.alloc(4);cc.writeUInt32BE(crc(Buffer.concat([tt,dt])));return Buffer.concat([len,tt,dt,cc]);};const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ih),chunk("IDAT",idat),chunk("IEND",Buffer.alloc(0))]);}

const LEVELS = { low: { halo: 0.5, rad: 2.0, core: [255, 170, 70] }, medium: { halo: 0.85, rad: 2.6, core: [255, 188, 92] }, high: { halo: 1.1, rad: 3.2, core: [255, 205, 120] } };

// posições dos olhos por direção: frações relativas à largura/altura do crânio.
// dx = offset horizontal a partir do centro do crânio (× largura do crânio); dy não usado (linha fixa).
const EYE_LAYOUT = {
  south: [-0.20, 0.20], "south-east": [-0.05, 0.28], "south-west": [-0.28, 0.05],
  east: [0.16], west: [-0.16],
  "north-east": [0.30], "north-west": [-0.30],
  north: [], // costas: sem olhos
};

function bake(im, lv, dir) {
  const { w, h, d } = im;
  let minx = w, miny = h, maxx = 0, maxy = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 20) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
  if (maxx < minx) return 0;
  const bh = maxy - miny;
  // linha dos olhos: ~16% abaixo do topo da figura (dentro da órbita)
  const eyeRow = Math.round(miny + bh * 0.16);
  // largura do crânio NESSA linha (span opaco) → centro e largura
  let sl = w, sr = 0;
  for (let x = minx; x <= maxx; x++) if (d[(eyeRow * w + x) * 4 + 3] > 60) { if (x < sl) sl = x; if (x > sr) sr = x; }
  if (sr < sl) return 0;
  const skullCx = (sl + sr) / 2, skullW = sr - sl;
  const offs = EYE_LAYOUT[dir] ?? EYE_LAYOUT.south;
  const eyes = offs.map((f) => [Math.round(skullCx + f * skullW), eyeRow]);
  const lit = (x, y, k) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const i = (y * w + x) * 4; if (d[i + 3] < 30) return; d[i] = Math.min(255, d[i] + lv.core[0] * k); d[i + 1] = Math.min(255, d[i + 1] + lv.core[1] * k); d[i + 2] = Math.min(255, d[i + 2] + lv.core[2] * k); };
  for (const [ex, ey] of eyes) {
    const i = (ey * w + ex) * 4; d[i] = lv.core[0]; d[i + 1] = lv.core[1]; d[i + 2] = lv.core[2]; d[i + 3] = 255;
    for (let dy = -Math.ceil(lv.rad); dy <= Math.ceil(lv.rad); dy++) for (let dx = -Math.ceil(lv.rad); dx <= Math.ceil(lv.rad); dx++) {
      if (!dx && !dy) continue; const dist = Math.hypot(dx, dy); if (dist > lv.rad) continue; lit(ex + dx, ey + dy, Math.max(0, (1 - dist / lv.rad)) * lv.halo);
    }
  }
  return eyes.length;
}

const sp = process.argv[2] || "esqueleto";
const lvName = process.argv[3] || "medium";
const lv = LEVELS[lvName] || LEVELS.medium;
if (process.argv[4]) lv.core = [Number(process.argv[4]), Number(process.argv[5]), Number(process.argv[6])];
const dir = join("design", "pixellab-candidatos", "mobs", sp);
// frames cardinais que integramos: idles rot-{south,north,east,west} + walk-{south,north,east}-*
const want = (f) => /^rot-(south|north|east|west)\.png$/.test(f) || /^walk-(south|north|east)-\d+\.png$/.test(f);
const files = readdirSync(dir).filter(want);
let total = 0;
for (const f of files) {
  const m = f.match(/^rot-([a-z-]+)\.png$/) || f.match(/^walk-([a-z]+)-\d+\.png$/);
  const fdir = m ? m[1] : "south";
  const im = dec(readFileSync(join(dir, f)));
  const n = bake(im, lv, fdir);
  writeFileSync(join(dir, f.replace(/\.png$/, "-glow.png")), png(im.w, im.h, im.d));
  total++;
  process.stdout.write(`${f}[${fdir}]:${n}  `);
}
console.log(`\n[ok] ${total} frames com glow (${lvName}, cor ${lv.core.join(",")}) → *-glow.png`);
