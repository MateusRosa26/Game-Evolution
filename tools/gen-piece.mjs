#!/usr/bin/env node
// Gera uma PEÇA de paperdoll (greyscale, dyeável) via /inpaint sobre o corpo base.
// A peça = conteúdo da ZONA no resultado do inpaint, alinhada pelo MESMO transform
// do corpo (union bbox + base por frame + escala 144) → overlay perfeito + tingível.
//
// Uso:
//   node tools/gen-piece.mjs <bodyId> <pieceName> <slot> [--preview] [--dirs s,e,n]
//   preview (grátis): node tools/gen-piece.mjs homem-jovem peitoral-aco torso --preview
//   gerar (inpaint=0 gens): node tools/gen-piece.mjs homem-jovem peitoral-aco torso

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const SRC = "/mnt/c/Users/mateu/OneDrive/Desktop/Rpg/design/pixellab-candidatos/chars/base-avatar";
const PIECES = join(homedir(), "rpg-worktrees/remaster/src/client/assets/img/chars/knight/pieces");
const PREVIEW_DIR = "/mnt/c/Users/mateu/OneDrive/Desktop/Rpg/design/pixellab-candidatos/chars/pieces-preview";

// zona por slot, em FRAÇÃO da figura (bbox do corpo): {x0,x1,y0,y1} 0..1 dentro da bbox
const ZONE = {
  head: { x0: 0.18, x1: 0.82, y0: 0.0, y1: 0.26 },
  torso: { x0: 0.10, x1: 0.90, y0: 0.20, y1: 0.56 },
  legs: { x0: 0.14, x1: 0.86, y0: 0.58, y1: 1.0 },
};
const PROMPT = {
  torso: "greyscale steel plate cuirass breastplate armor over the torso and shoulders, riveted iron plates, monochrome grey steel, clean pixel art, black outline",
  head: "greyscale steel open nasal helmet over the head, monochrome grey iron, clean pixel art, black outline",
  legs: "greyscale steel plate leg armor greaves and tassets over the legs, monochrome grey iron, clean pixel art, black outline",
};

// ---------- codec ----------
function decodePng(buf){let pos=8,w=0,h=0,ct=6;const idat=[];while(pos<buf.length){const len=buf.readUInt32BE(pos),type=buf.toString("ascii",pos+4,pos+8);const data=buf.subarray(pos+8,pos+8+len);if(type==="IHDR"){w=data.readUInt32BE(0);h=data.readUInt32BE(4);ct=data[9];}else if(type==="IDAT")idat.push(data);else if(type==="IEND")break;pos+=12+len;}const raw=inflateSync(Buffer.concat(idat)),ch=ct===6?4:3,stride=w*ch;const out=new Uint8ClampedArray(w*h*4),cur=new Uint8Array(stride),prev=new Uint8Array(stride);let rp=0;for(let y=0;y<h;y++){const f=raw[rp++];for(let x=0;x<stride;x++){const rb=raw[rp++],a=x>=ch?cur[x-ch]:0,b=prev[x],c=x>=ch?prev[x-ch]:0;let v=rb;if(f===1)v=rb+a;else if(f===2)v=rb+b;else if(f===3)v=rb+((a+b)>>1);else if(f===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);v=rb+(pa<=pb&&pa<=pc?a:pb<=pc?b:c);}cur[x]=v&255;}for(let x=0;x<w;x++){const si=x*ch,di=(y*w+x)*4;out[di]=cur[si];out[di+1]=cur[si+1];out[di+2]=cur[si+2];out[di+3]=ch===4?cur[si+3]:255;}prev.set(cur);}return{w,h,d:out};}
function png(w,h,d){const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;for(let x=0;x<w*4;x++)raw[y*(w*4+1)+1+x]=d[y*w*4+x];}const idat=deflateSync(raw),ct=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;ct[n]=c>>>0;}const crc=(b)=>{let c=0xFFFFFFFF;for(const x of b)c=ct[(c^x)&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0;};const chunk=(t,dt)=>{const len=Buffer.alloc(4);len.writeUInt32BE(dt.length);const tt=Buffer.from(t);const cc=Buffer.alloc(4);cc.writeUInt32BE(crc(Buffer.concat([tt,dt])));return Buffer.concat([len,tt,dt,cc]);};const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ihdr),chunk("IDAT",idat),chunk("IEND",Buffer.alloc(0))]);}
function scaleNearest(img,dw,dh){const o=new Uint8ClampedArray(dw*dh*4);for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const sx=Math.min(img.w-1,Math.floor((x*img.w)/dw)),sy=Math.min(img.h-1,Math.floor((y*img.h)/dh));const s=(sy*img.w+sx)*4,di=(y*dw+x)*4;o[di]=img.d[s];o[di+1]=img.d[s+1];o[di+2]=img.d[s+2];o[di+3]=img.d[s+3];}return{w:dw,h:dh,d:o};}
function crop(img,x0,y0,x1,y1){const w=x1-x0+1,h=y1-y0+1,o=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const s=((y0+y)*img.w+(x0+x))*4,di=(y*w+x)*4;o[di]=img.d[s];o[di+1]=img.d[s+1];o[di+2]=img.d[s+2];o[di+3]=img.d[s+3];}return{w,h,d:o};}

const lowestRow=(img)=>{for(let y=img.h-1;y>=0;y--)for(let x=0;x<img.w;x++)if(img.d[(y*img.w+x)*4+3]>8)return y;return img.h-1;};
async function balance(){const r=await fetch(`${BASE}/balance`,{headers:H});return(await r.json())?.subscription?.generations??"?";}

const ARGS = process.argv.slice(2);
const bodyId = ARGS[0] || "homem-jovem";
const pieceName = ARGS[1] || "peitoral-aco";
const slot = ARGS[2] || "torso";
const preview = ARGS.includes("--preview");
const dirs = (ARGS.find(a=>a.startsWith("--dirs"))?.split("=")[1] || "south,east,north").split(",");
const dirShort = { south: "s", east: "e", north: "n" };

// carrega TODOS os 12 frames p/ a union bbox (IGUAL ao place-avatar — alinhamento da peça!)
const frames = {};
let gx0=1e9,gy0=1e9,gx1=-1,gy1=-1;
for (const d of ["south","east","north"]) {
  frames[d] = [];
  for (let f=0; f<4; f++) {
    const img = decodePng(readFileSync(join(SRC,`rotations-${bodyId}`,`walk-${d}-0${f}.png`)));
    frames[d].push(img);
    for (let y=0;y<img.h;y++) for (let x=0;x<img.w;x++) if (img.d[(y*img.w+x)*4+3]>16){if(x<gx0)gx0=x;if(x>gx1)gx1=x;if(y<gy0)gy0=y;if(y>gy1)gy1=y;}
  }
}
const TARGET_H=144, factor=TARGET_H/(gy1-gy0+1);
const bw=gx1-gx0+1, bh=gy1-gy0+1;
const z = ZONE[slot];
const zx0=Math.round(gx0+z.x0*bw), zx1=Math.round(gx0+z.x1*bw), zy0=Math.round(gy0+z.y0*bh), zy1=Math.round(gy0+z.y1*bh);

// máscara = SILHUETA do corpo (alpha) dentro da faixa Y do slot → a peça segue a
// forma do corpo, não um retângulo. Dilatação ±2px p/ a peça cobrir a borda/ombreira.
function maskBuf(img){
  const w=img.w,h=img.h,m=new Uint8ClampedArray(w*h*4);
  for(let i=0;i<w*h;i++)m[i*4+3]=255; // alpha 255, rgb 0 (preto = preserva)
  for(let y=Math.max(0,zy0);y<=zy1&&y<h;y++)for(let x=0;x<w;x++){
    let on=false;for(let dx=-2;dx<=2;dx++){const xx=x+dx;if(xx>=0&&xx<w&&img.d[(y*w+xx)*4+3]>40){on=true;break;}}
    if(on){const di=(y*w+x)*4;m[di]=m[di+1]=m[di+2]=255;}
  }
  return {w,h,d:m};
}

const mkImg=(im)=>({image:{type:"base64",base64:Buffer.from(png(im.w,im.h,im.d)).toString("base64"),format:"png"},size:{width:im.w,height:im.h}});
async function inpaintPiece(img){
  const mask=maskBuf(img);
  const body={
    description:PROMPT[slot],
    inpainting_image:mkImg(img), mask_image:mkImg(mask),
    no_background:true, crop_to_mask:false, seed:7,
  };
  const r=await fetch(`${BASE}/inpaint-v3`,{method:"POST",headers:H,body:JSON.stringify(body)});
  const txt=await r.text(); if(!r.ok)throw new Error(`HTTP ${r.status}: ${txt.slice(0,250)}`);
  let j=JSON.parse(txt);
  let b64=j?.image?.base64 ?? j?.images?.[0]?.base64 ?? j?.image?.image?.base64;
  if(!b64 && j?.background_job_id){
    for(let i=0;i<40;i++){await new Promise(s=>setTimeout(s,4000));const g=await(await fetch(`${BASE}/background-jobs/${j.background_job_id}`,{headers:H})).json();if(["completed","success"].includes(g.status)){j=g.last_response??g;break;}if(g.status==="failed")throw new Error("inpaint-v3 failed: "+JSON.stringify(g).slice(0,200));}
    b64=j?.image?.base64 ?? j?.images?.[0]?.base64 ?? j?.image?.image?.base64;
  }
  if(!b64)throw new Error("sem image v3: "+txt.slice(0,250));
  return decodePng(Buffer.from(b64,"base64"));
}

async function main(){
  if (preview){
    mkdirSync(PREVIEW_DIR,{recursive:true});
    const img=frames[dirs[0]][0];
    const mask=maskBuf(img);
    const ov={w:img.w,h:img.h,d:new Uint8ClampedArray(img.d)};
    for(let i=0;i<img.w*img.h;i++){if(mask.d[i*4]>127){ov.d[i*4]=255;ov.d[i*4+1]=(ov.d[i*4+1]*0.3)|0;ov.d[i*4+2]=(ov.d[i*4+2]*0.3)|0;ov.d[i*4+3]=255;}}
    const big=scaleNearest(crop(ov,gx0,gy0,gx1,gy1),Math.round(bw*1.4),Math.round(bh*1.4));
    writeFileSync(join(PREVIEW_DIR,`_zone-${slot}.png`),png(big.w,big.h,big.d));
    console.log(`[preview] zona ${slot} (vermelho) → ${PREVIEW_DIR}/_zone-${slot}.png · bbox corpo ${bw}x${bh} · zona [${zx0},${zy0}]-[${zx1},${zy1}]`);
    return;
  }
  const before=await balance();
  const outDir=join(PIECES,pieceName); mkdirSync(outDir,{recursive:true});
  for (const d of dirs){
    for (let f=0; f<4; f++){
      const img=frames[d][f];
      const res=await inpaintPiece(img); // mesma dim do input
      // peça = conteúdo da MÁSCARA (silhueta) no resultado, transparente fora
      const mask=maskBuf(img);
      const piece={w:img.w,h:img.h,d:new Uint8ClampedArray(img.w*img.h*4)};
      for(let i=0;i<img.w*img.h;i++){if(mask.d[i*4]>127){piece.d[i*4]=res.d[i*4];piece.d[i*4+1]=res.d[i*4+1];piece.d[i*4+2]=res.d[i*4+2];piece.d[i*4+3]=res.d[i*4+3];}}
      // MESMO transform do corpo: crop union bbox X+topo, base por frame, escala factor
      const fb=lowestRow(img);
      const c=crop(piece,gx0,gy0,gx1,fb);
      const s=scaleNearest(c,Math.round(c.w*factor),Math.round(c.h*factor));
      writeFileSync(join(outDir,`${dirShort[d]}${f}.png`),png(s.w,s.h,s.d));
    }
    console.log(`[ok] ${d}: 4 frames`);
  }
  const after=await balance();
  console.log(`[fim] peça "${pieceName}" → ${outDir} · custo ${before==="?"?"?":before-after} (esperado 0)`);
}
main().catch(e=>{console.error("FATAL:",e);process.exit(1);});
