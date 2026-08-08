import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request:Request){
 try{
  const b=await request.json(); const productId=Number(b.productId); const qty=Math.max(1,Math.floor(Number(b.quantity||1)));
  const s=getSupabaseAdmin();
  const {data:p}=await s.from("products").select("id,stock").eq("id",productId).maybeSingle();
  if(!p)return NextResponse.json({error:"Ürün bulunamadı."},{status:404});
  const wb=Number(p.stock||0); if(wb<qty)return NextResponse.json({error:`Toptan stok yetersiz. Mevcut ${wb}`},{status:400});
  const {data:ss}=await s.from("service_stock").select("quantity").eq("product_id",productId).maybeSingle();
  const sb=Number(ss?.quantity||0), wa=wb-qty, sa=sb+qty;
  const {error:e1}=await s.from("products").update({stock:wa,updated_at:new Date().toISOString()}).eq("id",productId); if(e1)throw e1;
  const {error:e2}=await s.from("service_stock").upsert({product_id:productId,quantity:sa,updated_at:new Date().toISOString()},{onConflict:"product_id"});
  if(e2){await s.from("products").update({stock:wb,updated_at:new Date().toISOString()}).eq("id",productId);throw e2;}
  await s.from("service_stock_movements").insert({product_id:productId,movement_type:"TOPTANDAN TRANSFER",quantity:qty,stock_before:sb,stock_after:sa,note:`Toptan ${wb} → ${wa}`});
  return NextResponse.json({success:true});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Transfer başarısız."},{status:500})}
}
