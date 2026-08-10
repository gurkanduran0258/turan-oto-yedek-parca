"use client";

import Image from "next/image";
import {useEffect,useMemo,useState} from "react";
import {
  DOBLO_GROUPS,
  DOBLO_PARTS,
  DOBLO_VIEWS,
  type CatalogGroup,
  type CatalogPart
} from "@/lib/doblo-catalog";
import styles from "./DobloCatalog.module.css";

type ProductInfo={
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

export default function DobloCatalog(){
  const [group,setGroup]=useState<CatalogGroup>("dis-govde");
  const [view,setView]=useState<(typeof DOBLO_VIEWS)[number]["id"]>("front34");
  const [selected,setSelected]=useState<CatalogPart>(DOBLO_PARTS[0]);
  const [product,setProduct]=useState<ProductInfo|null>(null);
  const [loading,setLoading]=useState(false);
  const [xray,setXray]=useState(false);
  const [exploded,setExploded]=useState(false);

  const currentView=DOBLO_VIEWS.find(x=>x.id===view)!;
  const groupParts=useMemo(
    ()=>DOBLO_PARTS.filter(p=>p.group===group),
    [group]
  );

  useEffect(()=>{
    let cancelled=false;

    async function load(){
      setLoading(true);
      setProduct(null);

      try{
        const response=await fetch(
          `/api/catalog-product?oem=${encodeURIComponent(selected.oem)}`,
          {cache:"no-store"}
        );

        const data=await response.json();

        if(!cancelled){
          setProduct(data?.product||null);
        }
      }catch{
        if(!cancelled)setProduct(null);
      }finally{
        if(!cancelled)setLoading(false);
      }
    }

    void load();
    return()=>{cancelled=true};
  },[selected.oem]);

  function chooseGroup(id:CatalogGroup){
    setGroup(id);
    const first=DOBLO_PARTS.find(p=>p.group===id);
    if(first)setSelected(first);
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Selector title="ARAÇ" value="Fiat Doblo" logo/>
        <Selector title="KASA / YIL" value="Doblo 2015–2023"/>
        <Selector title="VERSİYON" value="263"/>
      </div>

      <div className={styles.breadcrumb}>
        Ana Sayfa <span>›</span> Katalog <span>›</span> Fiat Doblo
      </div>

      <div className={styles.layout}>
        <aside className={styles.left}>
          <section className={styles.darkCard}>
            <h3>KATALOG BÖLÜMLERİ</h3>

            {DOBLO_GROUPS.map(item=>(
              <button
                type="button"
                key={item.id}
                className={`${styles.groupButton} ${
                  group===item.id?styles.activeGroup:""
                }`}
                onClick={()=>chooseGroup(item.id)}
              >
                <span>{item.icon}</span>
                <b>{item.title}</b>
                <span>›</span>
              </button>
            ))}
          </section>

          <section className={styles.darkCard}>
            <h3>ARAÇ BİLGİLERİ</h3>
            <Info label="Marka" value="Fiat"/>
            <Info label="Model" value="Doblo"/>
            <Info label="Kasa / Yıl" value="2015–2023"/>
            <Info label="Kasa Kodu" value="263"/>
            <Info label="Yakıt Tipi" value="Dizel / Benzin"/>
            <Info label="Kasa Tipi" value="Hafif Ticari"/>
          </section>

          <section className={styles.darkCard}>
            <h3>GÖRÜNÜM SEÇENEKLERİ</h3>
            <Toggle
              label="X-Ray Mod"
              value={xray}
              onClick={()=>setXray(v=>!v)}
            />
            <Toggle
              label="Exploded View"
              value={exploded}
              onClick={()=>setExploded(v=>!v)}
            />
            <button
              type="button"
              className={styles.fullButton}
              onClick={()=>{
                const el=document.getElementById("doblo-main-view");
                if(el?.requestFullscreen)void el.requestFullscreen();
              }}
            >
              <span>Tam Ekran</span><span>⛶</span>
            </button>
          </section>
        </aside>

        <main className={styles.center}>
          <section
            id="doblo-main-view"
            className={`${styles.viewer} ${
              xray?styles.xray:""
            }`}
          >
            <div className={styles.viewerTools}>
              <button onClick={()=>setView("front34")}>⌂</button>
              <button onClick={()=>setView("front")}>◉</button>
              <button onClick={()=>setXray(v=>!v)}>▣</button>
              <button onClick={()=>setExploded(v=>!v)}>⤢</button>
              <button onClick={()=>setView("side")}>▱</button>
              <button onClick={()=>setView("rear34")}>◇</button>
            </div>

            <Image
              src={currentView.src}
              alt={`Fiat Doblo ${currentView.label}`}
              fill
              priority
              className={`${styles.carImage} ${
                exploded?styles.explodedCar:""
              }`}
              sizes="(max-width: 900px) 100vw, 60vw"
            />

            <Hotspots
              group={group}
              onSelect={(id)=>{
                const p=DOBLO_PARTS.find(x=>x.id===id);
                if(p)setSelected(p);
              }}
            />

            <div className={styles.viewerHint}>
              360° Görünüm &nbsp; • &nbsp; Parçaları seçmek için işaretlere tıklayın
            </div>
          </section>

          <section className={styles.viewStrip}>
            {DOBLO_VIEWS.map(item=>(
              <button
                type="button"
                key={item.id}
                className={`${styles.thumb} ${
                  view===item.id?styles.thumbActive:""
                }`}
                onClick={()=>setView(item.id)}
              >
                <div className={styles.thumbImage}>
                  <Image
                    src={item.src}
                    alt={item.label}
                    fill
                    sizes="150px"
                  />
                </div>
                <span>{item.label}</span>
              </button>
            ))}
          </section>

          <section className={styles.explodedPanel}>
            <div className={styles.explodedHead}>
              <b>EXPLODED VIEW</b>
              <span>
                {DOBLO_GROUPS.find(x=>x.id===group)?.title} açılımlı görünüm
              </span>
            </div>

            <div className={styles.explodedBody}>
              <Image
                src="/catalog/doblo/doblo-wireframe-1.png"
                alt="Fiat Doblo exploded reference"
                fill
                className={styles.explodedImage}
                sizes="(max-width: 900px) 100vw, 60vw"
              />

              <div className={styles.explodedLabels}>
                {groupParts.slice(0,7).map((part,index)=>(
                  <button
                    type="button"
                    key={part.id}
                    onClick={()=>setSelected(part)}
                    style={{
                      left:`${12+(index%4)*23}%`,
                      top:`${18+Math.floor(index/4)*48}%`
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

        <aside className={styles.right}>
          <section className={styles.partsCard}>
            <div className={styles.partsHeader}>
              <div>
                <small>KATEGORİ</small>
                <h2>
                  {DOBLO_GROUPS.find(x=>x.id===group)?.title}
                </h2>
              </div>
              <span>{groupParts.length} Parça</span>
            </div>

            <div className={styles.partsList}>
              {groupParts.map((part,index)=>(
                <button
                  type="button"
                  key={part.id}
                  onClick={()=>setSelected(part)}
                  className={`${styles.partRow} ${
                    selected.id===part.id?styles.partSelected:""
                  }`}
                >
                  <span className={styles.partPic}>
                    {index%3===0?"▰":index%3===1?"◖":"◉"}
                  </span>

                  <span className={styles.partName}>
                    <b>{part.name}</b>
                    <small>{part.oem}</small>
                  </span>

                  <span className={styles.rowArrow}>›</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.productCard}>
            <h3>SEÇİLEN PARÇA BİLGİLERİ</h3>

            <div className={styles.productTop}>
              <div className={styles.productVisual}>
                {product?.image_url?(
                  <img src={product.image_url} alt={selected.name}/>
                ):(
                  <span>▰</span>
                )}
              </div>

              <div>
                <h2>{selected.name}</h2>
                <p>
                  OEM No: <b>{selected.oem}</b>
                </p>
                <p>
                  Durum:{" "}
                  <b className={
                    product&&Number(product.stock)>0
                      ?styles.inStock
                      :styles.noStock
                  }>
                    {loading
                      ?"Kontrol ediliyor…"
                      :product
                        ?Number(product.stock)>0
                          ?`● Stokta (${product.stock})`
                          :"Stok Yok"
                        :"Ürün kaydı yok"}
                  </b>
                </p>
              </div>
            </div>

            <div className={styles.price}>
              {loading
                ?"—"
                :product
                  ?money(product.sale_price)
                  :"—"}
            </div>

            {product?(
              <a
                className={styles.cartButton}
                href={`/urun/${product.id}`}
              >
                🛒 Ürüne Git
              </a>
            ):(
              <button
                type="button"
                disabled
                className={`${styles.cartButton} ${styles.disabled}`}
              >
                Ürün Bulunamadı
              </button>
            )}

            <button type="button" className={styles.favoriteButton}>
              ☆ Favorilere Ekle
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Selector({
  title,
  value,
  logo=false
}:{
  title:string;
  value:string;
  logo?:boolean;
}){
  return (
    <div className={styles.selector}>
      {logo&&<div className={styles.fiatLogo}>FIAT</div>}
      <div>
        <small>{title}</small>
        <b>{value}</b>
      </div>
      <span>⌄</span>
    </div>
  );
}

function Info({label,value}:{label:string;value:string}){
  return (
    <div className={styles.info}>
      <span>{label}</span>
      <b>{value}</b>
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
      className={styles.toggle}
      onClick={onClick}
    >
      <span>{label}</span>
      <i className={value?styles.toggleOn:""}>
        <u/>
      </i>
    </button>
  );
}

function Hotspots({
  group,
  onSelect
}:{
  group:CatalogGroup;
  onSelect:(id:string)=>void;
}){
  if(group!=="dis-govde"&&group!=="on-grup")return null;

  const points=[
    {id:"hood",x:54,y:35,n:1},
    {id:"front-bumper",x:69,y:58,n:2},
    {id:"front-grille",x:64,y:48,n:3},
    {id:"fender-left",x:40,y:53,n:4},
    {id:"door-front-left",x:34,y:45,n:5},
  ];

  return (
    <div className={styles.hotspots}>
      {points.map(p=>(
        <button
          type="button"
          key={p.id}
          style={{left:`${p.x}%`,top:`${p.y}%`}}
          onClick={()=>onSelect(p.id)}
        >
          {p.n}
        </button>
      ))}
    </div>
  );
}
