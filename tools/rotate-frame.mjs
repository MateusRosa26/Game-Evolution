#!/usr/bin/env node
// Rotaciona UM frame de criatura via /rotate (corrige direção que saiu torta).
// Uso: node tools/rotate-frame.mjs <species> <from_dir> <to_dir> [size]
//   ex: node tools/rotate-frame.mjs esqueleto south-east south 64
// Trava a paleta no canônico (color_image) e segue a referência de perto.
// Salva rot-<to_dir>-fixed.png no staging do mob.

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function balance() { const r = await fetch(`${BASE}/balance`, { headers: H }); return (await r.json())?.subscription?.generations ?? "?"; }

// --- PNG decode/encode + pad central p/ tamanho exato (rotate exige 128) ---
function dec(buf){let p=8,w=0,h=0,ct=6;const id=[];while(p<buf.length){const l=buf.readUInt32BE(p),t=buf.toString("ascii",p+4,p+8),da=buf.subarray(p+8,p+8+l);if(t==="IHDR"){w=da.readUInt32BE(0);h=da.readUInt32BE(4);ct=da[9];}else if(t==="IDAT")id.push(da);else if(t==="IEND")break;p+=12+l;}const raw=inflateSync(Buffer.concat(id)),ch=ct===6?4:3,st=w*ch,o=new Uint8ClampedArray(w*h*4),cu=new Uint8Array(st),pr=new Uint8Array(st);let rp=0;for(let y=0;y<h;y++){const f=raw[rp++];for(let x=0;x<st;x++){const rb=raw[rp++],a=x>=ch?cu[x-ch]:0,b=pr[x],c=x>=ch?pr[x-ch]:0;let v=rb;if(f===1)v=rb+a;else if(f===2)v=rb+b;else if(f===3)v=rb+((a+b)>>1);else if(f===4){const pp=a+b-c,pa=Math.abs(pp-a),pb=Math.abs(pp-b),pc=Math.abs(pp-c);v=rb+(pa<=pb&&pa<=pc?a:pb<=pc?b:c);}cu[x]=v&255;}for(let x=0;x<w;x++){const si=x*ch,di=(y*w+x)*4;o[di]=cu[si];o[di+1]=cu[si+1];o[di+2]=cu[si+2];o[di+3]=ch===4?cu[si+3]:255;}pr.set(cu);}return{w,h,d:o};}
function enc(w,h,d){const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;for(let x=0;x<w*4;x++)raw[y*(w*4+1)+1+x]=d[y*w*4+x];}const idat=deflateSync(raw),ct=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;ct[n]=c>>>0;}const crc=b=>{let c=0xFFFFFFFF;for(const x of b)c=ct[(c^x)&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0;};const chunk=(t,dt)=>{const len=Buffer.alloc(4);len.writeUInt32BE(dt.length);const tt=Buffer.from(t);const cc=Buffer.alloc(4);cc.writeUInt32BE(crc(Buffer.concat([tt,dt])));return Buffer.concat([len,tt,dt,cc]);};const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ih),chunk("IDAT",idat),chunk("IEND",Buffer.alloc(0))]);}
function padTo(buf,N){const im=dec(buf);if(im.w===N&&im.h===N)return buf;const o=new Uint8ClampedArray(N*N*4);const ox=Math.floor((N-im.w)/2),oy=Math.floor((N-im.h)/2);for(let y=0;y<im.h;y++)for(let x=0;x<im.w;x++){const si=(y*im.w+x)*4,di=((y+oy)*N+(x+ox))*4;if(x+ox<0||y+oy<0||x+ox>=N||y+oy>=N)continue;o[di]=im.d[si];o[di+1]=im.d[si+1];o[di+2]=im.d[si+2];o[di+3]=im.d[si+3];}return enc(N,N,o);}
const b64 = (p, pad) => { let buf = readFileSync(p); if (pad) buf = padTo(buf, pad); return { type: "base64", base64: buf.toString("base64"), format: "png" }; };
function collectImages(j) { const out = []; const visit = (v) => { if (!v) return; if (typeof v === "string" && v.length > 200 && /^[A-Za-z0-9+/=]+$/.test(v.slice(0, 50))) { out.push(v); return; } if (Array.isArray(v)) { v.forEach(visit); return; } if (typeof v === "object") { if (v.base64) { out.push(v.base64); return; } for (const k of Object.keys(v)) visit(v[k]); } }; visit(j); return [...new Set(out)]; }
function collectUrls(j) { const out = []; const visit = (v) => { if (!v) return; if (typeof v === "string" && /^https?:\/\//.test(v) && /\.png/i.test(v)) { out.push(v); return; } if (Array.isArray(v)) v.forEach(visit); else if (typeof v === "object") for (const k of Object.keys(v)) visit(v[k]); }; visit(j); return [...new Set(out)]; }

async function main() {
  // args: <species> <srcFrame> <fromDir> <toDir>  (srcFrame = qual rot-*.png ler; fromDir = direção declarada à API)
  const [sp, srcFrame, fromDir, toDir] = [process.argv[2] || "esqueleto", process.argv[3] || "south-east", process.argv[4] || process.argv[3] || "south-east", process.argv[5] || "south"];
  const N = 128; // /rotate exige input 128×128
  const dir = join("design", "pixellab-candidatos", "mobs", sp);
  const fromImg = join(dir, `rot-${srcFrame}.png`);
  const canon = join(dir, `aprovado-${sp}.png`);

  const before = await balance();
  console.log(`[balance] antes: ${before}`);
  const body = {
    from_image: b64(fromImg, N),
    from_direction: fromDir,
    to_direction: toDir,
    from_view: "low top-down",
    to_view: "low top-down",
    image_size: { width: N, height: N },
    image_guidance_scale: 4,
    color_image: b64(canon, N), // trava paleta do osso
    seed: 71,
  };
  console.log(`[rotate] ${fromDir} → ${toDir} (${N}px)…`);
  const r = await fetch(`${BASE}/rotate`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await r.text();
  if (!r.ok && r.status !== 202) { console.error(`[erro] HTTP ${r.status}: ${txt.slice(0, 800)}`); process.exit(1); }
  let j = JSON.parse(txt);
  let imgs = collectImages(j);
  const jobId = j.background_job_id || j.id;
  if (!imgs.length && jobId && j.status !== "completed") {
    for (let i = 1; i <= 40; i++) { await sleep(5000); const g = await fetch(`${BASE}/background-jobs/${jobId}`, { headers: H }); j = await g.json(); imgs = collectImages(j.last_response ?? j); process.stdout.write(`\r[poll ${i}] imgs=${imgs.length} status=${j.status}   `); if (imgs.length || j.status === "completed") break; if (j.status === "failed") { console.error("\nFALHOU", JSON.stringify(j).slice(0, 300)); break; } }
    console.log();
  }
  const out = join(dir, `rot-${toDir}-fixed.png`);
  if (imgs.length) { writeFileSync(out, Buffer.from(imgs[0], "base64")); console.log(`[salvo] ${out}`); }
  else { const urls = collectUrls(j.last_response ?? j); if (urls.length) { const buf = Buffer.from(await (await fetch(urls[0])).arrayBuffer()); writeFileSync(out, buf); console.log(`[salvo via url] ${out}`); } else { writeFileSync(join(dir, "_rotate_raw.json"), JSON.stringify(j, null, 1)); console.log(`[?] sem imagem — dump _rotate_raw.json`); } }
  const after = await balance();
  console.log(`[balance] depois: ${after} · [CUSTO] ${before - after}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
