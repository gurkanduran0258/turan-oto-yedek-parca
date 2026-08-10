"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {
  GROUPS,
  PARTS,
  isBodyMesh,
  isWheelMesh,
  partForMesh,
  type GroupId,
  type CatalogPart
} from "@/lib/egea-epc";

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

type ViewPreset="front34"|"front"|"side"|"rear34"|"rear"|"top34";

const VIEW_PRESETS:{id:ViewPreset;label:string;position:[number,number,number]}[]=[
  {id:"front34",label:"Ön 3/4",position:[6.8,3.1,7.3]},
  {id:"front",label:"Ön",position:[0,2.6,9.0]},
  {id:"side",label:"Yan",position:[9.0,2.5,0]},
  {id:"rear34",label:"Arka 3/4",position:[6.8,3.0,-7.3]},
  {id:"rear",label:"Arka",position:[0,2.6,-9.0]},
  {id:"top34",label:"Üst 3/4",position:[6.4,7.0,6.2]},
];

function money(v:number){
  return new Intl.NumberFormat("tr-TR",{
    style:"currency",
    currency:"TRY",
    minimumFractionDigits:2
  }).format(Number(v||0));
}

function normalize(value:string){
  return String(value||"")
    .replace(/İ/g,"I")
    .replace(/ı/g,"i")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9çğıöşü\s]/g," ")
    .replace(/\s+/g," ")
    .trim();
}

export default function EgeaEPC(){
  const mount=useRef<HTMLDivElement>(null);

  const sceneApi=useRef<{
    setGroup:(g:GroupId)=>void;
    select:(p:CatalogPart|null)=>void;
    setView:(v:ViewPreset)=>void;
    setExploded:(value:boolean)=>void;
    setXray:(value:boolean)=>void;
    reset:()=>void;
  }|null>(null);

  const [group,setGroup]=useState<GroupId>("dis-govde");
  const [selected,setSelected]=useState<CatalogPart|null>(null);
  const [products,setProducts]=useState<Product[]>([]);
  const [loadingProducts,setLoadingProducts]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [activeView,setActiveView]=useState<ViewPreset>("front34");
  const [exploded,setExploded]=useState(false);
  const [xray,setXray]=useState(false);

  const visibleParts=useMemo(
    ()=>PARTS.filter(p=>p.group===group),
    [group]
  );

  async function loadSelectedProducts(part:CatalogPart){
    setLoadingProducts(true);
    setProducts([]);

    const title=normalize(part.title);
    const words=title
      .split(/\s+/)
      .filter(Boolean)
      .filter(w=>!["sol","sağ","ön","arka"].includes(w));

    const candidates=[
      part.title,
      `${part.title} Egea`,
      words.join(" "),
      `${words.join(" ")} Egea`,
      title.includes("ön")?`${words.join(" ")} ön`:"",
      title.includes("arka")?`${words.join(" ")} arka`:"",
      title.includes("sol")?`${words.join(" ")} sol`:"",
      title.includes("sağ")?`${words.join(" ")} sağ`:"",
    ].map(v=>v.trim()).filter(Boolean);

    const unique=[...new Set(candidates)];
    const found=new Map<string,Product>();

    for(const term of unique){
      try{
        const params=new URLSearchParams({
          page:"1",
          pageSize:"50",
          search:term
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
          if(!found.has(key))found.set(key,row);
        }

        if(found.size>=20)break;
      }catch{}
    }

    const ranked=[...found.values()]
      .map(product=>{
        const hay=normalize(
          `${product.product_name||""} ${product.product_group||""}`
        );

        let score=0;
        for(const word of words){
          if(hay.includes(normalize(word)))score+=3;
        }
        if(title.includes("ön")&&hay.includes("ön"))score+=2;
        if(title.includes("arka")&&hay.includes("arka"))score+=2;
        if(title.includes("sol")&&hay.includes("sol"))score+=2;
        if(title.includes("sağ")&&hay.includes("sağ"))score+=2;
        if(hay.includes("egea"))score+=2;

        return {product,score};
      })
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score)
      .map(x=>x.product)
      .slice(0,12);

    setProducts(ranked);
    setLoadingProducts(false);
  }

  useEffect(()=>{
    if(!mount.current)return;

    setLoaded(false);

    const el=mount.current;
    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0xf4f4f4);

    const camera=new THREE.PerspectiveCamera(
      34,
      Math.max(el.clientWidth,1)/Math.max(el.clientHeight,1),
      .05,
      120
    );
    camera.position.set(...VIEW_PRESETS[0].position);

    const renderer=new THREE.WebGLRenderer({
      antialias:true,
      powerPreference:"high-performance"
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));
    renderer.setSize(el.clientWidth,el.clientHeight);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;
    controls.enablePan=false;
    controls.minDistance=3.5;
    controls.maxDistance=16;
    controls.target.set(0,1.05,0);

    scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.2));
    const directional=new THREE.DirectionalLight(0xffffff,3.5);
    directional.position.set(5,8,6);
    scene.add(directional);

    const floor=new THREE.GridHelper(14,28,0xd7d7d7,0xe7e7e7);
    floor.position.y=0;
    scene.add(floor);

    const states:MeshState[]=[];
    const selectable:THREE.Mesh[]=[];
    const materialCache=new Map<string,THREE.Material>();

    let root:THREE.Object3D|null=null;
    let currentGroup:GroupId="dis-govde";
    let currentExploded=false;
    let currentXray=false;
    let lastSelected:CatalogPart|null=null;

    const cloneOpacity=(m:THREE.Material,opacity:number)=>{
      const key=`${m.uuid}:${opacity.toFixed(2)}`;
      const cached=materialCache.get(key);
      if(cached)return cached;

      const c=m.clone() as THREE.MeshStandardMaterial;
      c.transparent=opacity<1;
      c.opacity=opacity;
      c.depthWrite=opacity>.4;
      materialCache.set(key,c);
      return c;
    };

    const setOpacity=(mesh:THREE.Mesh,opacity:number)=>{
      const original=states.find(s=>s.mesh===mesh)?.material;
      if(!original)return;

      mesh.material=Array.isArray(original)
        ?original.map(m=>cloneOpacity(m,opacity))
        :cloneOpacity(original,opacity);
    };

    const resetMeshes=()=>{
      for(const s of states){
        s.mesh.position.copy(s.pos);
        s.mesh.material=s.material;
        s.mesh.visible=s.visible;
      }
    };

    const moveNamed=(names:string[],delta:THREE.Vector3)=>{
      for(const s of states){
        const n=s.mesh.name.toLowerCase();
        if(names.some(x=>n.includes(x))){
          s.mesh.position.copy(s.pos).add(delta);
        }
      }
    };

    function applyExploded(g:GroupId){
      if(!currentExploded)return;

      if(g==="dis-govde"){
        moveNamed(["hood"],new THREE.Vector3(0,.58,.10));
        moveNamed(["front_fender_left"],new THREE.Vector3(-.22,0,.10));
        moveNamed(["front_fender_right"],new THREE.Vector3(.22,0,.10));
      }

      if(g==="on-grup"){
        moveNamed(["front_bumper"],new THREE.Vector3(0,0,.82));
        moveNamed(["headlight_left"],new THREE.Vector3(-.25,.07,.44));
        moveNamed(["headlight_right"],new THREE.Vector3(.25,.07,.44));
        moveNamed(["hood"],new THREE.Vector3(0,.60,.14));
        moveNamed(
          ["mechanical_radiator","mechanical_intercooler"],
          new THREE.Vector3(0,0,.22)
        );
      }

      if(g==="arka-grup"){
        moveNamed(["rear_bumper"],new THREE.Vector3(0,0,-.72));
        moveNamed(["taillight_left"],new THREE.Vector3(-.22,.05,-.30));
        moveNamed(["taillight_right"],new THREE.Vector3(.22,.05,-.30));
        moveNamed(["trunk"],new THREE.Vector3(0,.46,-.14));
      }
    }

    function applyGroup(g:GroupId){
      currentGroup=g;
      resetMeshes();

      for(const s of states){
        const n=s.mesh.name.toLowerCase();
        const part=partForMesh(n);
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
            n.includes("mechanical_intercooler")||
            n.includes("mechanical_radiator_fan");

          if(body&&part?.group!=="on-grup"){
            setOpacity(s.mesh,currentXray?.09:.22);
          }
        }

        if(g==="arka-grup"){
          s.mesh.visible=body||wheel;
          if(body&&part?.group!=="arka-grup"){
            setOpacity(s.mesh,currentXray?.09:.22);
          }
        }

        if(g==="motor"){
          const wanted=[
            "mechanical_engine",
            "mechanical_transmission",
            "mechanical_turbo",
            "mechanical_intake",
            "mechanical_exhaust",
            "mechanical_driveshaft"
          ].some(x=>n.includes(x));

          s.mesh.visible=body||wheel||wanted;
          if(body)setOpacity(s.mesh,currentXray?.045:.10);
        }

        if(g==="on-takim"){
          const wanted=mech&&n.includes("_front");
          s.mesh.visible=body||wheel||wanted;
          if(body)setOpacity(s.mesh,currentXray?.04:.09);
        }

        if(g==="arka-takim"){
          const wanted=
            mech&&(n.includes("_rear")||n.includes("torsion"));
          s.mesh.visible=body||wheel||wanted;
          if(body)setOpacity(s.mesh,currentXray?.04:.09);
        }
      }

      applyExploded(g);
      if(lastSelected)highlight(lastSelected);
    }

    function highlight(part:CatalogPart){
      lastSelected=part;

      for(const s of states){
        const n=s.mesh.name.toLowerCase();
        if(!part.match.some(x=>n.includes(x)))continue;

        const hi=(m:THREE.Material)=>{
          const key=`hi:${m.uuid}`;
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

        s.mesh.material=Array.isArray(s.material)
          ?s.material.map(hi)
          :hi(s.material);
      }
    }

    function setSelectedPart(part:CatalogPart|null){
      lastSelected=part;
      applyGroup(currentGroup);
      if(part)highlight(part);
    }

    function setView(v:ViewPreset){
      const preset=VIEW_PRESETS.find(x=>x.id===v);
      if(!preset)return;
      camera.position.set(...preset.position);
      controls.target.set(0,1.05,0);
      controls.update();
    }

    function resetCamera(){
      camera.position.set(...VIEW_PRESETS[0].position);
      controls.target.set(0,1.05,0);
      controls.update();
    }

    const loader=new GLTFLoader();
    loader.load(
      "/models/fiat-egea-catalog.glb",
      gltf=>{
        root=gltf.scene;
        scene.add(root);

        root.traverse(o=>{
          if(!(o instanceof THREE.Mesh))return;

          states.push({
            mesh:o,
            pos:o.position.clone(),
            material:o.material,
            visible:o.visible
          });

          if(partForMesh(o.name))selectable.push(o);
        });

        root.updateMatrixWorld(true);

        const bodyBox=new THREE.Box3();
        let found=false;

        root.traverse(o=>{
          if(!(o instanceof THREE.Mesh))return;
          if(!isBodyMesh(o.name)&&!isWheelMesh(o.name))return;

          const b=new THREE.Box3().setFromObject(o);
          if(b.isEmpty())return;

          bodyBox.union(b);
          found=true;
        });

        const fitBox=found?bodyBox:new THREE.Box3().setFromObject(root);
        const size=fitBox.getSize(new THREE.Vector3());
        const scale=7.4/Math.max(size.x,size.y,size.z);
        root.scale.setScalar(scale);
        root.updateMatrixWorld(true);

        const finalBox=new THREE.Box3();
        let finalFound=false;

        root.traverse(o=>{
          if(!(o instanceof THREE.Mesh))return;
          if(!isBodyMesh(o.name)&&!isWheelMesh(o.name))return;

          const b=new THREE.Box3().setFromObject(o);
          if(b.isEmpty())return;
          finalBox.union(b);
          finalFound=true;
        });

        const fb=finalFound
          ?finalBox
          :new THREE.Box3().setFromObject(root);

        const center=fb.getCenter(new THREE.Vector3());

        root.position.x-=center.x;
        root.position.z-=center.z;
        root.position.y-=fb.min.y;
        root.updateMatrixWorld(true);

        applyGroup("dis-govde");
        setLoaded(true);
      }
    );

    const ray=new THREE.Raycaster();
    const mouse=new THREE.Vector2();

    function nearestPart(clientX:number,clientY:number){
      const rect=renderer.domElement.getBoundingClientRect();
      let best:{part:CatalogPart;distance:number}|null=null;

      for(const mesh of selectable){
        if(!mesh.visible)continue;
        const part=partForMesh(mesh.name);
        if(!part||part.group!==currentGroup)continue;

        const center=new THREE.Box3()
          .setFromObject(mesh)
          .getCenter(new THREE.Vector3())
          .project(camera);

        const sx=rect.left+(center.x+1)*.5*rect.width;
        const sy=rect.top+(-center.y+1)*.5*rect.height;
        const distance=Math.hypot(clientX-sx,clientY-sy);

        if(distance<=68&&(!best||distance<best.distance)){
          best={part,distance};
        }
      }

      return best?.part||null;
    }

    const onPointer=(event:PointerEvent)=>{
      const r=renderer.domElement.getBoundingClientRect();

      mouse.x=((event.clientX-r.left)/r.width)*2-1;
      mouse.y=-((event.clientY-r.top)/r.height)*2+1;

      ray.setFromCamera(mouse,camera);

      const hit=ray.intersectObjects(
        selectable.filter(mesh=>{
          if(!mesh.visible)return false;
          return partForMesh(mesh.name)?.group===currentGroup;
        }),
        false
      )[0];

      const part=hit
        ?partForMesh(hit.object.name)
        :nearestPart(event.clientX,event.clientY);

      if(part){
        setSelected(part);
        setGroup(part.group);
        void loadSelectedProducts(part);
        setSelectedPart(part);
      }
    };

    renderer.domElement.addEventListener("pointerdown",onPointer);

    const resize=new ResizeObserver(()=>{
      camera.aspect=
        Math.max(el.clientWidth,1)/Math.max(el.clientHeight,1);
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth,el.clientHeight);
    });
    resize.observe(el);

    sceneApi.current={
      setGroup:g=>{
        lastSelected=null;
        applyGroup(g);
      },
      select:setSelectedPart,
      setView,
      setExploded:value=>{
        currentExploded=value;
        applyGroup(currentGroup);
      },
      setXray:value=>{
        currentXray=value;
        applyGroup(currentGroup);
      },
      reset:resetCamera
    };

    let frame=0;
    const render=()=>{
      controls.update();
      renderer.render(scene,camera);
      frame=requestAnimationFrame(render);
    };
    render();

    return()=>{
      cancelAnimationFrame(frame);
      resize.disconnect();
      renderer.domElement.removeEventListener("pointerdown",onPointer);
      controls.dispose();

      for(const material of materialCache.values()){
        material.dispose();
      }

      renderer.dispose();
      sceneApi.current=null;
      el.innerHTML="";
    };
  },[]);

  function changeGroup(next:GroupId){
    setGroup(next);
    setSelected(null);
    setProducts([]);
    sceneApi.current?.setGroup(next);
  }

  function choose(part:CatalogPart){
    setSelected(part);
    setGroup(part.group);
    sceneApi.current?.select(part);
    void loadSelectedProducts(part);
  }

  function chooseView(view:ViewPreset){
    setActiveView(view);
    sceneApi.current?.setView(view);
  }

  function toggleExploded(){
    const next=!exploded;
    setExploded(next);
    sceneApi.current?.setExploded(next);
  }

  function toggleXray(){
    const next=!xray;
    setXray(next);
    sceneApi.current?.setXray(next);
  }

  const selectedProduct=products[0]||null;

  return (
    <div className="catalogPage">
      <section className="vehicleToolbar">
        <div className="selectBox">
          <span className="fiatDot">FIAT</span>
          <div>
            <small>ARAÇ</small>
            <b>Fiat Egea</b>
          </div>
          <span className="arrow">⌄</span>
        </div>

        <div className="selectBox compact">
          <div>
            <small>KASA / YIL</small>
            <b>Egea Sedan</b>
          </div>
          <span className="arrow">⌄</span>
        </div>

        <div className="selectBox compact">
          <div>
            <small>VERSİYON</small>
            <b>Tümü</b>
          </div>
          <span className="arrow">⌄</span>
        </div>
      </section>

      <section className="breadcrumb">
        Ana Sayfa <span>›</span> Katalog <span>›</span> Fiat Egea
      </section>

      <section className="workbench">
        <aside className="leftColumn">
          <div className="darkCard categories">
            <div className="darkTitle">KATALOG BÖLÜMLERİ</div>

            {GROUPS.map(g=>(
              <button
                type="button"
                key={g.id}
                className={group===g.id?"groupButton active":"groupButton"}
                onClick={()=>changeGroup(g.id)}
              >
                <span className="groupIcon">◉</span>
                <span>{g.title}</span>
                <span>›</span>
              </button>
            ))}
          </div>

          <div className="darkCard vehicleInfo">
            <div className="darkTitle">ARAÇ BİLGİLERİ</div>
            <Info label="Marka" value="Fiat"/>
            <Info label="Model" value="Egea"/>
            <Info label="Kasa" value="Sedan"/>
            <Info label="Yakıt Tipi" value="Dizel / Benzin"/>
            <Info label="Kasa Tipi" value="Binek"/>
          </div>

          <div className="darkCard viewOptions">
            <div className="darkTitle">GÖRÜNÜM SEÇENEKLERİ</div>

            <ToggleRow
              label="X-Ray Mod"
              checked={xray}
              onClick={toggleXray}
            />

            <ToggleRow
              label="Exploded View"
              checked={exploded}
              onClick={toggleExploded}
            />

            <button
              type="button"
              className="fullscreenButton"
              onClick={()=>{
                const el=mount.current;
                if(el?.requestFullscreen)void el.requestFullscreen();
              }}
            >
              <span>Tam Ekran</span>
              <span>⛶</span>
            </button>
          </div>
        </aside>

        <main className="centerColumn">
          <div className="viewerCard">
            <div className="viewerTools">
              <button onClick={()=>sceneApi.current?.reset()}>⌂</button>
              <button onClick={()=>chooseView("front34")}>◉</button>
              <button onClick={toggleXray}>▣</button>
              <button onClick={toggleExploded}>⤢</button>
              <button>▱</button>
              <button>◇</button>
            </div>

            <div ref={mount} className="viewer">
              {!loaded&&(
                <div className="loading">3D katalog yükleniyor…</div>
              )}
            </div>
          </div>

          <div className="viewStrip">
            {VIEW_PRESETS.map(view=>(
              <button
                type="button"
                key={view.id}
                className={activeView===view.id?"viewThumb active":"viewThumb"}
                onClick={()=>chooseView(view.id)}
              >
                <div className="miniCar">
                  <div className={`miniCarShape ${view.id}`}/>
                </div>
                <span>{view.label}</span>
              </button>
            ))}
          </div>

          <div className="explodedCard">
            <div className="explodedHeader">
              <b>EXPLODED VIEW</b>
              <span>
                {GROUPS.find(g=>g.id===group)?.title} açılımlı görünüm
              </span>
            </div>

            <div className="explodedContent">
              <div className="ghostVehicle">
                <div className="ghostCarBody"/>
                <div className="ghostPart p1"/>
                <div className="ghostPart p2"/>
                <div className="ghostPart p3"/>
                <div className="ghostPart p4"/>
                <div className="ghostPart p5"/>
                <div className="ghostPart p6"/>
                <div className="ghostPart p7"/>
              </div>
            </div>
          </div>
        </main>

        <aside className="rightColumn">
          <div className="partsCard">
            <div className="partsHeader">
              <div>
                <small>KATEGORİ</small>
                <h3>{GROUPS.find(g=>g.id===group)?.title}</h3>
              </div>
              <span>{visibleParts.length} Parça</span>
            </div>

            <div className="partsList">
              {visibleParts.map((part,index)=>(
                <button
                  type="button"
                  key={part.id}
                  className={selected?.id===part.id?"partRow selected":"partRow"}
                  onClick={()=>choose(part)}
                >
                  <div className="partIcon">
                    {index%3===0?"▰":index%3===1?"◖":"◉"}
                  </div>

                  <div className="partText">
                    <b>{part.title}</b>
                    <span>
                      {selected?.id===part.id&&products.length
                        ?products[0].product_code
                        :"OEM otomatik"}
                    </span>
                  </div>

                  <span className="chevron">›</span>
                </button>
              ))}
            </div>
          </div>

          <div className="selectedCard">
            <div className="selectedTitle">SEÇİLEN PARÇA BİLGİLERİ</div>

            {selected?(
              <>
                <div className="selectedTop">
                  <div className="selectedPartVisual">
                    <div className="visualPart"/>
                  </div>

                  <div>
                    <h3>{selected.title}</h3>
                    <p>
                      OEM No:{" "}
                      <b>
                        {loadingProducts
                          ?"Aranıyor…"
                          :selectedProduct?.product_code||"Bulunamadı"}
                      </b>
                    </p>
                    <p>
                      Durum:{" "}
                      <span className="stock">
                        ● {selectedProduct?.stock
                          ?`Stokta (${selectedProduct.stock})`
                          :"Kontrol Edilecek"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="price">
                  {selectedProduct
                    ?money(selectedProduct.sale_price)
                    :"—"}
                </div>

                {selectedProduct?(
                  <a
                    className="cartButton"
                    href={`/urun/${selectedProduct.id}`}
                  >
                    🛒 Ürüne Git
                  </a>
                ):(
                  <button className="cartButton disabled" disabled>
                    Ürün Bulunamadı
                  </button>
                )}

                <button className="favoriteButton">
                  ☆ Favorilere Ekle
                </button>
              </>
            ):(
              <div className="emptySelected">
                3D araçtan veya sağdaki listeden bir parça seç.
              </div>
            )}
          </div>
        </aside>
      </section>

      <style jsx>{`
        .catalogPage{
          background:#f3f4f6;
          min-height:100vh;
          color:#171717;
          font-family:Arial,Helvetica,sans-serif;
        }

        .vehicleToolbar{
          display:flex;
          gap:14px;
          padding:14px 18px;
          background:#fff;
          border-bottom:1px solid #dedede;
        }

        .selectBox{
          width:245px;
          min-height:52px;
          display:flex;
          align-items:center;
          gap:10px;
          padding:8px 12px;
          border:1px solid #ddd;
          border-radius:7px;
          background:#fff;
        }

        .selectBox.compact{width:190px}
        .selectBox small{
          display:block;
          font-size:9px;
          color:#888;
          margin-bottom:2px;
        }
        .selectBox b{font-size:13px}
        .fiatDot{
          width:34px;height:34px;border-radius:50%;
          display:grid;place-items:center;
          background:#c90019;color:#fff;
          font-weight:900;font-size:10px;
          border:3px solid #ddd;
        }
        .arrow{margin-left:auto;color:#999}

        .breadcrumb{
          padding:10px 18px;
          font-size:12px;
          color:#666;
          background:#fff;
          border-bottom:1px solid #e5e5e5;
        }
        .breadcrumb span{margin:0 7px}

        .workbench{
          display:grid;
          grid-template-columns:230px minmax(600px,1fr) 300px;
          gap:12px;
          padding:12px;
        }

        .leftColumn,.rightColumn{
          display:flex;
          flex-direction:column;
          gap:12px;
        }

        .darkCard{
          background:#202225;
          color:#fff;
          border-radius:7px;
          overflow:hidden;
          border:1px solid #111;
        }

        .darkTitle{
          padding:13px 14px;
          font-size:11px;
          font-weight:900;
          border-bottom:1px solid #333;
        }

        .groupButton{
          width:100%;
          min-height:45px;
          display:grid;
          grid-template-columns:26px 1fr 20px;
          align-items:center;
          gap:4px;
          border:0;
          border-bottom:1px solid #343434;
          background:#242629;
          color:#fff;
          text-align:left;
          padding:0 12px;
          cursor:pointer;
          font-weight:700;
          font-size:12px;
        }

        .groupButton.active{
          background:linear-gradient(90deg,#c90019,#e03035);
        }

        .groupIcon{opacity:.85}

        .vehicleInfo{
          padding-bottom:8px;
        }

        .infoRow{
          display:grid;
          grid-template-columns:90px 1fr;
          gap:8px;
          padding:7px 14px;
          font-size:11px;
        }
        .infoRow span:first-child{color:#bbb}
        .infoRow span:last-child{font-weight:700}

        .viewOptions{padding-bottom:10px}
        .toggleRow,.fullscreenButton{
          width:100%;
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:9px 14px;
          border:0;
          background:transparent;
          color:#fff;
          font-size:11px;
          cursor:pointer;
        }

        .switch{
          width:31px;
          height:17px;
          border-radius:20px;
          background:#65676b;
          padding:2px;
          transition:.2s;
        }
        .switch i{
          width:13px;height:13px;
          display:block;
          border-radius:50%;
          background:#fff;
          transition:.2s;
        }
        .switch.on{background:#d71920}
        .switch.on i{transform:translateX(14px)}

        .centerColumn{
          display:flex;
          flex-direction:column;
          gap:10px;
          min-width:0;
        }

        .viewerCard{
          position:relative;
          height:520px;
          background:#fff;
          border:1px solid #ddd;
          border-radius:7px;
          overflow:hidden;
        }

        .viewer{
          width:100%;
          height:100%;
          position:relative;
        }

        .loading{
          position:absolute;
          inset:0;
          display:grid;
          place-items:center;
          background:#f5f5f5;
          font-weight:800;
          z-index:2;
        }

        .viewerTools{
          position:absolute;
          z-index:5;
          top:12px;
          left:12px;
          display:flex;
          gap:5px;
        }

        .viewerTools button{
          width:38px;height:38px;
          border:1px solid #ddd;
          border-radius:5px;
          background:#fff;
          cursor:pointer;
          font-size:16px;
        }

        .viewStrip{
          display:grid;
          grid-template-columns:repeat(6,1fr);
          gap:8px;
        }

        .viewThumb{
          background:#fff;
          border:1px solid #ddd;
          border-radius:6px;
          padding:6px;
          cursor:pointer;
        }

        .viewThumb.active{
          border:2px solid #e32a30;
          padding:5px;
        }

        .viewThumb span{
          display:block;
          text-align:center;
          font-size:10px;
          margin-top:4px;
        }

        .miniCar{
          height:68px;
          display:grid;
          place-items:center;
          background:linear-gradient(#fafafa,#f2f2f2);
          border-radius:4px;
        }

        .miniCarShape{
          width:78%;
          height:34px;
          background:#cf2026;
          border-radius:18px 12px 8px 8px;
          box-shadow:inset 0 -8px 0 #1f1f1f;
          position:relative;
          transform:skewX(-5deg);
        }

        .miniCarShape:before,.miniCarShape:after{
          content:"";
          position:absolute;
          width:15px;height:15px;
          border-radius:50%;
          background:#252525;
          bottom:-5px;
        }
        .miniCarShape:before{left:10px}
        .miniCarShape:after{right:10px}
        .miniCarShape.front{transform:scaleX(.6)}
        .miniCarShape.side{transform:none}
        .miniCarShape.rear{transform:scaleX(.6)}
        .miniCarShape.top34{transform:rotate(-12deg) skewX(-6deg)}

        .explodedCard{
          background:#fff;
          border:1px solid #ddd;
          border-radius:7px;
          overflow:hidden;
          min-height:320px;
        }

        .explodedHeader{
          display:flex;
          justify-content:space-between;
          padding:12px 14px;
          border-bottom:1px solid #eee;
        }
        .explodedHeader b{font-size:12px;color:#d71920}
        .explodedHeader span{font-size:10px;color:#777}

        .explodedContent{
          height:275px;
          display:grid;
          place-items:center;
          background:linear-gradient(#fff,#f7f7f7);
        }

        .ghostVehicle{
          width:520px;
          max-width:90%;
          height:190px;
          position:relative;
        }

        .ghostCarBody{
          position:absolute;
          left:150px;top:45px;
          width:220px;height:105px;
          border-radius:40px 20px 15px 18px;
          background:#b52a2e;
          box-shadow:inset 0 -24px 0 #202020;
        }

        .ghostPart{
          position:absolute;
          background:#cf2026;
          border:2px solid #8d1518;
          border-radius:8px;
        }
        .p1{width:90px;height:26px;left:20px;top:110px}
        .p2{width:65px;height:45px;left:70px;top:65px}
        .p3{width:70px;height:55px;right:35px;top:75px}
        .p4{width:55px;height:72px;right:95px;top:115px}
        .p5{width:50px;height:65px;right:165px;top:120px}
        .p6{width:52px;height:70px;left:105px;top:120px}
        .p7{width:80px;height:18px;right:15px;bottom:5px}

        .rightColumn{
          min-width:0;
        }

        .partsCard,.selectedCard{
          background:#fff;
          border:1px solid #ddd;
          border-radius:7px;
          overflow:hidden;
        }

        .partsHeader{
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:12px;
          border-bottom:1px solid #ddd;
        }
        .partsHeader small{
          display:block;color:#888;font-size:9px;
        }
        .partsHeader h3{margin:2px 0 0;font-size:15px}
        .partsHeader>span{font-size:10px;color:#888}

        .partsList{
          max-height:610px;
          overflow:auto;
        }

        .partRow{
          width:100%;
          display:grid;
          grid-template-columns:38px 1fr 18px;
          gap:8px;
          align-items:center;
          border:0;
          border-bottom:1px solid #eee;
          background:#fff;
          padding:9px 10px;
          cursor:pointer;
          text-align:left;
        }

        .partRow.selected{
          background:#fff0f1;
        }

        .partIcon{
          width:34px;height:34px;
          border-radius:50%;
          display:grid;place-items:center;
          background:#f0f0f0;
          color:#444;
        }

        .partText b{
          display:block;
          font-size:11px;
        }
        .partText span{
          display:block;
          margin-top:3px;
          font-size:9px;
          color:#999;
          font-family:monospace;
        }

        .chevron{color:#999;font-size:18px}

        .selectedCard{
          padding:12px;
        }

        .selectedTitle{
          font-size:10px;
          font-weight:900;
          margin-bottom:12px;
        }

        .selectedTop{
          display:grid;
          grid-template-columns:82px 1fr;
          gap:10px;
        }

        .selectedPartVisual{
          height:70px;
          background:#f4f4f4;
          border-radius:6px;
          display:grid;
          place-items:center;
        }

        .visualPart{
          width:65px;height:28px;
          border-radius:50% 50% 15% 15%;
          background:#c9272d;
          box-shadow:inset 0 -5px 0 #971419;
        }

        .selectedTop h3{
          margin:0 0 7px;
          font-size:14px;
        }

        .selectedTop p{
          margin:4px 0;
          font-size:9px;
          color:#666;
        }

        .stock{color:#218a42;font-weight:700}

        .price{
          text-align:right;
          color:#d71920;
          font-size:19px;
          font-weight:900;
          margin:12px 0;
        }

        .cartButton,.favoriteButton{
          width:100%;
          min-height:39px;
          border-radius:5px;
          display:grid;
          place-items:center;
          text-decoration:none;
          font-weight:900;
          font-size:11px;
        }

        .cartButton{
          border:0;
          background:#d71920;
          color:#fff;
        }

        .cartButton.disabled{
          opacity:.5;
        }

        .favoriteButton{
          border:1px solid #ddd;
          background:#fff;
          color:#777;
          margin-top:7px;
        }

        .emptySelected{
          padding:20px 5px;
          font-size:11px;
          color:#777;
        }

        @media(max-width:1200px){
          .workbench{
            grid-template-columns:210px minmax(520px,1fr);
          }
          .rightColumn{
            grid-column:1/-1;
            display:grid;
            grid-template-columns:1fr 320px;
          }
        }

        @media(max-width:800px){
          .vehicleToolbar{
            overflow:auto;
          }
          .workbench{
            display:block;
          }
          .leftColumn,.centerColumn,.rightColumn{
            margin-bottom:12px;
          }
          .rightColumn{
            display:block;
          }
          .viewerCard{height:480px}
          .viewStrip{
            grid-template-columns:repeat(3,1fr);
          }
        }
      `}</style>
    </div>
  );
}

function Info({label,value}:{label:string;value:string}){
  return (
    <div className="infoRow">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onClick
}:{
  label:string;
  checked:boolean;
  onClick:()=>void;
}){
  return (
    <button
      type="button"
      className="toggleRow"
      onClick={onClick}
    >
      <span>{label}</span>
      <span className={checked?"switch on":"switch"}>
        <i/>
      </span>
    </button>
  );
}
