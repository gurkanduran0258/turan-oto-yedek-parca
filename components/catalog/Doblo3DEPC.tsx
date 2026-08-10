"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {
  GROUPS,
  PARTS,
  partForMesh,
  isBodyMesh,
  isWheelMesh,
  type GroupId,
  type CatalogPart
} from "@/lib/doblo-3d-catalog";
import s from "./Doblo3DEPC.module.css";

type Product={
  id:number|string;
  product_code:string;
  product_name:string;
  sale_price:number;
  stock:number;
  image_url:string|null;
};

type MeshState={
  mesh:THREE.Mesh;
  position:THREE.Vector3;
  material:THREE.Material|THREE.Material[];
  visible:boolean;
};

function money(v:number){
  return new Intl.NumberFormat("tr-TR",{
    style:"currency",
    currency:"TRY",
    minimumFractionDigits:2
  }).format(Number(v||0));
}

export default function Doblo3DEPC(){
  const mount=useRef<HTMLDivElement>(null);

  const api=useRef<{
    setGroup:(g:GroupId)=>void;
    select:(p:CatalogPart|null)=>void;
    setExploded:(v:boolean)=>void;
    setXray:(v:boolean)=>void;
    reset:()=>void;
  }|null>(null);

  const [group,setGroup]=useState<GroupId>("dis-govde");
  const [selected,setSelected]=useState<CatalogPart|null>(PARTS[0]);
  const [exploded,setExploded]=useState(false);
  const [xray,setXray]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [product,setProduct]=useState<Product|null>(null);
  const [loadingProduct,setLoadingProduct]=useState(false);

  const groupParts=useMemo(
    ()=>PARTS.filter(p=>p.group===group),
    [group]
  );

  useEffect(()=>{
    let alive=true;
    const oem=selected?.oem?.trim();

    setProduct(null);

    if(!oem){
      setLoadingProduct(false);
      return()=>{alive=false};
    }

    setLoadingProduct(true);

    fetch(`/api/catalog-product?oem=${encodeURIComponent(oem)}`,{
      cache:"no-store"
    })
      .then(r=>r.json())
      .then(data=>{
        if(alive)setProduct(data?.product||null);
      })
      .catch(()=>{
        if(alive)setProduct(null);
      })
      .finally(()=>{
        if(alive)setLoadingProduct(false);
      });

    return()=>{alive=false};
  },[selected?.id,selected?.oem]);

  useEffect(()=>{
    if(!mount.current)return;

    const el=mount.current;
    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0xf6f6f6);

    const camera=new THREE.PerspectiveCamera(
      34,
      Math.max(el.clientWidth,1)/Math.max(el.clientHeight,1),
      .05,
      100
    );
    camera.position.set(6.6,3.4,7.2);

    const renderer=new THREE.WebGLRenderer({
      antialias:true,
      powerPreference:"high-performance"
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    renderer.setSize(el.clientWidth,el.clientHeight);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;
    controls.enablePan=false;
    controls.minDistance=4.0;
    controls.maxDistance=14;
    controls.target.set(0,1.05,0);

    scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.3));
    const sun=new THREE.DirectionalLight(0xffffff,3.2);
    sun.position.set(5,8,6);
    scene.add(sun);

    const grid=new THREE.GridHelper(13,26,0xd2d2d2,0xe8e8e8);
    grid.position.y=0;
    scene.add(grid);

    const states:MeshState[]=[];
    const clickable:THREE.Mesh[]=[];
    const materialCache=new Map<string,THREE.Material>();

    let currentGroup:GroupId="dis-govde";
    let currentExploded=false;
    let currentXray=false;
    let currentSelected:CatalogPart|null=null;

    function cloneOpacity(m:THREE.Material,opacity:number){
      const key=`${m.uuid}:${opacity}`;
      const cached=materialCache.get(key);
      if(cached)return cached;

      const c=m.clone() as THREE.MeshStandardMaterial;
      c.transparent=opacity<1;
      c.opacity=opacity;
      c.depthWrite=opacity>.4;
      materialCache.set(key,c);
      return c;
    }

    function setOpacity(mesh:THREE.Mesh,opacity:number){
      const st=states.find(x=>x.mesh===mesh);
      if(!st)return;

      mesh.material=Array.isArray(st.material)
        ?st.material.map(m=>cloneOpacity(m,opacity))
        :cloneOpacity(st.material,opacity);
    }

    function restore(){
      for(const st of states){
        st.mesh.position.copy(st.position);
        st.mesh.material=st.material;
        st.mesh.visible=st.visible;
      }
    }

    function explode(){
      if(!currentExploded)return;

      const moves:{terms:string[];delta:THREE.Vector3}[]=[
        {terms:["hood"],delta:new THREE.Vector3(0,.55,.35)},
        {terms:["front_bumper"],delta:new THREE.Vector3(0,.80,-.02)},
        {terms:["front_grille","front_lower_grille"],delta:new THREE.Vector3(0,.95,.03)},
        {terms:["headlight_left"],delta:new THREE.Vector3(-.38,.55,.12)},
        {terms:["headlight_right"],delta:new THREE.Vector3(.38,.55,.12)},
        {terms:["front_fender_left"],delta:new THREE.Vector3(-.42,.15,.05)},
        {terms:["front_fender_right"],delta:new THREE.Vector3(.42,.15,.05)},
        {terms:["front_door_left"],delta:new THREE.Vector3(-.55,0,.05)},
        {terms:["front_door_right"],delta:new THREE.Vector3(.55,0,.05)},
        {terms:["sliding_door_left"],delta:new THREE.Vector3(-.65,-.08,.02)},
        {terms:["sliding_door_right"],delta:new THREE.Vector3(.65,-.08,.02)},
        {terms:["rear_door"],delta:new THREE.Vector3(0,-.70,.12)},
        {terms:["rear_bumper"],delta:new THREE.Vector3(0,-.75,-.02)},
        {terms:["taillight_left"],delta:new THREE.Vector3(-.32,-.38,.05)},
        {terms:["taillight_right"],delta:new THREE.Vector3(.32,-.38,.05)},
        {terms:["mechanical_radiator"],delta:new THREE.Vector3(0,.30,0)},
        {terms:["mechanical_intercooler"],delta:new THREE.Vector3(0,.45,-.05)},
      ];

      for(const move of moves){
        for(const st of states){
          const n=st.mesh.name.toLowerCase();
          if(move.terms.some(t=>n.includes(t))){
            st.mesh.position.copy(st.position).add(move.delta);
          }
        }
      }
    }

    function applyGroup(g:GroupId){
      currentGroup=g;
      restore();

      for(const st of states){
        const n=st.mesh.name.toLowerCase();
        const p=partForMesh(n);
        const body=isBodyMesh(n);
        const wheel=isWheelMesh(n);
        const mech=n.includes("mechanical_");

        if(g==="dis-govde"){
          st.mesh.visible=!mech;
        }

        if(g==="on-grup"){
          st.mesh.visible=
            body||wheel||
            n.includes("mechanical_radiator")||
            n.includes("mechanical_intercooler");

          if(body&&p?.group!=="on-grup"){
            setOpacity(st.mesh,currentXray?.08:.18);
          }
        }

        if(g==="arka-grup"){
          st.mesh.visible=body||wheel;
          if(body&&p?.group!=="arka-grup"){
            setOpacity(st.mesh,currentXray?.08:.18);
          }
        }

        if(g==="motor"){
          const wanted=
            n.includes("mechanical_engine")||
            n.includes("mechanical_transmission");
          st.mesh.visible=body||wheel||wanted;
          if(body)setOpacity(st.mesh,currentXray?.04:.09);
        }

        if(g==="on-takim"){
          const wanted=n.includes("mechanical_front_");
          st.mesh.visible=body||wheel||wanted;
          if(body)setOpacity(st.mesh,currentXray?.04:.09);
        }

        if(g==="arka-takim"){
          const wanted=n.includes("mechanical_rear_");
          st.mesh.visible=body||wheel||wanted;
          if(body)setOpacity(st.mesh,currentXray?.04:.09);
        }
      }

      explode();

      if(currentSelected){
        highlight(currentSelected);
      }
    }

    function highlight(part:CatalogPart){
      currentSelected=part;

      for(const st of states){
        const n=st.mesh.name.toLowerCase();
        if(!part.match.some(m=>n.includes(m.toLowerCase())))continue;

        const hi=(mat:THREE.Material)=>{
          const key=`hi:${mat.uuid}`;
          const cached=materialCache.get(key);
          if(cached)return cached;

          const c=mat.clone() as THREE.MeshStandardMaterial;
          if("emissive" in c){
            c.emissive=new THREE.Color(0xff2b35);
            c.emissiveIntensity=1.1;
          }
          materialCache.set(key,c);
          return c;
        };

        st.mesh.material=Array.isArray(st.material)
          ?st.material.map(hi)
          :hi(st.material);
      }
    }

    function selectPart(part:CatalogPart|null){
      currentSelected=part;
      applyGroup(currentGroup);
      if(part)highlight(part);
    }

    const loader=new GLTFLoader();
    loader.load(
      "/models/fiat-doblo-263-epc.glb",
      gltf=>{
        const rootObj=gltf.scene;
        scene.add(rootObj);

        rootObj.traverse(o=>{
          if(!(o instanceof THREE.Mesh))return;

          states.push({
            mesh:o,
            position:o.position.clone(),
            material:o.material,
            visible:o.visible
          });

          if(partForMesh(o.name)){
            clickable.push(o);
          }
        });

        const box=new THREE.Box3().setFromObject(rootObj);
        const size=box.getSize(new THREE.Vector3());
        const scale=6.8/Math.max(size.x,size.y,size.z);
        rootObj.scale.setScalar(scale);
        rootObj.updateMatrixWorld(true);

        const fitted=new THREE.Box3().setFromObject(rootObj);
        const center=fitted.getCenter(new THREE.Vector3());

        rootObj.position.x-=center.x;
        rootObj.position.z-=center.z;
        rootObj.position.y-=fitted.min.y;
        rootObj.updateMatrixWorld(true);

        applyGroup("dis-govde");
        setLoaded(true);
      }
    );

    const raycaster=new THREE.Raycaster();
    const mouse=new THREE.Vector2();

    function onPointer(event:PointerEvent){
      const rect=renderer.domElement.getBoundingClientRect();
      mouse.x=((event.clientX-rect.left)/rect.width)*2-1;
      mouse.y=-((event.clientY-rect.top)/rect.height)*2+1;

      raycaster.setFromCamera(mouse,camera);

      const hits=raycaster.intersectObjects(
        clickable.filter(mesh=>{
          if(!mesh.visible)return false;
          const p=partForMesh(mesh.name);
          return p?.group===currentGroup;
        }),
        false
      );

      if(!hits.length)return;

      const part=partForMesh(hits[0].object.name);
      if(!part)return;

      setSelected(part);
      selectPart(part);
    }

    renderer.domElement.addEventListener("pointerdown",onPointer);

    const resize=new ResizeObserver(()=>{
      camera.aspect=
        Math.max(el.clientWidth,1)/Math.max(el.clientHeight,1);
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth,el.clientHeight);
    });
    resize.observe(el);

    api.current={
      setGroup:g=>applyGroup(g),
      select:selectPart,
      setExploded:v=>{
        currentExploded=v;
        applyGroup(currentGroup);
      },
      setXray:v=>{
        currentXray=v;
        applyGroup(currentGroup);
      },
      reset:()=>{
        camera.position.set(6.6,3.4,7.2);
        controls.target.set(0,1.05,0);
        controls.update();
      }
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
      renderer.dispose();
      el.innerHTML="";
      api.current=null;
    };
  },[]);

  function chooseGroup(g:GroupId){
    setGroup(g);
    setSelected(PARTS.find(p=>p.group===g)||null);
    api.current?.setGroup(g);
  }

  function choosePart(part:CatalogPart){
    setSelected(part);
    api.current?.select(part);
  }

  function toggleExploded(){
    const next=!exploded;
    setExploded(next);
    api.current?.setExploded(next);
  }

  function toggleXray(){
    const next=!xray;
    setXray(next);
    api.current?.setXray(next);
  }

  return (
    <div className={s.page}>
      <div className={s.topbar}>
        <div className={s.brand}>
          <span className={s.logo}>FIAT</span>
          <div>
            <small>ARAÇ</small>
            <b>Fiat Doblo 2015–2023 (263)</b>
          </div>
        </div>
        <div className={s.mode}>
          Gerçek 3D Parça Kataloğu
        </div>
      </div>

      <div className={s.layout}>
        <aside className={s.left}>
          <section className={s.darkCard}>
            <h3>KATALOG BÖLÜMLERİ</h3>
            {GROUPS.map(g=>(
              <button
                key={g.id}
                className={group===g.id?s.active:""}
                onClick={()=>chooseGroup(g.id)}
              >
                <span>◉</span>
                <b>{g.title}</b>
                <span>›</span>
              </button>
            ))}
          </section>

          <section className={s.darkCard}>
            <h3>ARAÇ BİLGİLERİ</h3>
            <Info a="Marka" b="Fiat"/>
            <Info a="Model" b="Doblo"/>
            <Info a="Kasa" b="263"/>
            <Info a="Üretim" b="2015–2023"/>
            <Info a="Yakıt" b="Dizel / Benzin"/>
            <Info a="Tip" b="MPV / Ticari"/>
          </section>

          <section className={s.darkCard}>
            <h3>GÖRÜNÜM</h3>
            <Toggle
              label="X-Ray Mod"
              on={xray}
              click={toggleXray}
            />
            <Toggle
              label="Exploded View"
              on={exploded}
              click={toggleExploded}
            />
            <button
              className={s.reset}
              onClick={()=>api.current?.reset()}
            >
              Kamerayı Sıfırla
            </button>
          </section>
        </aside>

        <main className={s.center}>
          <section className={s.viewer}>
            {!loaded&&(
              <div className={s.loading}>
                3D Doblo yükleniyor…
              </div>
            )}
            <div ref={mount} className={s.mount}/>
            <div className={s.hint}>
              Sol tuş: döndür • Tekerlek: yakınlaştır • Parçaya tıkla
            </div>
          </section>
        </main>

        <aside className={s.right}>
          <section className={s.partsCard}>
            <header>
              <div>
                <small>KATEGORİ</small>
                <h2>
                  {GROUPS.find(g=>g.id===group)?.title}
                </h2>
              </div>
              <span>{groupParts.length} Parça</span>
            </header>

            <div className={s.parts}>
              {groupParts.map(part=>(
                <button
                  key={part.id}
                  onClick={()=>choosePart(part)}
                  className={selected?.id===part.id?s.selectedRow:""}
                >
                  <span className={s.dot}/>
                  <span>
                    <b>{part.title}</b>
                    <small>
                      {part.oem||"OEM eşleştirme bekliyor"}
                    </small>
                  </span>
                  <span>›</span>
                </button>
              ))}
            </div>
          </section>

          <section className={s.selectedCard}>
            <h3>SEÇİLEN PARÇA</h3>

            {selected?(
              <>
                <h2>{selected.title}</h2>
                <p>
                  OEM: <b>{selected.oem||"Henüz eşleştirilmedi"}</b>
                </p>
                <p>
                  Durum:{" "}
                  <strong className={
                    product&&Number(product.stock)>0
                      ?s.inStock
                      :s.noStock
                  }>
                    {!selected.oem
                      ?"OEM bekleniyor"
                      :loadingProduct
                        ?"Kontrol ediliyor…"
                        :product&&Number(product.stock)>0
                          ?`● Stokta (${product.stock})`
                          :"Stok kaydı yok"}
                  </strong>
                </p>

                <div className={s.price}>
                  {product?money(product.sale_price):"—"}
                </div>

                {product?(
                  <a
                    href={`/urun/${product.id}`}
                    className={s.productButton}
                  >
                    Ürüne Git
                  </a>
                ):(
                  <button
                    disabled
                    className={`${s.productButton} ${s.disabled}`}
                  >
                    Ürün Bulunamadı
                  </button>
                )}
              </>
            ):(
              <p>Bir parça seç.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Info({a,b}:{a:string;b:string}){
  return (
    <div className={s.info}>
      <span>{a}</span>
      <b>{b}</b>
    </div>
  );
}

function Toggle({
  label,on,click
}:{
  label:string;
  on:boolean;
  click:()=>void;
}){
  return (
    <button
      className={s.toggle}
      onClick={click}
    >
      <span>{label}</span>
      <i className={on?s.toggleOn:""}>
        <u/>
      </i>
    </button>
  );
}
