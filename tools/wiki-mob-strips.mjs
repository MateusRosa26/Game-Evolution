#!/usr/bin/env node
// Monta tiras horizontais (sprite-strip) walk+atk SUL de cada mob → wiki/sprites/,
// pra wiki animar via CSS steps(). Lê os frames 64px integrados em
// src/client/assets/img/mobs/<sp>/ (naming do loader: s0,s1,… e atk_s0,…). Se um
// frame estiver ilegível (placeholder do OneDrive) cai pro git HEAD e depois pro
// index. Imprime o manifest {species:{walk,atk}} pra colar em wiki/db.js (MOB_SPRITES).
//
// Uso: node tools/wiki-mob-strips.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";

function dec(buf){let p=8,w=0,h=0,ct=6;const id=[];while(p<buf.length){const l=buf.readUInt32BE(p),t=buf.toString("ascii",p+4,p+8),da=buf.subarray(p+8,p+8+l);if(t==="IHDR"){w=da.readUInt32BE(0);h=da.readUInt32BE(4);ct=da[9];}else if(t==="IDAT")id.push(da);else if(t==="IEND")break;p+=12+l;}const raw=inflateSync(Buffer.concat(id)),ch=ct===6?4:3,st=w*ch,o=new Uint8ClampedArray(w*h*4),cu=new Uint8Array(st),pr=new Uint8Array(st);let rp=0;for(let y=0;y<h;y++){const f=raw[rp++];for(let x=0;x<st;x++){const rb=raw[rp++],a=x>=ch?cu[x-ch]:0,b=pr[x],c=x>=ch?pr[x-ch]:0;let v=rb;if(f===1)v=rb+a;else if(f===2)v=rb+b;else if(f===3)v=rb+((a+b)>>1);else if(f===4){const pp=a+b-c,pa=Math.abs(pp-a),pb=Math.abs(pp-b),pc=Math.abs(pp-c);v=rb+(pa<=pb&&pa<=pc?a:pb<=pc?b:c);}cu[x]=v&255;}for(let x=0;x<w;x++){const si=x*ch,di=(y*w+x)*4;o[di]=cu[si];o[di+1]=cu[si+1];o[di+2]=cu[si+2];o[di+3]=ch===4?cu[si+3]:255;}pr.set(cu);}return{w,h,d:o};}
function png(w,h,d){const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;for(let x=0;x<w*4;x++)raw[y*(w*4+1)+1+x]=d[y*w*4+x];}const idat=deflateSync(raw),ct=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;ct[n]=c>>>0;}const crc=b=>{let c=0xFFFFFFFF;for(const x of b)c=ct[(c^x)&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0;};const chunk=(t,dt)=>{const len=Buffer.alloc(4);len.writeUInt32BE(dt.length);const tt=Buffer.from(t);const cc=Buffer.alloc(4);cc.writeUInt32BE(crc(Buffer.concat([tt,dt])));return Buffer.concat([len,tt,dt,cc]);};const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ih),chunk("IDAT",idat),chunk("IEND",Buffer.alloc(0))]);}

// Mobs com sprite INTEGRADO na main hoje (src/client/assets/img/mobs/<sp>/).
// `esqueleto` está no bestiário mas ainda SEM arte integrada → fica de fora até
// passar pelo integrate-mob; o gerador o ignora sozinho se a pasta não existir.
const MOBS = ["rato", "goblin", "lobo", "morcego", "javali"];
const BASE = "src/client/assets/img/mobs";

function readFrame(species, file) {
  const path = `${BASE}/${species}/${file}`;
  try { const b = readFileSync(path); if (b.length > 100) return b; throw 0; } catch {}
  for (const ref of [`HEAD:${path}`, `:${path}`]) { // HEAD, depois index (outro agente pode ter só staged)
    try { const b = execSync(`git show ${ref}`, { maxBuffer: 32 * 1024 * 1024, stdio: ["pipe", "pipe", "ignore"] }); if (b.length > 100) return b; } catch {}
  }
  return null;
}
// junta s0,s1,... (ou atk_s0,...) enquanto existirem → tira horizontal
function strip(species, prefix) {
  const ims = [];
  for (let i = 0; i < 16; i++) { const b = readFrame(species, `${prefix}s${i}.png`); if (!b) break; ims.push(dec(b)); }
  if (!ims.length) return 0;
  const fw = ims[0].w, fh = ims[0].h, W = fw * ims.length;
  const out = new Uint8ClampedArray(W * fh * 4);
  ims.forEach((im, n) => { const ox = n * fw; for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const si = (y * im.w + x) * 4, di = (y * W + (ox + x)) * 4; out[di] = im.d[si]; out[di + 1] = im.d[si + 1]; out[di + 2] = im.d[si + 2]; out[di + 3] = im.d[si + 3]; } });
  writeFileSync(join("wiki", "sprites", `${species}-${prefix ? "atk" : "walk"}.png`), png(W, fh, out));
  return ims.length;
}

mkdirSync(join("wiki", "sprites"), { recursive: true });
const manifest = {};
for (const sp of MOBS) {
  const walk = strip(sp, ""), atk = strip(sp, "atk_");
  if (walk || atk) manifest[sp] = { walk, atk };
  console.log(`${sp}: walk=${walk} atk=${atk}`);
}
writeFileSync(join("wiki", "sprites", "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("\nMOB_SPRITES =", JSON.stringify(manifest));
