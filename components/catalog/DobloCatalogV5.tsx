"use client";

import Image from "next/image";
import {useEffect,useMemo,useState} from "react";
import {
  DOBLO_GROUPS,
  DOBLO_PARTS,
  DOBLO_VIEWS,
  FRONT34_HITBOXES,
  REAR34_HITBOXES,
  EXPLODED_HITBOXES,
  type DobloPart,
  type GroupId,
  type Hitbox
} from "@/lib/doblo-v5";
import s from "./DobloCatalogV5.module.css";

type Product={
  id:number|string;
  product_code:string;
  product_name:string;
  sale_price:number;
  stock:number;
  image_url:string|null;
};

function money(value:number){
  return new Intl.NumberFormat("tr-TR",{
    style:"currency",
    currency:"TRY",
    minimumFractionDigits:2
  }).format(Number(value||0));
}

export default function DobloCatalogV5(){
  const [group,setGroup]=useState<GroupId>("dis-govde");
  const [view,setView]=useState("front34");
  const [selected,setSelected]=useState<DobloPart>(
    DOBLO_PARTS.find(p=>p.group==="dis-govde")!
  );
  const [product,setProduct]=useState<Product|null>(null);
  const [loading,setLoading]=useState(false);
  const [showParts,setShowParts]=useState(true);
  const [xray,setXray]=useState(false);
  const [exploded,setExploded]=useState(false);

  const currentView=
    DOBLO_VIEWS.find(v=>v.id===view) || DOBLO_VIEWS[0];

  const groupParts=useMemo(
    ()=>DOBLO_PARTS.filter(p=>p.group===group),
    [group]
  );

  const groupInfo=DOBLO_GROUPS.find(g=>g.id===group)!;

  useEffect(()=>{
    const first=DOBLO_PARTS.find(p=>p.group===group);
    if(first)setSelected(first);

    if(group==="arka-grup"||group==="arka-takim"){
      setView("rear34");
    }else{
      setView("front34");
    }
  },[group]);

  useEffect(()=>{
    let alive=true;
    setProduct(null);

    if(!selected.oem){
      setLoading(false);
      return()=>{alive=false};
    }

    setLoading(true);

    fetch(
      `/api/catalog-product?oem=${encodeURIComponent(selected.oem)}`,
      {cache:"no-store"}
    )
      .then(r=>r.json())
      .then(data=>{
        if(alive)setProduct(data?.product||null);
      })
      .catch(()=>{
        if(alive)setProduct(null);
      })
      .finally(()=>{
        if(alive)setLoading(false);
      });

    return()=>{alive=false};
  },[selected.id,selected.oem]);

  function findPart(id:string){
    // Ön grup aynı fiziksel parçalara farklı ID ile sahip.
    const direct=DOBLO_PARTS.find(p=>p.id===id);
    if(direct)return direct;

    const aliases:Record<string,string>={
      "on-tampon":"og-tampon",
      "on-izgara":"og-izgara",
      "kaput":"og-kaput",
      "sol-on-camurluk":"og-sol-camurluk",
      "sag-on-camurluk":"og-sag-camurluk",
      "arka-bagaj":"ag-bagaj",
      "arka-tampon":"ag-tampon",
      "sol-stop":"ag-sol-stop",
      "sag-stop":"ag-sag-stop",
    };

    const alias=aliases[id];
    if(alias){
      const p=DOBLO_PARTS.find(x=>x.id===alias);
      if(p)return p;
    }

    return null;
  }

  function selectPart(part:DobloPart){
    setSelected(part);
  }

  function clickHitbox(hit:Hitbox){
    let part=findPart(hit.partId);

    // Aktif grup kendi kopyasını tercih etsin.
    if(part&&part.group!==group){
      const sameName=DOBLO_PARTS.find(
        p=>p.group===group&&p.name===part!.name
      );
      if(sameName)part=sameName;
    }

    if(part)selectPart(part);
  }

  const mainHitboxes=useMemo(()=>{
    if(view==="front34"&&(group==="dis-govde"||group==="on-grup")){
      return FRONT34_HITBOXES.filter(hit=>{
        const p=findPart(hit.partId);
        if(!p)return false;
        return groupParts.some(gp=>gp.name===p.name);
      });
    }

    if(view==="rear34"&&(group==="arka-grup"||group==="arka-takim")){
      return REAR34_HITBOXES;
    }

    return [];
  },[view,group,groupParts]);

  const selectedName=selected.name;

  return (
    <div className={s.page}>
      <div className={s.vehicleBar}>
        <Selector label="ARAÇ" value="Fiat Doblo" fiat/>
        <Selector label="KASA / YIL" value="2015 - 2023 (263)"/>
        <Selector label="VERSİYON" value="Tümü"/>
      </div>

      <div className={s.breadcrumb}>
        Ana Sayfa <span>›</span> Katalog <span>›</span>
        Fiat Doblo 2015 - 2023 (263)
      </div>

      <div className={s.layout}>
        <aside className={s.left}>
          <DarkCard title="KATALOG BÖLÜMLERİ">
            {DOBLO_GROUPS.map(item=>(
              <button
                type="button"
                key={item.id}
                className={`${s.groupButton} ${
                  group===item.id?s.groupActive:""
                }`}
                onClick={()=>setGroup(item.id)}
              >
                <span className={s.groupIcon}>{item.icon}</span>
                <b>{item.title}</b>
                <span>›</span>
              </button>
            ))}
          </DarkCard>

          <DarkCard title="ARAÇ BİLGİLERİ">
            <Info label="Marka" value="Fiat"/>
            <Info label="Model" value="Doblo"/>
            <Info label="Kasa Kodu" value="263"/>
            <Info label="Üretim Yılı" value="2015 - 2023"/>
            <Info label="Yakıt Tipi" value="Dizel / Benzin"/>
            <Info label="Kasa Tipi" value="MPV / Ticari"/>
          </DarkCard>

          <DarkCard title="GÖRÜNÜM SEÇENEKLERİ">
            <Toggle
              label="Parçaları Göster"
              value={showParts}
              onChange={setShowParts}
            />
            <Toggle
              label="X-Ray Mod"
              value={xray}
              onChange={setXray}
            />
            <Toggle
              label="Exploded View"
              value={exploded}
              onChange={setExploded}
            />
            <button
              type="button"
              className={s.fullScreen}
              onClick={()=>{
                document
                  .getElementById("doblo-viewer")
                  ?.requestFullscreen?.();
              }}
            >
              <span>⛶ Tam Ekran</span>
              <span>⛶</span>
            </button>
          </DarkCard>
        </aside>

        <main className={s.center}>
          <section id="doblo-viewer" className={s.viewer}>
            <div className={s.tools}>
              <button onClick={()=>setView("front34")}>⌂</button>
              <button onClick={()=>setShowParts(v=>!v)}>◉</button>
              <button onClick={()=>setXray(v=>!v)}>⌗</button>
              <button onClick={()=>setExploded(v=>!v)}>⛶</button>
              <button onClick={()=>setView("side")}>▣</button>
              <button onClick={()=>setView("rear34")}>◇</button>
            </div>

            {exploded?(
              <div className={s.explodedMainFrame}>
                <Image
                  src="/catalog/doblo/v3/exploded.png"
                  alt="Fiat Doblo exploded view"
                  fill
                  priority
                  className={s.explodedMain}
                  sizes="70vw"
                />

                {showParts&&(
                  <HitboxLayer
                    hitboxes={EXPLODED_HITBOXES}
                    selectedName={selectedName}
                    findPart={findPart}
                    onClick={clickHitbox}
                    exploded
                  />
                )}
              </div>
            ):(
              <div className={s.vehicleFrame}>
                <Image
                  src={currentView.src}
                  alt={`Fiat Doblo ${currentView.label}`}
                  fill
                  priority
                  className={`${s.mainVehicle} ${
                    xray?s.xray:""
                  }`}
                  sizes="70vw"
                />

                {showParts&&(
                  <HitboxLayer
                    hitboxes={mainHitboxes}
                    selectedName={selectedName}
                    findPart={findPart}
                    onClick={clickHitbox}
                  />
                )}
              </div>
            )}
          </section>

          <section className={s.views}>
            {DOBLO_VIEWS.map(item=>(
              <button
                type="button"
                key={item.id}
                className={
                  view===item.id?s.viewActive:""
                }
                onClick={()=>{
                  setExploded(false);
                  setView(item.id);
                }}
              >
                <span className={s.viewImage}>
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    sizes="180px"
                  />
                </span>
                <b>{item.label}</b>
              </button>
            ))}
          </section>

          <section className={s.explodedPanel}>
            <header>
              <b>EXPLODED VIEW</b>
              <span>{groupInfo.title} açılımlı görünüm</span>
            </header>

            <div className={s.explodedFrame}>
              <Image
                src="/catalog/doblo/v3/exploded.png"
                alt="Fiat Doblo dağıtılmış parça görünümü"
                fill
                className={s.explodedImage}
                sizes="70vw"
              />

              <HitboxLayer
                hitboxes={EXPLODED_HITBOXES}
                selectedName={selectedName}
                findPart={findPart}
                onClick={clickHitbox}
                exploded
                showLabels
              />
            </div>
          </section>
        </main>

        <aside className={s.right}>
          <section className={s.partsPanel}>
            <header>
              <div>
                <small>KATEGORİ</small>
                <h2>{groupInfo.title.toUpperCase()}</h2>
              </div>
              <span>{groupParts.length} Parça</span>
            </header>

            <div className={s.partsList}>
              {groupParts.map(part=>(
                <button
                  type="button"
                  key={part.id}
                  className={
                    selected.id===part.id?s.partSelected:""
                  }
                  onClick={()=>selectPart(part)}
                >
                  <span className={s.partImage}>
                    <Image
                      src={part.image}
                      alt={part.name}
                      fill
                      sizes="45px"
                    />
                  </span>

                  <span className={s.partInfo}>
                    <b>{part.name}</b>
                    <small>
                      {part.oem||"OEM eşleştirme bekliyor"}
                    </small>
                  </span>

                  <span className={s.chevron}>›</span>
                </button>
              ))}
            </div>
          </section>

          <section className={s.selectedPanel}>
            <h3>SEÇİLEN PARÇA BİLGİLERİ</h3>

            <div className={s.selectedGrid}>
              <div className={s.selectedImage}>
                <Image
                  src={selected.image}
                  alt={selected.name}
                  fill
                  sizes="100px"
                />
              </div>

              <div>
                <h2>{selected.name}</h2>
                <p>
                  OEM No: <b>{selected.oem||"Henüz eşleştirilmedi"}</b>
                </p>
                <p>
                  Durum:{" "}
                  <strong className={
                    product&&Number(product.stock)>0
                      ?s.stock
                      :s.noStock
                  }>
                    {!selected.oem
                      ?"OEM bekleniyor"
                      :loading
                        ?"Kontrol ediliyor…"
                        :product&&Number(product.stock)>0
                          ?`● Stokta (${product.stock})`
                          :"Stok kaydı yok"}
                  </strong>
                </p>

                <div className={s.price}>
                  {product?money(product.sale_price):"—"}
                </div>
              </div>
            </div>

            {product?(
              <a
                href={`/urun/${product.id}`}
                className={s.cart}
              >
                🛒 Sepete / Ürüne Git
              </a>
            ):(
              <button
                type="button"
                className={`${s.cart} ${s.disabled}`}
                disabled
              >
                {selected.oem
                  ?"Ürün Bulunamadı"
                  :"OEM Eşleştirme Bekliyor"}
              </button>
            )}

            <button type="button" className={s.favorite}>
              ☆ Favorilere Ekle
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function HitboxLayer({
  hitboxes,
  selectedName,
  findPart,
  onClick,
  exploded=false,
  showLabels=false
}:{
  hitboxes:Hitbox[];
  selectedName:string;
  findPart:(id:string)=>DobloPart|null;
  onClick:(h:Hitbox)=>void;
  exploded?:boolean;
  showLabels?:boolean;
}){
  return (
    <div className={s.hitLayer}>
      {hitboxes.map((hit,index)=>{
        const part=findPart(hit.partId);
        if(!part)return null;

        const active=part.name===selectedName;

        return (
          <button
            type="button"
            key={`${hit.partId}-${index}`}
            className={`${s.hitbox} ${
              active?s.hitActive:""
            } ${exploded?s.hitExploded:""}`}
            style={{
              left:`${hit.x}%`,
              top:`${hit.y}%`,
              width:`${hit.w}%`,
              height:`${hit.h}%`,
            }}
            onClick={(e)=>{
              e.stopPropagation();
              onClick(hit);
            }}
            aria-label={part.name}
            title={part.name}
          >
            <span className={s.hitNumber}>{index+1}</span>

            {showLabels&&(
              <b className={s.hitLabel}>{part.name}</b>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Selector({
  label,
  value,
  fiat=false
}:{
  label:string;
  value:string;
  fiat?:boolean;
}){
  return (
    <div className={s.selector}>
      {fiat&&<i>FIAT</i>}
      <div>
        <small>{label}</small>
        <b>{value}</b>
      </div>
      <span>⌄</span>
    </div>
  );
}

function DarkCard({
  title,
  children
}:{
  title:string;
  children:React.ReactNode;
}){
  return (
    <section className={s.darkCard}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Info({
  label,
  value
}:{
  label:string;
  value:string;
}){
  return (
    <div className={s.infoRow}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange
}:{
  label:string;
  value:boolean;
  onChange:(v:boolean)=>void;
}){
  return (
    <button
      type="button"
      className={s.toggle}
      onClick={()=>onChange(!value)}
    >
      <span>{label}</span>
      <i className={value?s.toggleOn:""}>
        <u/>
      </i>
    </button>
  );
}
