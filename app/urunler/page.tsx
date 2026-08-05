"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";

export default function ProductsPage() {
  const [query,setQuery] = useState("");
  const [category,setCategory] = useState("Tümü");
  const [sort,setSort] = useState("featured");

  const list = useMemo(() => {
    let output = products.filter(p =>
      (category === "Tümü" || p.category === category) &&
      (!query || p.name.toLowerCase().includes(query.toLowerCase()) || p.oem.toLowerCase().includes(query.toLowerCase()))
    );
    if (sort === "asc") output = [...output].sort((a,b)=>a.price-b.price);
    if (sort === "desc") output = [...output].sort((a,b)=>b.price-a.price);
    return output;
  },[query,category,sort]);

  return (
    <>
      <section className="pageTitle"><div className="container"><small>Ana Sayfa / Ürünler</small><h1>Fiat Yedek Parçaları</h1></div></section>
      <main className="container listingLayout">
        <aside className="filterPanel">
          <h3>Kategori</h3>
          {["Tümü","Filtre","Fren","Elektrik","Süspansiyon"].map(c =>
            <label key={c}><input type="radio" name="category" checked={category===c} onChange={()=>setCategory(c)} /> {c}</label>
          )}
        </aside>
        <section>
          <div className="toolbar">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ürün veya OEM ara..." />
            <select value={sort} onChange={e=>setSort(e.target.value)}>
              <option value="featured">Önerilen</option>
              <option value="asc">Fiyat artan</option>
              <option value="desc">Fiyat azalan</option>
            </select>
          </div>
          <div className="productGrid">{list.map(p=><ProductCard key={p.id} product={p} />)}</div>
        </section>
      </main>
    </>
  );
}
