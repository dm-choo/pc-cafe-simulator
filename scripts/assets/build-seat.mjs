// Original meter-scale furniture. Rebuild with npm run assets:build.
// This is a reproducible code-authored asset, not a Blender export.
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(v => { this.result = v; this.onloadend?.(); }); }
};
const mats = [
  new T.MeshStandardMaterial({name:'walnut',color:'#554035',roughness:.58}),
  new T.MeshStandardMaterial({name:'graphite',color:'#1c242b',roughness:.43,metalness:.28}),
  new T.MeshStandardMaterial({name:'upholstery',color:'#354249',roughness:.94}),
  new T.MeshStandardMaterial({name:'aluminium',color:'#9aa5ad',roughness:.29,metalness:.82}),
  new T.MeshStandardMaterial({name:'rubber',color:'#101519',roughness:.87}),
];
const batches = mats.map(()=>[]);
function part(m,x,y,z,w,h,d,r=0,bevel=.012){
  const g=bevel ? new RoundedBoxGeometry(w,h,d,1,Math.min(bevel,w/4,h/4,d/4)) : new T.BoxGeometry(w,h,d);
  g.rotateY(r);g.translate(x,y,z);batches[m].push(g.index?g.toNonIndexed():g);
}
function rod(m,a,b,r){
  const start=new T.Vector3(...a),end=new T.Vector3(...b),dir=end.clone().sub(start);
  const g=new T.CylinderGeometry(r,r,dir.length(),8);
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize()));
  g.translate(...start.add(end).multiplyScalar(.5).toArray());batches[m].push(g.toNonIndexed());
}
part(0,0,.745,0,1.38,.065,.76);
for(const x of [-.62,.62]){part(1,x,.355,0,.05,.71,.6);part(4,x,.02,0,.08,.035,.65);}
part(1,-.71,.97,-.04,.032,.45,.8,0,.008);
part(1,0,1.12,-.16,.69,.41,.04,0,.009);
part(1,0,.885,-.18,.037,.2,.035);
part(1,0,.79,-.12,.24,.014,.16);
part(4,-.02,.782,.18,.63,.008,.27,0,.003);
part(1,-.1,.8,.18,.405,.025,.145,0,.006);
for(let row=0;row<4;row++)for(let key=0;key<12;key++)part(3,-.276+key*.031,.818,.128+row*.028,.022,.009,.02,0,0);
part(3,-.1,.818,.242,.16,.009,.017,0,0);
part(1,.26,.808,.19,.06,.038,.09,0,.016);
part(3,.26,.829,.178,.007,.006,.018,0,0);
part(1,.52,.99,-.03,.19,.42,.39);
for(let i=0;i<7;i++)part(4,.52,1.05+i*.019,.17,.135,.007,.008,0,0);
part(3,.577,.81,.171,.012,.012,.008,0,0);
// Rounded seat, lumbar cushion, back, headrest, arm supports and five-star base.
part(2,0,.5,.81,.51,.10,.46,0,.035);
part(2,0,.91,1.055,.49,.69,.10,0,.035);
part(2,0,.72,.985,.38,.18,.07,0,.025);
part(2,0,1.285,1.04,.32,.17,.12,0,.035);
rod(3,[0,.12,.81],[0,.46,.81],.027);
for(let i=0;i<5;i++){
 const angle=i*Math.PI*2/5,x=Math.sin(angle)*.29,z=.81+Math.cos(angle)*.29;
 rod(1,[0,.14,.81],[x,.09,z],.022);
 part(4,x,.045,z,.07,.08,.05,angle,.018);
}
for(const side of [-1,1]){
 part(4,side*.285,.69,.83,.055,.035,.29);
 rod(1,[side*.285,.49,.94],[side*.285,.675,.94],.017);
}
// Headset hanging from desk side; uses one shared metal/rubber batch.
for(let i=0;i<10;i++){
 const a=i*Math.PI/10,b=(i+1)*Math.PI/10;
 rod(1,[-.48+Math.cos(a)*.085,.94+Math.sin(a)*.10,.29],[-.48+Math.cos(b)*.085,.94+Math.sin(b)*.10,.29],.009);
}
for(const x of [-.565,-.395])part(4,x,.915,.29,.037,.075,.047,0,.015);
const scene=new T.Group();scene.name='seat.standard.02';
scene.userData={units:'meters',front:'+Z',seat:[0,.55,.8],approach:[.72,0,.8],collider:'src/content/cafe.ts'};
let triangles=0;
batches.forEach((gs,i)=>{
 const g=mergeVertices(mergeGeometries(gs)); triangles+=g.index.count/3;
 const mesh=new T.Mesh(g,mats[i]);mesh.name=mats[i].name;scene.add(mesh);
});
const data=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true});
await mkdir('public/assets/generated',{recursive:true});
await writeFile('public/assets/generated/seat-standard.glb',Buffer.from(data));
const metadata={id:scene.name,bytes:data.byteLength,triangles,materialCount:mats.length,sha256:createHash('sha256').update(Buffer.from(data)).digest('hex'),exporter:'Three.js GLTFExporter 0.185.1',source:'scripts/assets/build-seat.mjs',instances:[12,24,60].map(n=>({count:n,triangles:triangles*n,drawCalls:mats.length}))};
await writeFile('public/assets/generated/seat-standard.json',JSON.stringify(metadata,null,2)+'\n');
console.log(JSON.stringify(metadata));
