'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Stats = { total: number; inStock: number; outOfStock: number; lastUpdate: string | null };
export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/products/stats').then(async r => { const x=await r.json(); if(!r.ok) throw new Error(x.error); setStats(x); }).catch(e=>setError(e.message)); }, []);
  const card: React.CSSProperties = { border:'1px solid #e5e7eb', borderRadius:14, padding:22, background:'#fff', boxShadow:'0 5px 20px rgba(0,0,0,.05)' };
  return <main style={{maxWidth:1150,margin:'38px auto',padding:'0 18px'}}>
    <h1 style={{fontSize:34,marginBottom:8}}>Turan Oto Yönetim Paneli</h1><p style={{color:'#64748b'}}>Ürün, fiyat ve stok işlemleri</p>
    {error && <p style={{color:'#b91c1c'}}>{error}</p>}
    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:16,margin:'26px 0'}}>
      <div style={card}><small>Toplam Ürün</small><h2>{stats?.total ?? '—'}</h2></div>
      <div style={card}><small>Stokta Olan</small><h2>{stats?.inStock ?? '—'}</h2></div>
      <div style={card}><small>Stokta Olmayan</small><h2>{stats?.outOfStock ?? '—'}</h2></div>
      <div style={card}><small>Son Güncelleme</small><h3>{stats?.lastUpdate ? new Date(stats.lastUpdate).toLocaleString('tr-TR') : '—'}</h3></div>
    </section>
    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:18}}>
      <Link href="/admin/excel-yukle" style={{...card,textDecoration:'none',color:'#111827'}}><h2>📊 Excel’den Yükle</h2><p>Yeni ürün ekle veya ürün koduna göre fiyat ve stok güncelle.</p></Link>
      <Link href="/admin/urunler" style={{...card,textDecoration:'none',color:'#111827'}}><h2>📦 Ürünleri Yönet</h2><p>Ürün ara, düzenle veya sil.</p></Link>
      <a href="/api/products/export" style={{...card,textDecoration:'none',color:'#111827'}}><h2>📤 Dışa Aktar</h2><p>Tüm ürünleri CSV olarak indir.</p></a>
    </section>
  </main>;
}
