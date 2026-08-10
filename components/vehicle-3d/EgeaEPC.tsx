"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {GROUPS,PARTS,isBodyMesh,isWheelMesh,partForMesh,type GroupId,type CatalogPart} from "@/lib/egea-epc";

const EXPLODE:Record<GroupId,THREE.Vector3>={
  "dis-govde":new THREE.Vector3(0,0,0),
  "on-grup":new THREE.Vector3(0,0,0),
  "arka-grup":new THREE.Vector3(0,0,0),
  "motor":new THREE.Vector3(0,0,0),
  "on-takim":new THREE.Vector3(0,0,0),
  "arka-takim":new THREE.Vector3(0,0,0),
};

type MeshState={mesh:THREE.Mesh; pos:THREE.Vector3; material:THREE.Material|THREE.Material[]; visible:boolean};

type Product={
  id:number|string;
  product_code:string;
  product_name:string;
  product_group:string|null;
  sale_price:number;
  stock:number;
  image_url:string|null;
};

function formatMoney(value:number){
  return new Intl.NumberFormat("tr-TR",{
    style:"currency",
    currency:"TRY"
  }).format(Number(value||0));
}

export default function EgeaEPC(){
 const mount=useRef<HTMLDivElement>(null);
 const api=useRef<{setGroup:(g:GroupId)=>void;select:(p:CatalogPart)=>void}|null>(null);
 const [group,setGroupState]=useState<GroupId>("dis-govde");
 const [selected,setSelected]=useState<CatalogPart|null>(null);
 const [loaded,setLoaded]=useState(false);
 const [selectedProducts,setSelectedProducts]=useState<Product[]>([]);
 const [oemLoading,setOemLoading]=useState(false);
 const parts=useMemo(()=>PARTS.filter(p=>p.group===group),[group]);

 async function loadSelectedProducts(part:CatalogPart){
   setOemLoading(true);
   setSelectedProducts([]);

   const title=part.title
     .replace(/İ/g,"I")
     .replace(/ı/g,"i")
     .toLocaleLowerCase("tr-TR")
     .trim();

   // Ürün adları katalog adıyla birebir aynı olmak zorunda değil.
   // Örn: "Ön Tampon" -> "TAMPON ÖN EGEA", "ÖN TAMPON KAPLAMA" vb.
   const words=title
     .split(/\s+/)
     .filter(Boolean)
     .filter(w=>!["sol","sağ","on","ön","arka"].includes(w));

   const direction=
     title.includes("sol")?"sol":
     title.includes("sağ")?"sağ":
     "";

   const position=
     title.includes("ön")?"ön":
     title.includes("arka")?"arka":
     "";

   const candidates=[
     part.title,
     `${part.title} Egea`,
     `${words.join(" ")} Egea`,
     words.join(" "),
     position&&words.length?`${position} ${words.join(" ")}`:"",
     position&&words.length?`${words.join(" ")} ${position}`:"",
     direction&&words.length?`${direction} ${words.join(" ")}`:"",
     direction&&position&&words.length
       ?`${direction} ${position} ${words.join(" ")}`
       :"",
     direction&&position&&words.length
       ?`${words.join(" ")} ${position} ${direction}`
       :"",
   ].map(x=>x.trim()).filter(Boolean);

   const uniqueTerms=[...new Set(candidates)];

   function normalize(value:string){
     return String(value||"")
       .replace(/İ/g,"I")
       .replace(/ı/g,"i")
       .toLocaleLowerCase("tr-TR")
       .replace(/[^a-z0-9çğıöşü\s]/g," ")
       .replace(/\s+/g," ")
       .trim();
   }

   function scoreProduct(product:Product){
     const hay=normalize(
       `${product.product_name||""} ${product.product_group||""}`
     );

     let score=0;

     for(const word of words){
       if(hay.includes(normalize(word))) score+=3;
     }

     if(position&&hay.includes(normalize(position))) score+=2;
     if(direction&&hay.includes(normalize(direction))) score+=2;

     // Egea adı varsa öncelik ver ama zorunlu tutma.
     if(hay.includes("egea")) score+=2;

     return score;
   }

   const collected=new Map<string,Product>();

   for(const term of uniqueTerms){
     try{
       const params=new URLSearchParams({
         page:"1",
         pageSize:"50",
         search:term,
       });

       const response=await fetch(
         `/api/products-list?${params.toString()}`,
         {cache:"no-store"}
       );

       if(!response.ok)continue;

       const data=await response.json() as {products?:Product[]};
       const rows=Array.isArray(data.products)?data.products:[];

       for(const row of rows){
         const key=String(row.id||row.product_code);
         if(!collected.has(key)){
           collected.set(key,row);
         }
       }

       // Yeterli aday bulunduysa daha fazla API isteği atma.
       if(collected.size>=20)break;
     }catch{}
   }

   const ranked=[...collected.values()]
     .map(product=>({
       product,
       score:scoreProduct(product),
     }))
     .filter(item=>item.score>0)
     .sort((a,b)=>b.score-a.score)
     .map(item=>item.product)
     .slice(0,12);

   setSelectedProducts(ranked);
   setOemLoading(false);
 }

 useEffect(()=>{
  if(!mount.current)return;
  const el=mount.current;
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0xf7f7f7);
  const camera=new THREE.PerspectiveCamera(34,el.clientWidth/el.clientHeight,.05,100);
  camera.position.set(6.2,2.9,6.8);
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(el.clientWidth,el.clientHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.shadowMap.enabled=true; el.appendChild(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.enablePan=false; controls.minDistance=4.2; controls.maxDistance=12; controls.target.set(0,1.05,0);
  scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.4));
  const dl=new THREE.DirectionalLight(0xffffff,4); dl.position.set(5,8,6); scene.add(dl);
  const grid=new THREE.GridHelper(12,24,0xd5d5d5,0xe7e7e7); scene.add(grid);
  const states:MeshState[]=[]; const selectable:THREE.Mesh[]=[];
  let currentGroup:GroupId="dis-govde";

  const cloneMat=(m:THREE.Material,opacity=1)=>{
    const c=m.clone() as THREE.MeshStandardMaterial;
    c.transparent=opacity<1; c.opacity=opacity; c.depthWrite=opacity>=1;
    return c;
  };
  const setMatOpacity=(mesh:THREE.Mesh,opacity:number)=>{
    const src=states.find(s=>s.mesh===mesh)?.material; if(!src)return;
    mesh.material=Array.isArray(src)?src.map(m=>cloneMat(m,opacity)):cloneMat(src,opacity);
  };
  const reset=()=>{
    states.forEach(s=>{s.mesh.position.copy(s.pos);s.mesh.material=s.material;s.mesh.visible=s.visible;});
  };
  const moveByName=(contains:string[],delta:THREE.Vector3)=>{
    states.filter(s=>contains.some(x=>s.mesh.name.toLowerCase().includes(x))).forEach(s=>s.mesh.position.copy(s.pos).add(delta));
  };

  const applyGroup=(g:GroupId)=>{
    currentGroup=g; reset();
    states.forEach(s=>{
      const n=s.mesh.name.toLowerCase();
      const p=partForMesh(n);
      const body=isBodyMesh(n), wheel=isWheelMesh(n), mech=n.includes("mechanical_");
      if(g==="dis-govde"){ s.mesh.visible=!mech; }
      if(g==="on-grup"){
        s.mesh.visible=body||wheel||["mechanical_radiator","mechanical_intercooler"].some(x=>n.includes(x));
        if(body && !p) setMatOpacity(s.mesh,.22);
        if(p?.group!=="on-grup" && body) setMatOpacity(s.mesh,.18);
      }
      if(g==="arka-grup"){
        s.mesh.visible=body||wheel;
        if(p?.group!=="arka-grup") setMatOpacity(s.mesh,.20);
      }
      if(g==="motor"){
        s.mesh.visible=mech||body||wheel;
        if(body) setMatOpacity(s.mesh,.12);
        if(mech && !["mechanical_engine","mechanical_transmission","mechanical_turbo","mechanical_intake","mechanical_transfercase","mechanical_driveshaft","mechanical_exhaust"].some(x=>n.includes(x))) setMatOpacity(s.mesh,.12);
      }
      if(g==="on-takim"){
        s.mesh.visible=body||wheel||mech;
        if(body) setMatOpacity(s.mesh,.10);
        if(mech && !n.includes("_front")) setMatOpacity(s.mesh,.08);
      }
      if(g==="arka-takim"){
        s.mesh.visible=body||wheel||mech;
        if(body) setMatOpacity(s.mesh,.10);
        if(mech && !n.includes("_rear") && !n.includes("torsion")) setMatOpacity(s.mesh,.08);
      }
    });

    // EPC-style exploded positioning.
    if(g==="on-grup"){
      moveByName(["front_bumper"],new THREE.Vector3(0,0,1.15));
      moveByName(["headlight_left"],new THREE.Vector3(-.45,0,.65));
      moveByName(["headlight_right"],new THREE.Vector3(.45,0,.65));
      moveByName(["hood"],new THREE.Vector3(0,.85,.25));
      moveByName(["mechanical_radiator","mechanical_intercooler"],new THREE.Vector3(0,0,.45));
    }
    if(g==="arka-grup"){
      moveByName(["rear_bumper"],new THREE.Vector3(0,0,-1.0));
      moveByName(["taillight_left"],new THREE.Vector3(-.45,0,-.45));
      moveByName(["taillight_right"],new THREE.Vector3(.45,0,-.45));
      moveByName(["trunk"],new THREE.Vector3(0,.7,-.3));
    }
    if(g==="dis-govde"){
      // Kapıları normal yerinde tut.
      // Önceki sürümde sabit yönle taşındıkları için bazı kapılar gövdenin içine giriyordu.
      moveByName(["front_fender_left"],new THREE.Vector3(-.18,0,.12));
      moveByName(["front_fender_right"],new THREE.Vector3(.18,0,.12));
    }
  };

  const selectPart=(p:CatalogPart)=>{
    applyGroup(p.group);
    states.filter(s=>p.match.some(x=>s.mesh.name.toLowerCase().includes(x))).forEach(s=>{
      const src=s.material;
      const hi=(m:THREE.Material)=>{
        const c=m.clone() as THREE.MeshStandardMaterial;
        if("emissive" in c){c.emissive=new THREE.Color(0xd71920);c.emissiveIntensity=1.1;}
        return c;
      };
      s.mesh.material=Array.isArray(src)?src.map(hi):hi(src);
    });
  };

  new GLTFLoader().load("/models/fiat-egea-catalog.glb",g=>{
    const root=g.scene; scene.add(root);
    root.traverse(o=>{
      if(!(o instanceof THREE.Mesh))return;
      o.castShadow=true;o.receiveShadow=true;
      states.push({mesh:o,pos:o.position.clone(),material:o.material,visible:o.visible});
      if(partForMesh(o.name))selectable.push(o);
    });
    // Ölçeği tüm GLB'ye göre değil, sadece Egea dış gövdesine göre hesapla.
    // Mekanik meshlerin bazıları model sınırlarını çok büyüttüğü için araç küçücük görünüyordu.
    const bodyBox=new THREE.Box3();
    let bodyFound=false;

    root.updateMatrixWorld(true);

    root.traverse(o=>{
      if(!(o instanceof THREE.Mesh))return;
      if(!isBodyMesh(o.name) && !isWheelMesh(o.name))return;

      const meshBox=new THREE.Box3().setFromObject(o);
      if(meshBox.isEmpty())return;

      bodyBox.union(meshBox);
      bodyFound=true;
    });

    const fitBox=bodyFound ? bodyBox : new THREE.Box3().setFromObject(root);
    const fitSize=fitBox.getSize(new THREE.Vector3());

    // Egea ekranda büyük görünsün.
    const TARGET_MODEL_SIZE=8.4;
    const sc=TARGET_MODEL_SIZE/Math.max(fitSize.x,fitSize.y,fitSize.z);
    root.scale.setScalar(sc);
    root.updateMatrixWorld(true);

    // Yine sadece gövdeye bakarak ortala ve zemine oturt.
    const scaledBodyBox=new THREE.Box3();
    let scaledBodyFound=false;

    root.traverse(o=>{
      if(!(o instanceof THREE.Mesh))return;
      if(!isBodyMesh(o.name) && !isWheelMesh(o.name))return;

      const meshBox=new THREE.Box3().setFromObject(o);
      if(meshBox.isEmpty())return;

      scaledBodyBox.union(meshBox);
      scaledBodyFound=true;
    });

    const finalBox=scaledBodyFound
      ? scaledBodyBox
      : new THREE.Box3().setFromObject(root);

    const center=finalBox.getCenter(new THREE.Vector3());

    root.position.x-=center.x;
    root.position.z-=center.z;
    root.position.y-=finalBox.min.y;
    root.updateMatrixWorld(true);

    // Kamerayı araca yaklaştır.
    controls.target.set(0,1.15,0);
    camera.position.set(6.4,3.0,7.0);
    controls.update();

    applyGroup("dis-govde");
    setLoaded(true);
  });

  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();

  function nearestPart(clientX:number,clientY:number){
    const rect=renderer.domElement.getBoundingClientRect();
    let best:{part:CatalogPart;distance:number}|null=null;

    for(const mesh of selectable){
      if(!mesh.visible)continue;

      const part=partForMesh(mesh.name);
      if(!part)continue;

      const box=new THREE.Box3().setFromObject(mesh);
      const center=box.getCenter(new THREE.Vector3()).project(camera);

      const sx=rect.left+(center.x+1)*.5*rect.width;
      const sy=rect.top+(-center.y+1)*.5*rect.height;
      const distance=Math.hypot(clientX-sx,clientY-sy);

      if(distance<=65&&(!best||distance<best.distance)){
        best={part,distance};
      }
    }

    return best?.part||null;
  }

  const click=(e:PointerEvent)=>{
    const r=renderer.domElement.getBoundingClientRect();
    mouse.x=((e.clientX-r.left)/r.width)*2-1;
    mouse.y=-((e.clientY-r.top)/r.height)*2+1;

    ray.setFromCamera(mouse,camera);

    const hit=ray.intersectObjects(
      selectable.filter(m=>m.visible),
      false
    )[0];

    const p=hit
      ?partForMesh(hit.object.name)
      :nearestPart(e.clientX,e.clientY);

    if(p){
      setSelected(p);
      setGroupState(p.group);
      selectPart(p);
      void loadSelectedProducts(p);
    }
  };
  renderer.domElement.addEventListener("pointerdown",click);
  api.current={setGroup:applyGroup,select:selectPart};
  const ro=new ResizeObserver(()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)});ro.observe(el);
  let id=0; const loop=()=>{controls.update();renderer.render(scene,camera);id=requestAnimationFrame(loop)};loop();
  return()=>{cancelAnimationFrame(id);ro.disconnect();renderer.domElement.removeEventListener("pointerdown",click);controls.dispose();renderer.dispose();el.innerHTML=""};
 },[]);

 const changeGroup=(g:GroupId)=>{
   setGroupState(g);
   setSelected(null);
   setSelectedProducts([]);
   api.current?.setGroup(g);
 };
 const choose=(p:CatalogPart)=>{
   setGroupState(p.group);
   setSelected(p);
   api.current?.select(p);
   void loadSelectedProducts(p);
 };

 return <div className="epc">
  <aside className="tree">
   <div className="brand"><b>FIAT EGEA</b><span>Resimli Parça Kataloğu</span></div>
   {GROUPS.map(g=><div key={g.id}>
    <button className={group===g.id?"g active":"g"} onClick={()=>changeGroup(g.id)}>› {g.title}</button>
    {group===g.id&&<div className="children">{parts.map(p=><button key={p.id} className={selected?.id===p.id?"p sel":"p"} onClick={()=>choose(p)}>{p.title}</button>)}</div>}
   </div>)}
  </aside>
  <section className="main">
   <div className="top"><div><small>LEVHA</small><b>{GROUPS.find(x=>x.id===group)?.title} Açılımlı Görünümü</b></div><span>Fare: döndür · Tekerlek: yakınlaştır · Parçaya tıkla</span></div>
   <div className="viewer" ref={mount}>{!loaded&&<div className="loading">Egea kataloğu yükleniyor…</div>}</div>
  </section>
  <aside className="list">
   <h2>Resimli Parça Kataloğu</h2>
   <p>{GROUPS.find(x=>x.id===group)?.description}</p>
   <div className="thead"><b>No</b><b>Parça Numarası</b><b>Parça Adı</b></div>
   {parts.map((p,i)=><button className={selected?.id===p.id?"row chosen":"row"} key={p.id} onClick={()=>choose(p)}>
    <span>{i+1}</span><span>{selected?.id===p.id&&selectedProducts.length
      ? [...new Set(selectedProducts.map(x=>x.product_code))].slice(0,2).join(" / ")
      : selected?.id===p.id&&oemLoading
        ? "ARANIYOR…"
        : "SEÇİNCE OTOMATİK"
    }</span><strong>{p.title}</strong>
   </button>)}
   {selected&&<div className="detail">
     <small>SEÇİLEN PARÇA</small>
     <h3>{selected.title}</h3>

     {oemLoading?(
       <p>OEM ve ürünler aranıyor…</p>
     ):selectedProducts.length?(
       <>
         {selectedProducts.slice(0,5).map(prod=>(
           <a
             key={String(prod.id)}
             href={`/urun/${prod.id}`}
             style={{
               display:"block",
               border:"1px solid #ddd",
               padding:"8px",
               marginBottom:"6px",
               color:"#111",
               textDecoration:"none",
               background:"#fff"
             }}
           >
             <b>{prod.product_code}</b>
             <span style={{display:"block",fontSize:"11px",marginTop:"3px"}}>
               {prod.product_name}
             </span>
             <small style={{display:"block",marginTop:"3px",color:"#666"}}>
               {formatMoney(prod.sale_price)} · Stok {prod.stock}
             </small>
           </a>
         ))}
         <a href={`/urunler?ara=${encodeURIComponent(selected.title)}`}>
           TÜM ÜRÜNLERİ GÖSTER
         </a>
       </>
     ):(
       <p>Bu isimle kayıtlı ürün bulunamadı.</p>
     )}
   </div>}
  </aside>
  <style jsx>{`
   .epc{display:grid;grid-template-columns:245px minmax(500px,1fr) 430px;height:calc(100vh - 135px);min-height:650px;background:#fff;border-top:1px solid #ddd}
   .tree,.list{overflow:auto;background:#fff}.tree{border-right:1px solid #ccc}.list{border-left:1px solid #ccc}
   .brand{padding:18px;border-bottom:1px solid #ddd}.brand b,.brand span{display:block}.brand b{font-size:22px}.brand span{font-size:12px;color:#777;margin-top:4px}
   .g{width:100%;border:0;border-bottom:1px solid #e5e5e5;background:#f7f7f7;text-align:left;padding:14px;font-weight:900;cursor:pointer}.g.active{background:#c90019;color:#fff}
   .children{padding:5px 0}.p{display:block;width:100%;border:0;background:white;text-align:left;padding:9px 18px 9px 28px;cursor:pointer}.p:hover,.p.sel{background:#fff0f1;color:#b50016;font-weight:800}
   .main{display:flex;min-width:0;flex-direction:column}.top{height:58px;padding:10px 16px;border-bottom:1px solid #ccc;display:flex;justify-content:space-between;align-items:center;background:#f6f6f6}.top small,.top b{display:block}.top small{font-size:10px;color:#777}.top span{font-size:11px;color:#777}
   .viewer{position:relative;flex:1;min-height:0}.loading{position:absolute;inset:0;display:grid;place-items:center;font-weight:800;z-index:2}
   .list{padding:16px}.list h2{margin:0 0 5px;font-size:20px}.list>p{color:#666;font-size:12px;margin:0 0 15px}
   .thead,.row{display:grid;grid-template-columns:42px 145px 1fr;gap:8px;align-items:center}.thead{background:#eee;border:1px solid #ccc;padding:9px;font-size:11px}.row{width:100%;border:0;border-bottom:1px solid #ddd;background:#fff;padding:10px 9px;text-align:left;cursor:pointer;font-size:11px}.row:hover,.row.chosen{background:#fff0f1}.row span:nth-child(2){font-family:monospace}.row strong{font-size:12px}
   .detail{margin-top:16px;border-top:3px solid #c90019;padding-top:14px}.detail small{color:#c90019;font-weight:900}.detail h3{margin:4px 0}.detail p{font-size:12px;color:#666}.detail a{display:block;background:#c90019;color:#fff;text-align:center;padding:12px;text-decoration:none;font-weight:900}
   @media(max-width:1100px){.epc{grid-template-columns:210px 1fr}.list{grid-column:1/-1;border-left:0;border-top:1px solid #ccc;max-height:340px}.epc{height:auto}.viewer{height:600px}}
   @media(max-width:700px){.epc{display:block}.tree{max-height:300px}.viewer{height:480px}.top span{display:none}.list{max-height:none}}
  `}</style>
 </div>
}
