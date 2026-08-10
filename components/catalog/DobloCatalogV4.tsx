"use client";

import Image from "next/image";
import {useEffect,useMemo,useState} from "react";
import {
  DOBLO_GROUPS,
  DOBLO_PARTS,
  DOBLO_VIEWS,
  type DobloPart,
  type GroupId
} from "@/lib/doblo-v4";
import s from "./DobloCatalogV4.module.css";

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

export default function DobloCatalogV4(){
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
    // Grup değişince ilk parçayı otomatik seç.
    const first=DOBLO_PARTS.find(p=>p.group===group);
    if(first)setSelected(first);

    // Arka grup seçilirse otomatik arka 3/4;
    // ön grup seçilirse ön 3/4 göster.
    if(group==="arka-grup"||group==="arka-takim"){
      setView("rear34");
    }else if(group==="on-grup"||group==="on-takim"||group==="motor-sanziman"){
      setView("front34");
    }
  },[group]);

  useEffect(()=>{
    let alive=true;

    setProduct(null);

    // OEM henüz tanımlanmadıysa Supabase'e boş sorgu gönderme.
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

  function selectPart(part:DobloPart){
    setSelected(part);

    // Parça tıklanınca ana görüntüyü normal moda getir ki seçim görünsün.
    setExploded(false);

    if(part.group==="arka-grup"||part.group==="arka-takim"){
      setView("rear34");
    }else{
      setView("front34");
    }
  }

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
              <Image
                src="/catalog/doblo/v3/exploded.png"
                alt="Fiat Doblo exploded view"
                fill
                priority
                className={s.explodedMain}
                sizes="70vw"
              />
            ):(
              <>
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

                {/* SEÇİLEN PARÇA ANA GÖRÜNTÜDE DE BELİRGİN */}
                <div className={s.selectedOverlay}>
                  <div className={s.overlayImage}>
                    <Image
                      src={selected.image}
                      alt={selected.name}
                      fill
                      sizes="90px"
                    />
                  </div>
                  <div>
                    <small>SEÇİLEN PARÇA</small>
                    <b>{selected.name}</b>
                    <span>
                      {selected.oem
                        ?`OEM ${selected.oem}`
                        :"OEM eşleştirme bekliyor"}
                    </span>
                  </div>
                </div>
              </>
            )}

            {showParts&&!exploded&&(
              <div className={s.hotspots}>
                {groupParts.slice(0,7).map((part,index)=>{
                  const frontPoints=[
                    [48,38],[39,61],[44,53],[61,54],[70,52],[53,45],[58,47]
                  ];
                  const rearPoints=[
                    [52,40],[43,62],[59,58],[67,48],[38,50],[55,52],[62,42]
                  ];
                  const points=
                    group==="arka-grup"||group==="arka-takim"
                      ?rearPoints
                      :frontPoints;
                  const [x,y]=points[index]||[50,50];

                  return (
                    <Hotspot
                      key={part.id}
                      x={x}
                      y={y}
                      n={index+1}
                      part={part}
                      onSelect={selectPart}
                    />
                  );
                })}
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

            <div className={s.explodedPicture}>
              <Image
                src="/catalog/doblo/v3/exploded.png"
                alt="Fiat Doblo dağıtılmış parça görünümü"
                fill
                className={s.explodedImage}
                sizes="70vw"
              />

              <div className={s.explodedButtons}>
                {groupParts.slice(0,8).map((part,index)=>(
                  <button
                    type="button"
                    key={part.id}
                    onClick={()=>selectPart(part)}
                    style={{
                      left:`${12+(index%4)*24}%`,
                      top:`${16+Math.floor(index/4)*62}%`
                    }}
                  >
                    <i>{index+1}</i>
                    <span>{part.name}</span>
                  </button>
                ))}
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
                  OEM No:{" "}
                  <b>
                    {selected.oem||"Henüz eşleştirilmedi"}
                  </b>
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

function Hotspot({
  x,y,n,part,onSelect
}:{
  x:number;
  y:number;
  n:number;
  part:DobloPart;
  onSelect:(p:DobloPart)=>void;
}){
  return (
    <button
      type="button"
      style={{left:`${x}%`,top:`${y}%`}}
      onClick={()=>onSelect(part)}
    >
      {n}
    </button>
  );
}
