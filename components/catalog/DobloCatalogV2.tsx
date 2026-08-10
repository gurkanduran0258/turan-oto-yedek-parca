"use client";

import Image from "next/image";
import {useEffect,useState} from "react";
import {parts,views,type Part} from "@/lib/doblo-v2";
import s from "./DobloCatalogV2.module.css";

type Product={
  id:string|number;
  product_code:string;
  product_name:string;
  sale_price:number;
  stock:number;
  image_url:string|null;
};

const groups=["Dış Gövde","Ön Grup","Arka Grup","Motor & Şanzıman","Ön Takım","Arka Takım"];

function tl(n:number){
  return new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(Number(n||0));
}

export default function DobloCatalogV2(){
  const [activeGroup,setActiveGroup]=useState("Dış Gövde");
  const [view,setView]=useState("front34");
  const [selected,setSelected]=useState<Part>(parts[0]);
  const [product,setProduct]=useState<Product|null>(null);
  const [loading,setLoading]=useState(false);
  const [showParts,setShowParts]=useState(true);
  const [xray,setXray]=useState(false);
  const [exploded,setExploded]=useState(false);

  const current=views.find(v=>v.id===view) || views[0];

  useEffect(()=>{
    let alive=true;
    setLoading(true);
    fetch(`/api/catalog-product?oem=${encodeURIComponent(selected.oem)}`,{cache:"no-store"})
      .then(r=>r.json())
      .then(d=>{if(alive)setProduct(d.product||null)})
      .catch(()=>{if(alive)setProduct(null)})
      .finally(()=>{if(alive)setLoading(false)});
    return()=>{alive=false};
  },[selected.oem]);

  return <div className={s.page}>
    <div className={s.selectbar}>
      <Box label="ARAÇ" value="Fiat Doblo" fiat/>
      <Box label="KASA / YIL" value="2015 - 2023 (263)"/>
      <Box label="VERSİYON" value="Tümü"/>
    </div>

    <div className={s.crumb}>Ana Sayfa <i>›</i> Katalog <i>›</i> Fiat Doblo 2015 - 2023 (263)</div>

    <div className={s.grid}>
      <aside className={s.left}>
        <Card title="KATALOG BÖLÜMLERİ">
          {groups.map((g,i)=><button key={g} className={`${s.group} ${activeGroup===g?s.on:""}`} onClick={()=>setActiveGroup(g)}>
            <span className={s.gicon}>{["▱","▰","▣","⚙","⌘","♮"][i]}</span><b>{g}</b><span>›</span>
          </button>)}
        </Card>

        <Card title="ARAÇ BİLGİLERİ">
          <Info a="Marka" b="Fiat"/>
          <Info a="Model" b="Doblo"/>
          <Info a="Kasa Kodu" b="263"/>
          <Info a="Üretim Yılı" b="2015 - 2023"/>
          <Info a="Yakıt Tipi" b="Dizel / Benzin"/>
          <Info a="Kasa Tipi" b="MPV / Ticari"/>
        </Card>

        <Card title="GÖRÜNÜM SEÇENEKLERİ">
          <Switch label="Parçaları Göster" on={showParts} set={setShowParts}/>
          <Switch label="X-Ray Mod" on={xray} set={setXray}/>
          <Switch label="Exploded View" on={exploded} set={setExploded}/>
          <button className={s.full} onClick={()=>document.getElementById("viewer")?.requestFullscreen?.()}>⛶ Tam Ekran <span>⛶</span></button>
        </Card>
      </aside>

      <main className={s.main}>
        <section id="viewer" className={s.viewer}>
          <div className={s.tools}>
            <button onClick={()=>setView("front34")}>⌂</button>
            <button onClick={()=>setShowParts(v=>!v)}>◉</button>
            <button onClick={()=>setXray(v=>!v)}>⌗</button>
            <button onClick={()=>setExploded(v=>!v)}>⛶</button>
            <button>▣</button><button>◇</button>
          </div>

          <Image
            src={current.image}
            alt={`Fiat Doblo ${current.label}`}
            fill priority
            className={`${s.mainImg} ${xray?s.xray:""}`}
            sizes="70vw"
          />

          {showParts && view==="front34" && <div className={s.hotspots}>
            <Hot x={48} y={42} n="1" p={parts[0]} set={setSelected}/>
            <Hot x={35} y={61} n="2" p={parts[1]} set={setSelected}/>
            <Hot x={41} y={55} n="3" p={parts[2]} set={setSelected}/>
            <Hot x={59} y={56} n="4" p={parts[3]} set={setSelected}/>
            <Hot x={68} y={53} n="5" p={parts[4]} set={setSelected}/>
          </div>}
        </section>

        <div className={s.thumbs}>
          {views.map(v=><button key={v.id} onClick={()=>setView(v.id)} className={view===v.id?s.thumbOn:""}>
            <span><Image src={v.thumb} alt={v.label} fill sizes="180px"/></span><b>{v.label}</b>
          </button>)}
        </div>

        <section className={s.exploded}>
          <div className={s.explodedTitle}>EXPLODED VIEW</div>
          <div className={s.explodedImage}>
            <Image src="/catalog/doblo/v2/exploded-doblo.png" alt="Fiat Doblo exploded view" fill className={s.exImg} sizes="70vw"/>
          </div>
        </section>
      </main>

      <aside className={s.right}>
        <section className={s.partPanel}>
          <div className={s.panelHead}><div><b>DIŞ GÖVDE</b><span>Parçalar</span></div></div>
          <div className={s.partList}>
            {parts.map(p=><button key={p.id} onClick={()=>setSelected(p)} className={selected.id===p.id?s.sel:""}>
              <span className={s.partIcon}><Image src={p.image} alt={p.name} fill sizes="40px"/></span>
              <span className={s.partText}><b>{p.name}</b><small>{p.oem}</small></span>
              <span className={s.arrow}>›</span>
            </button>)}
          </div>
        </section>

        <section className={s.selected}>
          <h3>SEÇİLEN PARÇA BİLGİLERİ</h3>
          <div className={s.selectedBody}>
            <div className={s.selPic}>
              <Image src={selected.image} alt={selected.name} fill sizes="100px"/>
            </div>
            <div>
              <h2>{selected.name}</h2>
              <p>OEM No: <b>{selected.oem}</b></p>
              <p>Durum: <strong className={product&&product.stock>0?s.stock:s.nostock}>
                {loading?"Kontrol ediliyor":product&&product.stock>0?`● Stokta (${product.stock})`:"Stok kaydı yok"}
              </strong></p>
              <div className={s.price}>{product?tl(product.sale_price):"—"}</div>
            </div>
          </div>
          {product
            ? <a href={`/urun/${product.id}`} className={s.cart}>🛒 Sepete / Ürüne Git</a>
            : <button className={`${s.cart} ${s.off}`} disabled>Ürün Bulunamadı</button>}
          <button className={s.fav}>☆ Favorilere Ekle</button>
        </section>
      </aside>
    </div>
  </div>
}

function Card({title,children}:{title:string;children:React.ReactNode}){
  return <section className={s.card}><h3>{title}</h3>{children}</section>
}
function Box({label,value,fiat}:{label:string;value:string;fiat?:boolean}){
  return <div className={s.box}>{fiat&&<i>FIAT</i>}<div><small>{label}</small><b>{value}</b></div><span>⌄</span></div>
}
function Info({a,b}:{a:string;b:string}){return <div className={s.info}><span>{a}</span><b>{b}</b></div>}
function Switch({label,on,set}:{label:string;on:boolean;set:(v:boolean)=>void}){
  return <button className={s.switch} onClick={()=>set(!on)}><span>{label}</span><i className={on?s.swOn:""}><u/></i></button>
}
function Hot({x,y,n,p,set}:{x:number;y:number;n:string;p:Part;set:(p:Part)=>void}){
  return <button style={{left:`${x}%`,top:`${y}%`}} onClick={()=>set(p)}>{n}</button>
}
