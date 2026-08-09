import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ClipboardList, ReceiptText, SearchCheck, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function count(supabase:any, filter?: (q:any)=>any) {
  let q = supabase.from("service_work_orders").select("*",{count:"exact",head:true});
  if (filter) q = filter(q);
  const { count } = await q;
  return count || 0;
}

export default async function ServicePage() {
  const supabase = getSupabaseAdmin();

  const [openCount, invoiceWaiting, invoiced] = await Promise.all([
    count(supabase, q => q.neq("status","closed")),
    count(supabase, q => q.eq("invoice_status","not_invoiced")),
    count(supabase, q => q.eq("invoice_status","invoiced")),
  ]);

  const { data: latest } = await supabase
    .from("service_work_orders")
    .select("id,work_order_no,plate,vin,customer_name,vehicle_description,status,grand_total,invoice_status,updated_at")
    .order("updated_at",{ascending:false})
    .limit(8);

  return (
    <div style={{padding:28}}>
      <div style={{color:"#c90020",fontWeight:900,fontSize:12}}>SERVİS YÖNETİMİ</div>
      <h1 style={{margin:"4px 0"}}>Servis Kontrol Merkezi</h1>
      <p style={{marginTop:4,color:"#64748b"}}>TOFAŞ iş emirleri, parça-işçilik kontrolü ve faturalama.</p>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginTop:20}}>
        <Stat title="Açık İş Emri" value={openCount}/>
        <Stat title="Fatura Bekleyen" value={invoiceWaiting}/>
        <Stat title="Faturalanan" value={invoiced}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginTop:14}}>
        <Action href="/admin/servis/is-emirleri" icon={<ClipboardList/>} title="İş Emirleri" text="Tüm iş emirleri, parça ve işçilik detayları"/>
        <Action href="/admin/servis/is-emri-kontrol" icon={<SearchCheck/>} title="İş Emri Kontrol" text="TOFAŞ'tan iş emri getir ve kontrol et"/>
        <Action href="/admin/servis/fatura-kes" icon={<ReceiptText/>} title="Fatura Kes" text="Hazır iş emirlerini faturalandır"/>
      </div>

      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,marginTop:16,overflow:"hidden"}}>
        <div style={{padding:16,fontWeight:900,borderBottom:"1px solid #eef2f7"}}>Son İş Emirleri</div>
        {(latest||[]).map((x:any)=>(
          <Link key={x.id} href={`/admin/servis/is-emirleri?open=${x.id}`} style={{display:"grid",gridTemplateColumns:"140px 120px 1fr 160px 130px",gap:12,padding:"12px 16px",borderBottom:"1px solid #f1f5f9",textDecoration:"none",color:"#0f172a",fontSize:13}}>
            <b>{x.work_order_no}</b>
            <span>{x.plate || "-"}</span>
            <span>{x.vehicle_description || x.customer_name || "-"}</span>
            <b>{Number(x.grand_total||0).toLocaleString("tr-TR",{minimumFractionDigits:2})} ₺</b>
            <span>{x.invoice_status === "invoiced" ? "Faturalandı" : "Fatura Bekliyor"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({title,value}:{title:string;value:number}) {
  return <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:16}}><small style={{color:"#64748b",fontWeight:800}}>{title}</small><b style={{display:"block",fontSize:27,marginTop:4}}>{value}</b></div>;
}

function Action({href,icon,title,text}:{href:string;icon:React.ReactNode;title:string;text:string}) {
  return <Link href={href} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:16,textDecoration:"none",color:"#0f172a",display:"flex",gap:12}}>
    <div style={{width:42,height:42,borderRadius:10,background:"#f1f5f9",display:"grid",placeItems:"center"}}>{icon}</div>
    <div><b>{title}</b><small style={{display:"block",color:"#64748b",marginTop:4}}>{text}</small></div>
  </Link>;
}
