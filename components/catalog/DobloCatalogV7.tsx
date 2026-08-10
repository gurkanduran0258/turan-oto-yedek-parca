"use client";

import Image from "next/image";
import {useEffect,useMemo,useState} from "react";
import {
  GROUPS,
  PARTS,
  VIEWS,
  FRONT34_HITS,
  REAR34_HITS,
  EXPLODED_HITS,
  type GroupId,
  type DobloPart,
  type Hitbox
} from "@/lib/doblo-v7";
import s from "./DobloCatalogV7.module.css";

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

export default function DobloCatalogV7(){
  const [group,setGroup]=useState<GroupId>("dis-govde");
  const [view,setView]=useState("front34");
  const [selected,setSelected]=useState<DobloPart>(
    PARTS.find(p=>p.group==="dis-govde")!
  );
  const [product,setProduct]=useState<Product|null>(null);
  const [loading,setLoading]=useState(false);

  const [showParts,setShowParts]=useState(true);
  const [xray,setXray]=useState(false);
  const [exploded,setExploded]=useState(false);
  const [focusPart,setFocusPart]=useState(false);

  const groupInfo=GROUPS.find(g=>g.id===group)!;

  const groupParts=useMemo(
    ()=>PARTS.filter(p=>p.group===group),
    [group]
  );

  const currentView=
    VIEWS.find(v=>v.id===view) || VIEWS[0];

  useEffect(()=>{
    const first=PARTS.find(p=>p.group===group);
    if(first){
      setSelected(first);
      setFocusPart(false);
    }

    if(group==="arka-grup"||group==="arka-takim"){
      setView("rear34");
    }else{
      setView("front34");
    }

    setExploded(false);
  },[group]);

  useEffect(()=>{
    let active=true;

    setProduct(null);

    if(!selected.oem){
      setLoading(false);
      return()=>{active=false};
    }

    setLoading(true);

    fetch(
      `/api/catalog-product?oem=${encodeURIComponent(selected.oem)}`,
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
        if(active)setLoading(false);
      });

    return()=>{active=false};
  },[selected.id,selected.oem]);

  function choosePart(part:DobloPart){
    setSelected(part);
    setFocusPart(true);

    if(part.group==="arka-grup"||part.group==="arka-takim"){
      setView("rear34");
    }else{
      setView("front34");
    }
  }

  function partByName(name:string){
    return groupParts.find(p=>p.name===name) || null;
  }

  const mainHits=useMemo(()=>{
    if(!showParts||exploded)return [];

    if(
      view==="front34" &&
      (group==="dis-govde"||group==="on-grup")
    ){
      return FRONT34_HITS.filter(
        h=>groupParts.some(p=>p.name===h.partName)
      );
    }

    if(
      view==="rear34" &&
      (group==="arka-grup"||group==="arka-takim")
    ){
      return REAR34_HITS.filter(
        h=>groupParts.some(p=>p.name===h.partName)
      );
    }

    return [];
  },[showParts,exploded,view,group,groupParts]);

  const explodedHits=useMemo(
    ()=>EXPLODED_HITS.filter(
      h=>groupParts.some(p=>p.name===h.partName)
    ),
    [groupParts]
  );

  function toggleExploded(){
    setExploded(v=>{
      const next=!v;
      if(next)setFocusPart(false);
      return next;
    });
  }

  return (
    <div className={s.page}>
      <section className={s.vehicleBar}>
        <Selector label="ARAÇ" value="Fiat Doblo" fiat/>
        <Selector label="KASA / YIL" value="2015 - 2023 (263)"/>
        <Selector label="VERSİYON" value="Tümü"/>
      </section>

      <div className={s.breadcrumb}>
        Ana Sayfa <span>›</span> Katalog <span>›</span>
        Fiat Doblo 2015 - 2023 (263)
      </div>

      <div className={s.layout}>
        <aside className={s.left}>
          <DarkCard title="KATALOG BÖLÜMLERİ">
            {GROUPS.map(item=>(
              <button
                type="button"
                key={item.id}
                className={`${s.groupButton} ${
                  item.id===group?s.groupActive:""
                }`}
                onClick={()=>setGroup(item.id)}
              >
                <span>{item.icon}</span>
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
              onChange={()=>toggleExploded()}
            />
            <button
              type="button"
              className={s.fullScreen}
              onClick={()=>{
                document
                  .getElementById("doblo-main-view")
                  ?.requestFullscreen?.();
              }}
            >
              <span>⛶ Tam Ekran</span>
              <span>⛶</span>
            </button>
          </DarkCard>
        </aside>

        <main className={s.center}>
          <section
            id="doblo-main-view"
            className={s.viewer}
          >
            <div className={s.tools}>
              <button onClick={()=>{setView("front34");setExploded(false);setFocusPart(false)}}>⌂</button>
              <button onClick={()=>setShowParts(v=>!v)}>◉</button>
              <button onClick={()=>setXray(v=>!v)}>⌗</button>
              <button onClick={toggleExploded}>⤢</button>
              <button onClick={()=>{setView("side");setExploded(false);setFocusPart(false)}}>▣</button>
              <button onClick={()=>{setView("rear34");setExploded(false);setFocusPart(false)}}>◇</button>
            </div>

            {exploded ? (
              <div className={s.explodedCanvas}>
                <Image
                  src="/catalog/doblo/v6/exploded.png"
                  alt="Fiat Doblo exploded view"
                  fill
                  priority
                  className={s.canvasImage}
                  sizes="70vw"
                />

                {showParts&&(
                  <Hitboxes
                    hits={explodedHits}
                    selected={selected}
                    partByName={partByName}
                    onSelect={choosePart}
                  />
                )}

                <div className={s.modeBadge}>
                  EXPLODED VIEW
                </div>
              </div>
            ) : focusPart ? (
              <div className={s.focusScene}>
                <div className={s.backgroundVehicle}>
                  <Image
                    src={currentView.src}
                    alt={`Fiat Doblo ${currentView.label}`}
                    fill
                    priority
                    className={s.backgroundImage}
                    sizes="70vw"
                  />
                </div>

                <div className={s.focusCard}>
                  <div className={s.focusPartImage}>
                    <Image
                      src={selected.focusImage||selected.image}
                      alt={selected.name}
                      fill
                      priority
                      sizes="220px"
                    />
                  </div>

                  <div className={s.focusMeta}>
                    <small>SEÇİLEN PARÇA</small>
                    <h2>{selected.name}</h2>
                    <p>
                      OEM: <b>{selected.oem||"Henüz eşleştirilmedi"}</b>
                    </p>
                    <button
                      type="button"
                      onClick={()=>setFocusPart(false)}
                    >
                      ← Araca Dön
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={s.vehicleCanvas}>
                <Image
                  src={currentView.src}
                  alt={`Fiat Doblo ${currentView.label}`}
                  fill
                  priority
                  className={`${s.canvasImage} ${
                    xray?s.xray:""
                  }`}
                  sizes="70vw"
                />

                {showParts&&(
                  <Hitboxes
                    hits={mainHits}
                    selected={selected}
                    partByName={partByName}
                    onSelect={choosePart}
                  />
                )}
              </div>
            )}
          </section>

          <section className={s.views}>
            {VIEWS.map(item=>(
              <button
                type="button"
                key={item.id}
                className={
                  item.id===view&&!exploded&&!focusPart
                    ?s.viewActive
                    :""
                }
                onClick={()=>{
                  setExploded(false);
                  setFocusPart(false);
                  setView(item.id);
                }}
              >
                <span className={s.thumbImage}>
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

            <div className={s.explodedPreview}>
              <div className={s.explodedPreviewCanvas}>
                <Image
                  src="/catalog/doblo/v6/exploded.png"
                  alt="Fiat Doblo dağıtılmış görünüm"
                  fill
                  className={s.canvasImage}
                  sizes="70vw"
                />

                {showParts&&(
                  <Hitboxes
                    hits={explodedHits}
                    selected={selected}
                    partByName={partByName}
                    onSelect={choosePart}
                  />
                )}
              </div>
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
                    selected.id===part.id
                      ?s.partSelected
                      :""
                  }
                  onClick={()=>choosePart(part)}
                >
                  <span className={s.partImage}>
                    <Image
                      src={part.image}
                      alt={part.name}
                      fill
                      sizes="45px"
                    />
                  </span>

                  <span className={s.partText}>
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

            <div className={s.selectedTop}>
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
                  OEM No:{" "}
                  <b>
                    {selected.oem||"Henüz eşleştirilmedi"}
                  </b>
                </p>
                <p>
                  Durum:{" "}
                  <strong className={
                    product&&Number(product.stock)>0
                      ?s.inStock
                      :s.outStock
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

            <button
              type="button"
              className={s.showPartButton}
              onClick={()=>{
                setExploded(false);
                setFocusPart(true);
              }}
            >
              PARÇAYI GÖSTER
            </button>

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

function Hitboxes({
  hits,
  selected,
  partByName,
  onSelect
}:{
  hits:Hitbox[];
  selected:DobloPart;
  partByName:(name:string)=>DobloPart|null;
  onSelect:(part:DobloPart)=>void;
}){
  return (
    <div className={s.hitLayer}>
      {hits.map(hit=>{
        const part=partByName(hit.partName);
        if(!part)return null;

        const active=selected.name===part.name;

        return (
          <button
            type="button"
            key={`${hit.partName}-${hit.x}-${hit.y}`}
            className={`${s.hit} ${
              active?s.hitActive:""
            }`}
            style={{
              left:`${hit.x}%`,
              top:`${hit.y}%`,
              width:`${hit.w}%`,
              height:`${hit.h}%`,
            }}
            title={part.name}
            aria-label={part.name}
            onClick={(e)=>{
              e.stopPropagation();
              onSelect(part);
            }}
          />
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
