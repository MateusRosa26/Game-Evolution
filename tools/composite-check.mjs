#!/usr/bin/env node
// Compõe peça(s) sobre o corpo e salva um preview @3x p/ conferir encaixe.
// Uso: node tools/composite-check.mjs <bodyPng> <piecePng> [piecePng2...]
import { readFileSync, writeFileSync } from "node:fs";
import { inflateSync, deflateSync } from "node:zlib";
function decodePng(buf){let pos=8,w=0,h=0,ct=6;const idat=[];while(pos<buf.length){const len=buf.readUInt32BE(pos),type=buf.toString("ascii",pos+4,pos+8);const data=buf.subarray(pos+8,pos+8+len);if(type==="IHDR"){w=data.readUInt32BE(0);h=data.readUInt32BE(4);ct=data[9];}else if(type==="IDAT")idat.push(data);else if(type==="IEND")break;pos+=12+len;}const raw=inflateSync(Buffer.concat(idat)),ch=ct===6?4:3,stride=w*ch;const out=new Uint8ClampedArray(w*h*4),cur=new Uint8Array(stride),prev=new Uint8Array(stride);let rp=0;for(let y=0;y<h;y++){const f=raw[rp++];for(let x=0;x<stride;x++){const rb=raw[rp++],a=x>=ch?cur[x-ch]:0,b=prev[x],c=x>=ch?prev[x-ch]:0;let v=rb;if(f===1)v=rb+a;else if(f===2)v=rb+b;else if(f===3)v=rb+((a+b)>>1);else if(f===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);v=rb+(pa<=pb&&pa<=pc?a:pb<=pc?b:c);}cur[x]=v&255;}for(let x=0;x<w;x++){const si=x*ch,di=(y*w+x)*4;out[di]=cur[si];out[di+1]=cur[si+1];out[di+2]=cur[si+2];out[di+3]=ch===4?cur[si+3]:255;}prev.set(cur);}return{w,h,d:out};}
function png(w,h,d){const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;for(let x=0;x<w*4;x++)raw[y*(w*4+1)+1+x]=d[y*w*4+x];}const idat=deflateSync(raw),ct=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;ct[n]=c>>>0;}const crc=(b)=>{let c=0xFFFFFFFF;for(const x of b)c=ct[(c^x)&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0;};const chunk=(t,dt)=>{const len=Buffer.alloc(4);len.writeUInt32BE(dt.length);const tt=Buffer.from(t);const cc=Buffer.alloc(4);cc.writeUInt32BE(crc(Buffer.concat([tt,dt])));return Buffer.concat([len,tt,dt,cc]);};const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ihdr),chunk("IDAT",idat),chunk("IEND",Buffer.alloc(0))]);}

const [bodyPath, ...pieces] = process.argv.slice(2);
const body = decodePng(readFileSync(bodyPath));
const out = new Uint8ClampedArray(body.d); // cópia do corpo
for (const pp of pieces) {
  const p = decodePng(readFileSync(pp));
  for (let i = 0; i < Math.min(out.length, p.d.length); i += 4) {
    if (p.d[i+3] > 40) { out[i]=p.d[i]; out[i+1]=p.d[i+1]; out[i+2]=p.d[i+2]; out[i+3]=p.d[i+3]; }
  }
}
// upscale 3x nearest
const S=3, W=body.w*S, Hh=body.h*S, big=new Uint8ClampedArray(W*Hh*4);
for (let y=0;y<Hh;y++) for (let x=0;x<W;x++){const sx=(x/S)|0,sy=(y/S)|0,s=(sy*body.w+sx)*4,di=(y*W+x)*4;big[di]=out[s];big[di+1]=out[s+1];big[di+2]=out[s+2];big[di+3]=out[s+3];}
const dest="/mnt/c/Users/mateu/OneDrive/Desktop/Rpg/design/pixellab-candidatos/chars/pieces-preview/_composite.png";
writeFileSync(dest, png(W,Hh,big));
console.log("[composite] "+dest+" ("+body.w+"x"+body.h+" @3x)");
