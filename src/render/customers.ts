import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { SEATS } from "../content/cafe";
import type { GameState } from "../sim/game";

/** Shared geometry, articulated elbows/knees; all animation remains a view of sim state. */
export function createCustomerView(scene: THREE.Scene) {
  const skin = new THREE.MeshStandardMaterial({ color: "#bd967b", roughness: .9 });
  const shirts = ["#587889", "#80715c", "#62766b"].map(color => new THREE.MeshStandardMaterial({color,roughness:.95}));
  const pants = new THREE.MeshStandardMaterial({ color: "#273038", roughness: .9 });
  const hair = new THREE.MeshStandardMaterial({ color: "#201b19", roughness: 1 });
  const sphere = new THREE.SphereGeometry(.125,12,8);
  const cap = new THREE.SphereGeometry(.129,12,8,0,Math.PI*2,0,Math.PI/2);
  const torso = new RoundedBoxGeometry(.36,.48,.22,1,.05);
  const limb = new THREE.CylinderGeometry(1,1,1,8);
  const shoe = new RoundedBoxGeometry(.115,.075,.24,1,.025);
  const up = new THREE.Vector3(0,1,0), a = new THREE.Vector3(), b = new THREE.Vector3(), delta = new THREE.Vector3();
  function bone(mesh:THREE.Mesh, start:number[], end:number[], radius:number) {
    a.fromArray(start); b.fromArray(end); delta.subVectors(b,a);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.scale.set(radius,delta.length(),radius);
    mesh.quaternion.setFromUnitVectors(up,delta.normalize());
  }
  function create(id:number) {
    const root=new THREE.Group(), shirt=shirts[id%shirts.length];
    const mesh=(geo:THREE.BufferGeometry, mat:THREE.Material)=>{
      const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;
    };
    const body=mesh(torso,shirt),head=mesh(sphere,skin),hairMesh=mesh(cap,hair);
    head.scale.set(.86,1.16,.95);
    const legs=[0,1].map(()=>({thigh:mesh(limb,pants),shin:mesh(limb,pants),foot:mesh(shoe,hair)}));
    const arms=[0,1].map(()=>({upper:mesh(limb,shirt),lower:mesh(limb,skin),hand:mesh(sphere,skin)}));
    arms.forEach(v=>v.hand.scale.set(.3,.25,.4));
    scene.add(root);
    return {root,body,head,hairMesh,legs,arms,last:new THREE.Vector3(),sit:0,stride:0};
  }
  const people=new Map<number,ReturnType<typeof create>>();
  return {
    update(state:GameState,dt:number) {
      const active=new Set(state.customers.map(c=>c.id));
      for(const [id,v] of people) if(!active.has(id)){scene.remove(v.root);people.delete(id);}
      for(const c of state.customers){
        const fresh=!people.has(c.id),v=people.get(c.id)??create(c.id);people.set(c.id,v);
        const dest=new THREE.Vector3(c.position.x,0,c.position.z);
        if(fresh){v.root.position.copy(dest);v.last.copy(dest);}
        const direction=dest.clone().sub(v.last), distance=direction.length();
        v.stride+=distance*7;
        const seated=c.phase==="using",blend=1-Math.exp(-14*dt);
        v.sit=THREE.MathUtils.lerp(v.sit,seated?1:0,blend);
        const t=v.sit, mix=(standing:number,sitting:number)=>THREE.MathUtils.lerp(standing,sitting,t);
        v.root.position.lerp(dest,blend);
        if(seated)v.root.rotation.y=SEATS.find(s=>s.id===c.seatId)!.rotation+Math.PI;
        else if(distance>.0001)v.root.rotation.y=Math.atan2(direction.x,direction.z);
        v.last.copy(dest);
        v.body.position.set(0,mix(1.06,.87),mix(0,.04));
        v.body.rotation.x=mix(0,.08);
        v.head.position.set(0,mix(1.44,1.245),mix(0,.08));
        v.hairMesh.position.copy(v.head.position);v.hairMesh.position.y+=.03;
        v.hairMesh.scale.copy(v.head.scale);
        v.legs.forEach((leg,i)=>{
          const side=i?1:-1,x=side*.105,swing=Math.sin(v.stride+i*Math.PI)*.22*(1-t);
          const hip=[x,mix(.82,.57),0],knee=[x,mix(.44,.49),mix(swing,.34)],ankle=[x,.105,mix(-swing,.36)];
          bone(leg.thigh,hip,knee,.074);bone(leg.shin,knee,ankle,.054);
          leg.foot.position.set(x,.05,ankle[2]+.065);
        });
        v.arms.forEach((arm,i)=>{
          const side=i?1:-1,swing=Math.sin(v.stride+i*Math.PI)*.12*(1-t);
          const shoulder=[side*.215,mix(1.24,1.05),mix(0,.04)];
          const elbow=[side*.23,mix(.97,.79),mix(swing,.17)];
          const wrist=[side*.18,mix(.76,.8),mix(swing,.49)];
          bone(arm.upper,shoulder,elbow,.052);bone(arm.lower,elbow,wrist,.039);
          arm.hand.position.fromArray(wrist);arm.hand.position.z+=.025*t;
        });
      }
    },
    clear(){for(const v of people.values())scene.remove(v.root);people.clear();},
    dispose(){this.clear();[sphere,cap,torso,limb,shoe].forEach(g=>g.dispose());[skin,...shirts,pants,hair].forEach(m=>m.dispose());},
  };
}
