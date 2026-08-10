"use client";

import Image from "next/image";
import {useEffect,useMemo,useState} from "react";
import {
  DOBLO_PARTS,
  DOBLO_VIEWS,
  type DobloPart
} from "@/lib/doblo-v3";
import s from "./DobloCatalogV3.module.css";

type Product={
  id:number|string;
  product_code:string;
  product_name:string;
  sale_price:number;
  stock:number;
  image_url:string|null;
};

const GROUPS=[
  "Dış Gövde",
  "Ön Grup",
  "Arka Grup",
  "Motor & Şanzıman",
  "Ön Takım",
  "Arka Takım",
];

function money(value:number){
  return new Intl.NumberFormat("tr-TR",{
    style:"currency",
    currency:"TRY",
    minimumFractionDigits:2
  }).format(Number(value||0));
}

export default function DobloCatalogV3(){
  const [group,setGroup]=useState("Dış Gövde");
  const [view,setView]=useState("front34");
  const [selected,setSelected]=useState<DobloPart>(DOBLO_PARTS[0]);
  const [product,setProduct]=useState<Product|null>(null);
  const [loading,setLoading]=useState(false);
  const [showParts,setShowParts]=useState(true);
  const [xray,setXray]=useState(false);
  const [exploded,setExploded]=useState(false);

  const currentView=
    DOBLO_VIEWS.find(v=>v.id===view) || DOBLO_VIEWS[0];

  useEffect(()=>{
    let alive=true;

    setLoading(true);
    setProduct(null);

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
  },[selected.oem]);

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
            {GROUPS.map((item,index)=>(
              <button
                type="button"
                key={item}
                className={`${s.groupButton} ${
                  group===item?s.groupActive:""
                }`}
                onClick={()=>setGroup(item)}
              >
                <span className={s.groupIcon}>
                  {["▰","▱","▣","⚙","⌘","♮"][index]}
                </span>
                <b>{item}</b>
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
            )}

            {showParts&&!exploded&&view==="front34"&&(
              <div className={s.hotspots}>
                <Hotspot
                  x={49} y={38} n={1}
                  part={DOBLO_PARTS[0]}
                  onSelect={setSelected}
                />
                <Hotspot
                  x={39} y={61} n={2}
                  part={DOBLO_PARTS[1]}
                  onSelect={setSelected}
                />
                <Hotspot
                  x={44} y={53} n={3}
                  part={DOBLO_PARTS[2]}
                  onSelect={setSelected}
                />
                <Hotspot
                  x={61} y={54} n={4}
                  part={DOBLO_PARTS[3]}
                  onSelect={setSelected}
                />
                <Hotspot
                  x={70} y={52} n={5}
                  part={DOBLO_PARTS[4]}
                  onSelect={setSelected}
                />
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
              <span>Dış Gövde açılımlı görünüm</span>
            </header>

            <div className={s.explodedPicture}>
              <Image
                src="/catalog/doblo/v3/exploded.png"
                alt="Fiat Doblo dağıtılmış parça görünümü"
                fill
                className={s.explodedImage}
                sizes="70vw"
              />
            </div>
          </section>
        </main>

        <aside className={s.right}>
          <section className={s.partsPanel}>
            <header>
              <h2>DIŞ GÖVDE</h2>
              <span>Parçalar</span>
            </header>

            <div className={s.partsList}>
              {DOBLO_PARTS.map(part=>(
                <button
                  type="button"
                  key={part.id}
                  className={
                    selected.id===part.id?s.partSelected:""
                  }
                  onClick={()=>setSelected(part)}
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
                    <small>{part.oem}</small>
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
                  OEM No: <b>{selected.oem}</b>
                </p>
                <p>
                  Durum:{" "}
                  <strong className={
                    product&&Number(product.stock)>0
                      ?s.stock
                      :s.noStock
                  }>
                    {loading
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
                Ürün Bulunamadı
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
