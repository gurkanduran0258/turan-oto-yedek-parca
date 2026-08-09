import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InvoicePage() {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from("service_work_orders")
    .select("id,work_order_no,plate,customer_name,vehicle_description,parts_subtotal,labor_subtotal,vat_total,grand_total,invoice_status")
    .eq("invoice_status","not_invoiced")
    .order("updated_at",{ascending:false});

  return (
    <div style={{padding:28}}>
      <div style={{color:"#c90020",fontWeight:900,fontSize:12}}>SERVİS</div>
      <h1 style={{margin:"4px 0"}}>Fatura Kes</h1>
      <p style={{color:"#64748b"}}>Kontrolü tamamlanan iş emirlerini faturalandır.</p>

      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,overflow:"hidden",marginTop:18}}>
        {(data||[]).map((x:any)=>
          <div key={x.id} style={{display:"grid",gridTemplateColumns:"130px 110px 1fr 140px 160px",gap:12,alignItems:"center",padding:"12px 14px",borderBottom:"1px solid #f1f5f9"}}>
            <b>{x.work_order_no}</b>
            <b>{x.plate||"-"}</b>
            <span>{x.customer_name || x.vehicle_description || "-"}</span>
            <b>{Number(x.grand_total||0).toLocaleString("tr-TR",{minimumFractionDigits:2})} ₺</b>
            <span style={{color:"#64748b",fontSize:12}}>Fatura entegrasyonu sonraki adım</span>
          </div>
        )}

        {!data?.length && <div style={{padding:30,textAlign:"center",color:"#64748b"}}>Fatura bekleyen iş emri yok.</div>}
      </div>
    </div>
  );
}
