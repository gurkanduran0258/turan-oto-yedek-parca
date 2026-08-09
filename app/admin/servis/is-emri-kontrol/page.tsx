"use client";

import { useState } from "react";

export default function WorkOrderControlPage() {
  const [workOrderNo,setWorkOrderNo] = useState("");
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");

  async function requestImport() {
    const no = workOrderNo.trim();
    if (!no) return alert("İş emri numarası gir.");

    setBusy(true);
    setMessage("");

    try {
      const r = await fetch("/api/admin/servis/import-request",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({workOrderNo:no})
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "İstek oluşturulamadı.");

      setMessage("TOFAŞ iş emri aktarım kuyruğuna alındı.");
    } catch(e) {
      setMessage(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{padding:28}}>
      <div style={{color:"#c90020",fontWeight:900,fontSize:12}}>SERVİS / TOFAŞ</div>
      <h1 style={{margin:"4px 0"}}>İş Emri Kontrol</h1>
      <p style={{color:"#64748b"}}>TOFAŞ iş emri numarasını gir. Parça, işçilik ve araç bilgileri komple içeri alınacak.</p>

      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:18,maxWidth:800,marginTop:18}}>
        <label style={{fontWeight:800,fontSize:13}}>TOFAŞ İş Emri No</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 180px",gap:8,marginTop:7}}>
          <input value={workOrderNo} onChange={e=>setWorkOrderNo(e.target.value)} placeholder="Örn. 12345678" style={{padding:12,border:"1px solid #cbd5e1",borderRadius:8}}/>
          <button disabled={busy} onClick={requestImport} style={{border:0,borderRadius:8,background:"#c90020",color:"#fff",fontWeight:900}}>
            {busy ? "Kuyruğa Alınıyor..." : "TOFAŞ'tan Getir"}
          </button>
        </div>
        {message && <div style={{marginTop:12,padding:10,background:"#f1f5f9",borderRadius:8,fontWeight:700}}>{message}</div>}
      </div>

      <div style={{marginTop:16,background:"#fff7ed",border:"1px solid #fed7aa",color:"#9a3412",padding:14,borderRadius:10,maxWidth:800,fontSize:13}}>
        TOFAŞ İş Emri ekranının gerçek alanları henüz bağlanmadı. Ekran görüntüsü + Network isteğini gördüğümüzde mevcut açık Chrome otomasyonuna bağlayıp bu butonu canlı hale getireceğiz.
      </div>
    </div>
  );
}
