"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {
  GROUPS,PARTS,VEHICLES,isBodyMesh,isWheelMesh,partForMesh,
  type GroupId,type CatalogPart,type VehicleId
} from "@/lib/vehicle-epc";

type Product={
  id:number|string;
  product_code:string;
  product_name:string;
  product_group:string|null;
  sale_price:number;
  stock:number;
  image_url:string|null;
};

type MeshState={
  mesh:THREE.Mesh;
  pos:THREE.Vector3;
  material:THREE.Material|THREE.Material[];
  visible:boolean;
};

function money(v:number){
  return new Intl.NumberFormat("tr-TR",{
    style:"currency",currency:"TRY"
  }).format(Number(v||0));
}

export default function VehicleEPC(){
  const mount=useRef<HTMLDivElement>(null);
  const api=useRef<{
    setGroup:(g:GroupId)=>void;
    select:(p:CatalogPart)=>void;
  }|null>(null);

  const [vehicle,setVehicle]=useState<VehicleId>("egea");
  const [group,setGroupState]=useState<GroupId>("dis-govde");
  const [selected,setSelected]=useState<CatalogPart|null>(null);
  const [loaded,setLoaded]=useState(false);
  const [modelError,setModelError]=useState("");
  const [oemMap,setOemMap]=useState<Record<string,Product[]>>({});
  const [loadingOem,setLoadingOem]=useState(false);

  const parts=useMemo(()=>PARTS.filter(p=>p.group===group),[group]);
  const vehicleInfo=VEHICLES.find(v=>v.id===vehicle)!;

  async function searchPartProducts(part:CatalogPart){
    for(const term of part.searchTerms){
      try{
        const params=new URLSearchParams({
          page:"1",pageSize:"12",search:term
        });
        const r=await fetch(
          `/api/products-list?${params.toString()}`,
          {cache:"no-store"}
        );
        if(!r.ok)continue;
        const j=await r.json() as {products?:Product[]};
        const rows=Array.isArray(j.products)?j.products:[];
        if(rows.length)return rows;
      }catch{}
    }
    return [];
  }

  useEffect(()=>{
    let cancelled=false;

    async function run(){
      setLoadingOem(true);

      // Aynı anda çok sayıda API isteği atma.
      // Cache'de olmayan parçaları sırayla getir.
      for(const p of parts){
        if(cancelled)break;
        if(oemMap[p.id])continue;

        const rows=await searchPartProducts(p);

        if(!cancelled){
          setOemMap(prev=>({
            ...prev,
            [p.id]:rows
          }));
        }
      }

      if(!cancelled){
        setLoadingOem(false);
      }
    }

    void run();
    return()=>{cancelled=true};
  },[group]);

  useEffect(()=>{
    if(!mount.current||!vehicleInfo.ready)return;
    const el=mount.current;
    el.innerHTML="";
    setLoaded(false);
    setModelError("");

    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0xf7f7f7);

    const camera=new THREE.PerspectiveCamera(
      34,Math.max(el.clientWidth,1)/Math.max(el.clientHeight,1),.05,100
    );
    camera.position.set(6.4,3.0,7.0);

    const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));
    renderer.setSize(el.clientWidth,el.clientHeight);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.shadowMap.enabled=false;
    el.appendChild(renderer.domElement);

    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;
    controls.enablePan=false;
    controls.minDistance=2.8;
    controls.maxDistance=18;
    controls.target.set(0,1,0);

    scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.4));
    const dl=new THREE.DirectionalLight(0xffffff,4);
    dl.position.set(5,8,6);
    scene.add(dl);
    scene.add(new THREE.GridHelper(14,28,0xd5d5d5,0xe7e7e7));

    const states:MeshState[]=[];
    const selectable:THREE.Mesh[]=[];
    let root:THREE.Object3D|null=null;
    let currentGroup:GroupId="dis-govde";

    const materialCache=new Map<string,THREE.Material>();

    const cloneMat=(m:THREE.Material,opacity=1)=>{
      const key=`${m.uuid}:${opacity.toFixed(3)}`;
      const cached=materialCache.get(key);
      if(cached)return cached;

      const c=m.clone() as THREE.MeshStandardMaterial;
      c.transparent=opacity<1;
      c.opacity=opacity;
      c.depthWrite=opacity>=.45;
      materialCache.set(key,c);
      return c;
    };

    const setOpacity=(mesh:THREE.Mesh,opacity:number)=>{
      const src=states.find(s=>s.mesh===mesh)?.material;
      if(!src)return;
      mesh.material=Array.isArray(src)
        ?src.map(m=>cloneMat(m,opacity))
        :cloneMat(src,opacity);
    };

    const reset=()=>{
      for(const s of states){
        s.mesh.position.copy(s.pos);
        s.mesh.material=s.material;
        s.mesh.visible=s.visible;
      }
    };

    function meshWorldCenter(mesh:THREE.Mesh){
      return new THREE.Box3()
        .setFromObject(mesh)
        .getCenter(new THREE.Vector3());
    }

    function moveNamed(names:string[],delta:THREE.Vector3){
      for(const s of states){
        const n=s.mesh.name.toLowerCase();
        if(names.some(x=>n.includes(x))){
          s.mesh.position.copy(s.pos).add(delta);
        }
      }
    }

    function fitVisible(extra=1.18){
      const box=new THREE.Box3();
      let any=false;
      for(const s of states){
        if(!s.mesh.visible)continue;
        const b=new THREE.Box3().setFromObject(s.mesh);
        if(b.isEmpty())continue;
        box.union(b);any=true;
      }
      if(!any)return;

      const sphere=box.getBoundingSphere(new THREE.Sphere());
      const radius=Math.max(sphere.radius,.5);
      const fov=THREE.MathUtils.degToRad(camera.fov);
      const dist=(radius/Math.sin(fov/2))*extra;

      const dir=camera.position.clone()
        .sub(controls.target)
        .normalize();

      controls.target.copy(sphere.center);
      camera.position.copy(sphere.center)
        .add(dir.multiplyScalar(dist));
      camera.near=Math.max(.02,dist/100);
      camera.far=Math.max(100,dist*10);
      camera.updateProjectionMatrix();
      controls.update();
    }

    function applyGroup(g:GroupId,fit=true){
      currentGroup=g;
      reset();

      for(const s of states){
        const n=s.mesh.name.toLowerCase();
        const p=partForMesh(n);
        const body=isBodyMesh(n);
        const wheel=isWheelMesh(n);
        const mech=n.includes("mechanical_");

        if(g==="dis-govde"){
          s.mesh.visible=!mech;
        }

        if(g==="on-grup"){
          s.mesh.visible=
            body||wheel||
            n.includes("mechanical_radiator")||
            n.includes("mechanical_intercooler");
          if(body&&p?.group!=="on-grup")setOpacity(s.mesh,.14);
        }

        if(g==="arka-grup"){
          s.mesh.visible=body||wheel;
          if(body&&p?.group!=="arka-grup")setOpacity(s.mesh,.16);
        }

        if(g==="motor"){
          const wantedMech=[
            "mechanical_engine","mechanical_transmission",
            "mechanical_turbo","mechanical_intake",
            "mechanical_transfercase","mechanical_driveshaft",
            "mechanical_exhaust"
          ].some(x=>n.includes(x));

          s.mesh.visible=body||wheel||wantedMech;
          if(body)setOpacity(s.mesh,.07);
        }

        if(g==="on-takim"){
          const wantedMech=mech&&n.includes("_front");
          s.mesh.visible=body||wheel||wantedMech;
          if(body)setOpacity(s.mesh,.06);
        }

        if(g==="arka-takim"){
          const wantedMech=mech&&(n.includes("_rear")||n.includes("torsion"));
          s.mesh.visible=body||wheel||wantedMech;
          if(body)setOpacity(s.mesh,.06);
        }
      }

      if(g==="on-grup"){
        moveNamed(["front_bumper"],new THREE.Vector3(0,0,.85));
        moveNamed(["headlight_left"],new THREE.Vector3(-.24,.08,.45));
        moveNamed(["headlight_right"],new THREE.Vector3(.24,.08,.45));
        moveNamed(["hood"],new THREE.Vector3(0,.58,.14));
        moveNamed(
          ["mechanical_radiator","mechanical_intercooler"],
          new THREE.Vector3(0,0,.22)
        );
      }

      if(g==="arka-grup"){
        moveNamed(["rear_bumper"],new THREE.Vector3(0,0,-.72));
        moveNamed(["taillight_left"],new THREE.Vector3(-.22,.04,-.28));
        moveNamed(["taillight_right"],new THREE.Vector3(.22,.04,-.28));
        moveNamed(["trunk"],new THREE.Vector3(0,.46,-.14));
      }

      // Dış gövdede kapıları taşımıyoruz:
      // böylece kapılar aracın içine düşmüyor.

      root?.updateMatrixWorld(true);
      if(fit)requestAnimationFrame(()=>fitVisible(g==="on-grup"||g==="arka-grup"?1.08:1.16));
    }

    function selectPart(p:CatalogPart){
      applyGroup(p.group,false);

      for(const s of states){
        const n=s.mesh.name.toLowerCase();
        if(!p.match.some(x=>n.includes(x)))continue;

        const hi=(m:THREE.Material)=>{
          const key=`highlight:${m.uuid}`;
          const cached=materialCache.get(key);
          if(cached)return cached;

          const c=m.clone() as THREE.MeshStandardMaterial;
          if("emissive" in c){
            c.emissive=new THREE.Color(0xd71920);
            c.emissiveIntensity=.9;
          }
          materialCache.set(key,c);
          return c;
        };

        const src=s.material;
        s.mesh.material=Array.isArray(src)?src.map(hi):hi(src);
      }

      root?.updateMatrixWorld(true);
      requestAnimationFrame(()=>fitVisible(1.12));
    }

    new GLTFLoader().load(
      vehicleInfo.modelUrl,
      g=>{
        root=g.scene;
        scene.add(root);

        root.traverse(o=>{
          if(!(o instanceof THREE.Mesh))return;
          o.castShadow=false;
          o.receiveShadow=false;
          states.push({
            mesh:o,pos:o.position.clone(),
            material:o.material,visible:o.visible
          });
          if(partForMesh(o.name))selectable.push(o);
        });

        root.updateMatrixWorld(true);
        const bodyBox=new THREE.Box3();
        let bodyFound=false;

        root.traverse(o=>{
          if(!(o instanceof THREE.Mesh))return;
          if(!isBodyMesh(o.name)&&!isWheelMesh(o.name))return;
          const b=new THREE.Box3().setFromObject(o);
          if(b.isEmpty())return;
          bodyBox.union(b);bodyFound=true;
        });

        const fitBox=bodyFound
          ?bodyBox
          :new THREE.Box3().setFromObject(root);
        const size=fitBox.getSize(new THREE.Vector3());
        const sc=7.6/Math.max(size.x,size.y,size.z);
        root.scale.setScalar(sc);
        root.updateMatrixWorld(true);

        const finalBox=new THREE.Box3();
        let found=false;
        root.traverse(o=>{
          if(!(o instanceof THREE.Mesh))return;
          if(!isBodyMesh(o.name)&&!isWheelMesh(o.name))return;
          const b=new THREE.Box3().setFromObject(o);
          if(b.isEmpty())return;
          finalBox.union(b);found=true;
        });

        const fb=found
          ?finalBox
          :new THREE.Box3().setFromObject(root);
        const c=fb.getCenter(new THREE.Vector3());
        root.position.x-=c.x;
        root.position.z-=c.z;
        root.position.y-=fb.min.y;
        root.updateMatrixWorld(true);

        applyGroup(group);
        setLoaded(true);
      },
      undefined,
      ()=>setModelError("3D model dosyası açılamadı.")
    );

    const ray=new THREE.Raycaster();
    const mouse=new THREE.Vector2();

    function nearestPartByScreen(clientX:number,clientY:number){
      const rect=renderer.domElement.getBoundingClientRect();
      let best:{part:CatalogPart;d:number}|null=null;

      for(const mesh of selectable){
        if(!mesh.visible)continue;
        const part=partForMesh(mesh.name);
        if(!part||part.group!==currentGroup)continue;

        const c=meshWorldCenter(mesh).project(camera);
        const sx=rect.left+(c.x+1)*.5*rect.width;
        const sy=rect.top+(-c.y+1)*.5*rect.height;
        const d=Math.hypot(clientX-sx,clientY-sy);

        // Tampon/far gibi küçük parçalara 70px yakın tıklamak yeterli.
        if(d<=70&&(!best||d<best.d)){
          best={part,d};
        }
      }
      return best?.part||null;
    }

    const click=(e:PointerEvent)=>{
      const r=renderer.domElement.getBoundingClientRect();
      mouse.x=((e.clientX-r.left)/r.width)*2-1;
      mouse.y=-((e.clientY-r.top)/r.height)*2+1;
      ray.setFromCamera(mouse,camera);

      const candidates=selectable.filter(m=>{
        if(!m.visible)return false;
        return partForMesh(m.name)?.group===currentGroup;
      });

      const hit=ray.intersectObjects(candidates,false)[0];
      const p=hit
        ?partForMesh(hit.object.name)
        :nearestPartByScreen(e.clientX,e.clientY);

      if(p){
        setSelected(p);
        setGroupState(p.group);
        selectPart(p);
      }
    };

    renderer.domElement.addEventListener("pointerdown",click);

    const onContextLost=(event:Event)=>{
      event.preventDefault();
      setModelError("3D görüntü kartı sıfırlandı. Sayfayı yenile.");
    };
    renderer.domElement.addEventListener("webglcontextlost",onContextLost);
    api.current={setGroup:applyGroup,select:selectPart};

    const ro=new ResizeObserver(()=>{
      camera.aspect=Math.max(el.clientWidth,1)/Math.max(el.clientHeight,1);
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth,el.clientHeight);
    });
    ro.observe(el);

    let id=0;
    const loop=()=>{
      controls.update();
      renderer.render(scene,camera);
      id=requestAnimationFrame(loop);
    };
    loop();

    return()=>{
      cancelAnimationFrame(id);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown",click);
      renderer.domElement.removeEventListener("webglcontextlost",onContextLost);
      controls.dispose();

      for(const material of materialCache.values()){
        material.dispose();
      }
      materialCache.clear();

      renderer.dispose();
      api.current=null;
      el.innerHTML="";
    };
  },[vehicle]);

  function changeGroup(g:GroupId){
    setGroupState(g);
    setSelected(null);
    api.current?.setGroup(g);
  }

  function choose(p:CatalogPart){
    setGroupState(p.group);
    setSelected(p);
    api.current?.select(p);
  }

  const selectedProducts=selected?oemMap[selected.id]||[]:[];

  return <div className="epc">
    <aside className="tree">
      <div className="brand">
        <b>RESİMLİ PARÇA KATALOĞU</b>
        <span>TOFAŞ / Turan Oto</span>
      </div>

      <div className="vehicles">
        {VEHICLES.map(v=>
          <button
            key={v.id}
            type="button"
            className={vehicle===v.id?"vehicle active":"vehicle"}
            disabled={!v.ready}
            onClick={()=>{
              if(!v.ready)return;
              setVehicle(v.id);
              setGroupState("dis-govde");
              setSelected(null);
            }}
          >
            <strong>{v.title}</strong>
            <small>{v.ready?v.subtitle:"3D MODEL HAZIRLANACAK"}</small>
          </button>
        )}
      </div>

      {GROUPS.map(g=><div key={g.id}>
        <button
          type="button"
          className={group===g.id?"g active":"g"}
          onClick={()=>changeGroup(g.id)}
        >
          › {g.title}
        </button>

        {group===g.id&&
          <div className="children">
            {parts.map(p=>
              <button
                type="button"
                key={p.id}
                className={selected?.id===p.id?"p sel":"p"}
                onClick={()=>choose(p)}
              >
                {p.title}
              </button>
            )}
          </div>
        }
      </div>)}
    </aside>

    <section className="main">
      <div className="top">
        <div>
          <small>LEVHA</small>
          <b>
            {vehicleInfo.title} · {GROUPS.find(x=>x.id===group)?.title}
            {" "}Açılımlı Görünümü
          </b>
        </div>
        <span>Fare: döndür · Tekerlek: yakınlaştır · Parçaya tıkla</span>
      </div>

      <div className="viewer" ref={mount}>
        {!loaded&&!modelError&&
          <div className="loading">3D katalog yükleniyor…</div>
        }
        {modelError&&
          <div className="loading error">{modelError}</div>
        }
      </div>
    </section>

    <aside className="list">
      <h2>Resimli Parça Kataloğu</h2>
      <p>{GROUPS.find(x=>x.id===group)?.description}</p>

      <div className="thead">
        <b>No</b><b>OEM / Parça Numarası</b><b>Parça Adı</b>
      </div>

      {parts.map((p,i)=>{
        const products=oemMap[p.id]||[];
        const codes=[...new Set(
          products.map(x=>x.product_code).filter(Boolean)
        )];

        return <button
          type="button"
          className={selected?.id===p.id?"row chosen":"row"}
          key={p.id}
          onClick={()=>choose(p)}
        >
          <span>{i+1}</span>
          <span className={codes.length?"oem":"oem empty"}>
            {codes.length
              ?`${codes.slice(0,2).join(" / ")}${codes.length>2?` +${codes.length-2}`:""}`
              :loadingOem?"ARANIYOR…":"ÜRÜN BULUNAMADI"}
          </span>
          <strong>{p.title}</strong>
        </button>;
      })}

      {selected&&<div className="detail">
        <small>SEÇİLEN PARÇA</small>
        <h3>{selected.title}</h3>

        {selectedProducts.length?<>
          <div className="matches">
            {selectedProducts.slice(0,6).map(prod=>
              <a
                key={String(prod.id)}
                href={`/urun/${prod.id}`}
                className="match"
              >
                <b>{prod.product_code}</b>
                <span>{prod.product_name}</span>
                <small>{money(prod.sale_price)} · Stok {prod.stock}</small>
              </a>
            )}
          </div>
          <a
            className="showAll"
            href={`/urunler?ara=${encodeURIComponent(selected.searchTerms[0])}`}
          >
            TÜM UYGUN ÜRÜNLERİ GÖSTER
          </a>
        </>:<>
          <p>
            Bu parça için ürün tablosunda eşleşen OEM henüz bulunamadı.
            TOFAŞ senkronuna ürün geldiğinde burada otomatik görünür.
          </p>
        </>}
      </div>}

      {!selected&&<div className="autoInfo">
        <b>OEM OTOMATİK</b>
        <span>
          Kodları elle girmiyorsun. Mevcut products-list API'sindeki
          product_code değerleri otomatik çekiliyor.
        </span>
      </div>}
    </aside>

    <style jsx>{`
      .epc{display:grid;grid-template-columns:245px minmax(500px,1fr) 430px;height:calc(100vh - 135px);min-height:650px;background:#fff;border-top:1px solid #ddd}
      .tree,.list{overflow:auto;background:#fff}.tree{border-right:1px solid #ccc}.list{border-left:1px solid #ccc}
      .brand{padding:16px;border-bottom:1px solid #ddd}.brand b,.brand span{display:block}.brand b{font-size:16px}.brand span{font-size:11px;color:#777;margin-top:4px}
      .vehicles{padding:8px;border-bottom:1px solid #ddd;display:grid;gap:6px}.vehicle{border:1px solid #ddd;background:#fff;padding:8px;text-align:left;cursor:pointer}.vehicle strong,.vehicle small{display:block}.vehicle small{margin-top:2px;color:#777;font-size:9px}.vehicle.active{border-color:#c90019;background:#fff0f1}.vehicle:disabled{opacity:.45;cursor:not-allowed}
      .g{width:100%;border:0;border-bottom:1px solid #e5e5e5;background:#f7f7f7;text-align:left;padding:13px;font-weight:900;cursor:pointer}.g.active{background:#c90019;color:#fff}
      .children{padding:5px 0}.p{display:block;width:100%;border:0;background:white;text-align:left;padding:9px 18px 9px 24px;cursor:pointer}.p:hover,.p.sel{background:#fff0f1;color:#b50016;font-weight:800}
      .main{display:flex;min-width:0;flex-direction:column}.top{height:58px;padding:10px 16px;border-bottom:1px solid #ccc;display:flex;justify-content:space-between;align-items:center;background:#f6f6f6}.top small,.top b{display:block}.top small{font-size:10px;color:#777}.top span{font-size:11px;color:#777}
      .viewer{position:relative;flex:1;min-height:0;overflow:hidden}.loading{position:absolute;inset:0;display:grid;place-items:center;font-weight:800;z-index:2;background:#f7f7f7}.loading.error{color:#b50016}
      .list{padding:16px}.list h2{margin:0 0 5px;font-size:20px}.list>p{color:#666;font-size:12px;margin:0 0 15px}
      .thead,.row{display:grid;grid-template-columns:42px 170px 1fr;gap:8px;align-items:center}.thead{background:#eee;border:1px solid #ccc;padding:9px;font-size:10px}.row{width:100%;border:0;border-bottom:1px solid #ddd;background:#fff;padding:10px 9px;text-align:left;cursor:pointer;font-size:11px}.row:hover,.row.chosen{background:#fff0f1}.row strong{font-size:12px}
      .oem{font-family:monospace;font-weight:800;color:#111;word-break:break-word}.oem.empty{color:#999;font-weight:500;font-size:9px}
      .detail{margin-top:16px;border-top:3px solid #c90019;padding-top:14px}.detail>small{color:#c90019;font-weight:900}.detail h3{margin:4px 0 12px}.detail>p{font-size:12px;color:#666}
      .matches{display:grid;gap:6px}.match{display:block;border:1px solid #ddd;padding:8px;text-decoration:none;color:#111;background:#fff}.match b,.match span,.match small{display:block}.match span{font-size:11px;margin-top:3px}.match small{color:#666;margin-top:3px}.match:hover{border-color:#c90019;background:#fff7f7}
      .showAll{display:block;background:#c90019;color:#fff;text-align:center;padding:12px;text-decoration:none;font-weight:900;margin-top:10px}
      .autoInfo{margin-top:18px;padding:12px;background:#f5f5f5;border-left:3px solid #c90019}.autoInfo b,.autoInfo span{display:block}.autoInfo span{font-size:11px;color:#666;margin-top:5px;line-height:1.4}
      @media(max-width:1100px){.epc{grid-template-columns:210px 1fr;height:auto}.list{grid-column:1/-1;border-left:0;border-top:1px solid #ccc;max-height:380px}.viewer{height:600px}.main{min-height:660px}}
      @media(max-width:700px){.epc{display:block}.tree{max-height:360px}.viewer{height:500px}.main{min-height:560px}.top span{display:none}.list{max-height:none}.thead,.row{grid-template-columns:35px 135px 1fr}}
    `}</style>
  </div>;
}
