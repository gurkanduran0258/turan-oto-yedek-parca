"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import * as THREE from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";

import {
  GROUPS,
  PARTS,
  partsForGroup,
  partForMeshInGroup,
  meshBelongsToPart,
  isMechanical,
  isWheel,
  isInterior,
  isExterior,
  type GroupId,
  type CatalogPart
} from "@/lib/egea-real-epc";

import s from "./EgeaRealEPC.module.css";

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
  basePosition:THREE.Vector3;
  baseMaterial:THREE.Material|THREE.Material[];
  baseVisible:boolean;
};

function money(value:number){
  return new Intl.NumberFormat("tr-TR",{
    style:"currency",
    currency:"TRY",
    minimumFractionDigits:2
  }).format(Number(value||0));
}

export default function EgeaRealEPC(){
  const mount=useRef<HTMLDivElement>(null);

  const engine=useRef<{
    setGroup:(group:GroupId)=>void;
    select:(part:CatalogPart|null)=>void;
    setExploded:(value:boolean)=>void;
    setXray:(value:boolean)=>void;
    resetCamera:()=>void;
    focusFront:()=>void;
    focusRear:()=>void;
  }|null>(null);

  const [group,setGroup]=useState<GroupId>("dis-govde");
  const [selected,setSelected]=useState<CatalogPart|null>(
    partsForGroup("dis-govde")[0]||null
  );
  const [exploded,setExploded]=useState(false);
  const [xray,setXray]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [loadError,setLoadError]=useState<string|null>(null);

  const [product,setProduct]=useState<Product|null>(null);
  const [loadingProduct,setLoadingProduct]=useState(false);

  const groupParts=useMemo(
    ()=>partsForGroup(group),
    [group]
  );

  useEffect(()=>{
    let active=true;

    setProduct(null);

    const oem=selected?.oem?.trim();
    if(!oem){
      setLoadingProduct(false);
      return()=>{active=false};
    }

    setLoadingProduct(true);

    fetch(
      `/api/catalog-product?oem=${encodeURIComponent(oem)}`,
      {cache:"no-store"}
    )
      .then(r=>r.json())
      .then(data=>{
        if(active)setProduct(data?.product||null);
      })
      .catch(()=>{
        if(active)setProduct(null);
      })
      .finally(()=>{
        if(active)setLoadingProduct(false);
      });

    return()=>{active=false};
  },[selected?.id,selected?.oem]);

  useEffect(()=>{
    if(!mount.current)return;

    const el=mount.current;

    const scene=new THREE.Scene();
    scene.background=new THREE.Color(0xf5f5f5);

    const camera=new THREE.PerspectiveCamera(
      32,
      Math.max(el.clientWidth,1)/Math.max(el.clientHeight,1),
      0.01,
      100
    );

    const renderer=new THREE.WebGLRenderer({
      antialias:false,
      powerPreference:"high-performance"
    });
    renderer.setPixelRatio(1);
    renderer.setSize(el.clientWidth,el.clientHeight);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.shadowMap.enabled=false;

    el.appendChild(renderer.domElement);

    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;
    controls.dampingFactor=.08;
    controls.enablePan=false;
    controls.minDistance=3;
    controls.maxDistance=15;

    scene.add(
      new THREE.HemisphereLight(
        0xffffff,
        0x777777,
        2.5
      )
    );

    const keyLight=new THREE.DirectionalLight(0xffffff,3.2);
    keyLight.position.set(5,8,6);
    scene.add(keyLight);

    const fillLight=new THREE.DirectionalLight(0xffffff,1.3);
    fillLight.position.set(-5,4,-4);
    scene.add(fillLight);

    const grid=new THREE.GridHelper(
      14,
      28,
      0xd3d3d3,
      0xe7e7e7
    );
    grid.position.y=0;
    scene.add(grid);

    const states:MeshState[]=[];
    const clickable:THREE.Mesh[]=[];
    const clonedMaterials=new Set<THREE.Material>();

    let modelRoot:THREE.Object3D|null=null;
    let modelCenter=new THREE.Vector3();

    let currentGroup:GroupId="dis-govde";
    let currentPart:CatalogPart|null=
      partsForGroup("dis-govde")[0]||null;

    let currentExploded=false;
    let currentXray=false;

    function restoreAll(){
      for(const state of states){
        state.mesh.position.copy(state.basePosition);
        state.mesh.material=state.baseMaterial;
        state.mesh.visible=state.baseVisible;
      }
    }

    function transparentMaterial(
      material:THREE.Material,
      opacity:number
    ){
      const clone=material.clone() as THREE.MeshStandardMaterial;
      clone.transparent=true;
      clone.opacity=opacity;
      clone.depthWrite=opacity>.35;

      clonedMaterials.add(clone);
      return clone;
    }

    function applyOpacity(
      mesh:THREE.Mesh,
      opacity:number
    ){
      const state=states.find(x=>x.mesh===mesh);
      if(!state)return;

      mesh.material=Array.isArray(state.baseMaterial)
        ?state.baseMaterial.map(
          material=>transparentMaterial(material,opacity)
        )
        :transparentMaterial(state.baseMaterial,opacity);
    }

    function highlightPart(part:CatalogPart){
      for(const state of states){
        if(!meshBelongsToPart(state.mesh.name,part))continue;

        const makeHighlight=(material:THREE.Material)=>{
          const clone=material.clone() as THREE.MeshStandardMaterial;

          if("emissive" in clone){
            clone.emissive=new THREE.Color(0xff1727);
            clone.emissiveIntensity=1.1;
          }

          clonedMaterials.add(clone);
          return clone;
        };

        state.mesh.material=Array.isArray(state.baseMaterial)
          ?state.baseMaterial.map(makeHighlight)
          :makeHighlight(state.baseMaterial);
      }
    }

    function explodeGroup(){
      if(!currentExploded)return;

      const groupMeshes=states.filter(state=>{
        return !!partForMeshInGroup(
          state.mesh.name,
          currentGroup
        );
      });

      for(const state of groupMeshes){
        const box=new THREE.Box3().setFromObject(state.mesh);
        const center=box.getCenter(new THREE.Vector3());

        const direction=center
          .clone()
          .sub(modelCenter);

        // Width / length based explosion.
        if(direction.lengthSq()<.0001){
          direction.set(0,1,0);
        }

        direction.normalize();

        // Keep explosion mostly horizontal but add slight lift.
        direction.y=Math.max(direction.y,.18);
        direction.normalize();

        const amount=
          currentGroup==="dis-govde" ? .52 :
          currentGroup==="on-grup" ? .44 :
          currentGroup==="arka-grup" ? .44 :
          .34;

        state.mesh.position
          .copy(state.basePosition)
          .add(direction.multiplyScalar(amount));
      }
    }

    function applyGroup(groupId:GroupId){
      currentGroup=groupId;
      restoreAll();

      for(const state of states){
        const name=state.mesh.name;

        const groupPart=partForMeshInGroup(
          name,
          groupId
        );

        const wheel=isWheel(name);
        const mechanical=isMechanical(name);
        const interior=isInterior(name);
        const exterior=isExterior(name);

        if(groupId==="dis-govde"){
          state.mesh.visible=
            exterior || wheel || interior;

          if(currentXray&&
             exterior&&
             !groupPart&&
             !wheel){
            applyOpacity(state.mesh,.22);
          }
        }

        if(groupId==="on-grup"){
          state.mesh.visible=
            exterior ||
            wheel ||
            !!groupPart;

          if(exterior&&!groupPart&&!wheel){
            applyOpacity(
              state.mesh,
              currentXray?.06:.15
            );
          }
        }

        if(groupId==="arka-grup"){
          state.mesh.visible=
            exterior ||
            wheel ||
            !!groupPart;

          if(exterior&&!groupPart&&!wheel){
            applyOpacity(
              state.mesh,
              currentXray?.06:.15
            );
          }
        }

        if(groupId==="motor-sanziman"){
          state.mesh.visible=
            mechanical ||
            exterior ||
            wheel;

          if(exterior){
            applyOpacity(
              state.mesh,
              currentXray?.035:.08
            );
          }

          if(
            mechanical &&
            !groupPart
          ){
            applyOpacity(state.mesh,.18);
          }
        }

        if(groupId==="on-takim"){
          const frontMechanical=
            /_F_|strut_F|hub_F|swaybar_F|tierod_F|halfshaft_F|subframe_F|lowerarm_F/i
              .test(name);

          state.mesh.visible=
            exterior ||
            wheel ||
            frontMechanical;

          if(exterior){
            applyOpacity(
              state.mesh,
              currentXray?.035:.08
            );
          }

          if(
            frontMechanical &&
            !groupPart
          ){
            applyOpacity(state.mesh,.22);
          }
        }

        if(groupId==="arka-takim"){
          const rearMechanical=
            /_R_|subframe_R|diff_|upperarm_R|trailingarm_R|swaybar_R|lowerarm_R|hub_R|halfshaft_R|coilover_R/i
              .test(name);

          state.mesh.visible=
            exterior ||
            wheel ||
            rearMechanical;

          if(exterior){
            applyOpacity(
              state.mesh,
              currentXray?.035:.08
            );
          }

          if(
            rearMechanical &&
            !groupPart
          ){
            applyOpacity(state.mesh,.22);
          }
        }
      }

      explodeGroup();

      if(currentPart&&
         currentPart.group===currentGroup){
        highlightPart(currentPart);
      }
    }

    function selectPart(part:CatalogPart|null){
      currentPart=part;
      applyGroup(currentGroup);

      if(part){
        highlightPart(part);
      }
    }

    function fitCamera(
      position:THREE.Vector3
    ){
      camera.position.copy(position);
      controls.target.copy(modelCenter);
      controls.update();
    }

    const loader=new GLTFLoader();
    let loadFinished=false;
    const loadTimeout=window.setTimeout(()=>{
      if(!loadFinished){
        setLoadError("3D model 20 saniye içinde yüklenemedi. Model dosyası veya sunucu yanıtı kontrol edilmeli.");
      }
    },20000);

    loader.load(
      "/models/fiat-egea-real-epc.glb",
      gltf=>{
        loadFinished=true;
        window.clearTimeout(loadTimeout);
        setLoadError(null);
        modelRoot=gltf.scene;
        scene.add(modelRoot);

        modelRoot.traverse(object=>{
          if(!(object instanceof THREE.Mesh))return;

          states.push({
            mesh:object,
            basePosition:object.position.clone(),
            baseMaterial:object.material,
            baseVisible:object.visible
          });

          if(
            PARTS.some(part=>
              meshBelongsToPart(
                object.name,
                part
              )
            )
          ){
            clickable.push(object);
          }
        });

        modelRoot.updateMatrixWorld(true);

        let bounds=new THREE.Box3()
          .setFromObject(modelRoot);

        const size=bounds.getSize(
          new THREE.Vector3()
        );

        const maxDim=Math.max(
          size.x,
          size.y,
          size.z
        );

        const scale=6.9/maxDim;
        modelRoot.scale.setScalar(scale);
        modelRoot.updateMatrixWorld(true);

        bounds=new THREE.Box3()
          .setFromObject(modelRoot);

        const center=bounds.getCenter(
          new THREE.Vector3()
        );

        modelRoot.position.x-=center.x;
        modelRoot.position.z-=center.z;
        modelRoot.position.y-=bounds.min.y;

        modelRoot.updateMatrixWorld(true);

        bounds=new THREE.Box3()
          .setFromObject(modelRoot);

        modelCenter=bounds.getCenter(
          new THREE.Vector3()
        );

        grid.position.y=bounds.min.y;

        // Model's real GLB orientation after normalization.
        fitCamera(
          new THREE.Vector3(
            6.2,
            3.4,
            -7.5
          )
        );

        applyGroup("dis-govde");
        setLoaded(true);
      },
      undefined,
      error=>{
        loadFinished=true;
        window.clearTimeout(loadTimeout);
        console.error("Egea GLB yüklenemedi",error);
        setLoadError("3D model yüklenemedi. /models/fiat-egea-real-epc.glb dosyasını kontrol edin.");
      }
    );

    const raycaster=new THREE.Raycaster();
    const pointer=new THREE.Vector2();

    function onPointerDown(event:PointerEvent){
      if(!loaded&&clickable.length===0){
        // GLB might have just loaded before React state updates.
      }

      const rect=renderer.domElement
        .getBoundingClientRect();

      pointer.x=
        ((event.clientX-rect.left)/rect.width)*2-1;

      pointer.y=
        -((event.clientY-rect.top)/rect.height)*2+1;

      raycaster.setFromCamera(
        pointer,
        camera
      );

      const groupClickable=
        clickable.filter(mesh=>{
          if(!mesh.visible)return false;

          return !!partForMeshInGroup(
            mesh.name,
            currentGroup
          );
        });

      const intersections=
        raycaster.intersectObjects(
          groupClickable,
          false
        );

      if(!intersections.length)return;

      const part=partForMeshInGroup(
        intersections[0].object.name,
        currentGroup
      );

      if(!part)return;

      setSelected(part);
      selectPart(part);
    }

    renderer.domElement.addEventListener(
      "pointerdown",
      onPointerDown
    );

    const observer=new ResizeObserver(()=>{
      camera.aspect=
        Math.max(el.clientWidth,1)/
        Math.max(el.clientHeight,1);

      camera.updateProjectionMatrix();

      renderer.setSize(
        el.clientWidth,
        el.clientHeight
      );
    });

    observer.observe(el);

    engine.current={
      setGroup:groupId=>{
        currentPart=
          partsForGroup(groupId)[0]||null;

        applyGroup(groupId);
      },

      select:selectPart,

      setExploded:value=>{
        currentExploded=value;
        applyGroup(currentGroup);
      },

      setXray:value=>{
        currentXray=value;
        applyGroup(currentGroup);
      },

      resetCamera:()=>{
        fitCamera(
          new THREE.Vector3(
            6.2,
            3.4,
            -7.5
          )
        );
      },

      focusFront:()=>{
        fitCamera(
          new THREE.Vector3(
            0,
            2.8,
            -9
          )
        );
      },

      focusRear:()=>{
        fitCamera(
          new THREE.Vector3(
            0,
            2.8,
            9
          )
        );
      }
    };

    let animation=0;

    const render=()=>{
      controls.update();
      renderer.render(scene,camera);
      animation=requestAnimationFrame(render);
    };

    render();

    return()=>{
      window.clearTimeout(loadTimeout);
      cancelAnimationFrame(animation);

      observer.disconnect();

      renderer.domElement.removeEventListener(
        "pointerdown",
        onPointerDown
      );

      controls.dispose();

      for(const material of clonedMaterials){
        material.dispose();
      }

      renderer.dispose();
      el.innerHTML="";
      engine.current=null;
    };
  },[]);

  function chooseGroup(next:GroupId){
    const first=partsForGroup(next)[0]||null;

    setGroup(next);
    setSelected(first);
    setExploded(false);

    engine.current?.setGroup(next);

    if(
      next==="arka-grup"||
      next==="arka-takim"
    ){
      engine.current?.focusRear();
    }else if(
      next==="on-grup"||
      next==="motor-sanziman"||
      next==="on-takim"
    ){
      engine.current?.focusFront();
    }
  }

  function choosePart(part:CatalogPart){
    setSelected(part);
    engine.current?.select(part);
  }

  function toggleExploded(){
    const next=!exploded;
    setExploded(next);
    engine.current?.setExploded(next);
  }

  function toggleXray(){
    const next=!xray;
    setXray(next);
    engine.current?.setXray(next);
  }

  return (
    <div className={s.page}>
      <section className={s.vehicleBar}>
        <div className={s.vehicleSelect}>
          <span className={s.fiat}>FIAT</span>
          <div>
            <small>ARAÇ</small>
            <b>Fiat Egea</b>
          </div>
          <span>⌄</span>
        </div>

        <div className={s.vehicleSelect}>
          <div>
            <small>KASA</small>
            <b>Tipo / Egea</b>
          </div>
          <span>⌄</span>
        </div>

        <div className={s.vehicleSelect}>
          <div>
            <small>3D MODEL</small>
            <b>Gerçek Mesh Katalog</b>
          </div>
        </div>
      </section>

      <div className={s.breadcrumb}>
        Ana Sayfa <span>›</span>
        Katalog <span>›</span>
        Fiat Egea 3D EPC
      </div>

      <div className={s.layout}>
        <aside className={s.left}>
          <section className={s.darkCard}>
            <h3>KATALOG BÖLÜMLERİ</h3>

            {GROUPS.map(item=>(
              <button
                type="button"
                key={item.id}
                className={
                  group===item.id
                    ?s.groupActive
                    :""
                }
                onClick={()=>
                  chooseGroup(item.id)
                }
              >
                <span>{item.icon}</span>
                <b>{item.title}</b>
                <span>›</span>
              </button>
            ))}
          </section>

          <section className={s.darkCard}>
            <h3>ARAÇ BİLGİLERİ</h3>

            <Info a="Marka" b="Fiat"/>
            <Info a="Model" b="Egea / Tipo"/>
            <Info a="Kasa Tipi" b="Sedan"/>
            <Info a="Model Kaynağı" b="GLB"/>
            <Info a="Mesh" b="149 Geometry"/>
          </section>

          <section className={s.darkCard}>
            <h3>GÖRÜNÜM SEÇENEKLERİ</h3>

            <Toggle
              label="X-Ray Mod"
              value={xray}
              onClick={toggleXray}
            />

            <Toggle
              label="Exploded View"
              value={exploded}
              onClick={toggleExploded}
            />

            <button
              type="button"
              className={s.cameraButton}
              onClick={()=>
                engine.current?.resetCamera()
              }
            >
              Kamerayı Sıfırla
            </button>
          </section>
        </aside>

        <main className={s.center}>
          <section className={s.viewer}>
            {!loaded&&(
              <div className={s.loading}>
                Gerçek Egea 3D modeli yükleniyor…
              </div>
            )}

            <div
              ref={mount}
              className={s.mount}
            />

            <div className={s.viewerHint}>
              Döndür: sol tuş •
              Yakınlaştır: tekerlek •
              Parçanın kendisine tıkla
            </div>

            <div className={s.viewerMode}>
              {GROUPS.find(
                g=>g.id===group
              )?.title}

              {exploded&&(
                <b> • EXPLODED</b>
              )}
            </div>
          </section>
        </main>

        <aside className={s.right}>
          <section className={s.partsCard}>
            <header>
              <div>
                <small>KATEGORİ</small>
                <h2>
                  {GROUPS.find(
                    g=>g.id===group
                  )?.title}
                </h2>
              </div>

              <span>
                {groupParts.length} Parça
              </span>
            </header>

            <div className={s.partsList}>
              {groupParts.map(part=>(
                <button
                  type="button"
                  key={part.id}
                  className={
                    selected?.id===part.id
                      ?s.selectedRow
                      :""
                  }
                  onClick={()=>
                    choosePart(part)
                  }
                >
                  <span className={s.partDot}/>

                  <span className={s.partInfo}>
                    <b>{part.title}</b>
                    <small>
                      {part.oem||
                       "OEM eşleştirme bekliyor"}
                    </small>
                  </span>

                  <span>›</span>
                </button>
              ))}
            </div>
          </section>

          <section className={s.selectedCard}>
            <h3>SEÇİLEN PARÇA BİLGİLERİ</h3>

            {selected?(
              <>
                <h2>{selected.title}</h2>

                <p>
                  OEM No:{" "}
                  <b>
                    {selected.oem||
                     "Henüz eşleştirilmedi"}
                  </b>
                </p>

                <p>
                  Durum:{" "}
                  <strong className={
                    product&&
                    Number(product.stock)>0
                      ?s.inStock
                      :s.noStock
                  }>
                    {!selected.oem
                      ?"OEM bekleniyor"
                      :loadingProduct
                        ?"Kontrol ediliyor…"
                        :product&&
                         Number(product.stock)>0
                          ?`● Stokta (${product.stock})`
                          :"Stok kaydı yok"}
                  </strong>
                </p>

                <div className={s.price}>
                  {product
                    ?money(product.sale_price)
                    :"—"}
                </div>

                {product?(
                  <a
                    className={s.productButton}
                    href={`/urun/${product.id}`}
                  >
                    Ürüne Git
                  </a>
                ):(
                  <button
                    type="button"
                    disabled
                    className={`${s.productButton} ${s.disabled}`}
                  >
                    {selected.oem
                      ?"Ürün Bulunamadı"
                      :"OEM Eşleştirme Bekliyor"}
                  </button>
                )}
              </>
            ):(
              <p>
                Araçtan veya listeden
                bir parça seç.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Info({
  a,b
}:{
  a:string;
  b:string;
}){
  return (
    <div className={s.info}>
      <span>{a}</span>
      <b>{b}</b>
    </div>
  );
}

function Toggle({
  label,
  value,
  onClick
}:{
  label:string;
  value:boolean;
  onClick:()=>void;
}){
  return (
    <button
      type="button"
      className={s.toggle}
      onClick={onClick}
    >
      <span>{label}</span>

      <i className={
        value?s.toggleOn:""
      }>
        <u/>
      </i>
    </button>
  );
}
