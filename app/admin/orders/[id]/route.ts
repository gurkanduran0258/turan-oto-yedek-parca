import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
export const runtime="nodejs"; export const dynamic="force-dynamic";
const allowed=["Yeni","Ödeme Bekleniyor","Ödendi","Hazırlanıyor","Kargoda","Tamamlandı","İptal"];
type P={params:Promise<{id:string}>};
export async function PATCH(req:Request,{params}:P){
 try{const {id}=await params;const orderId=Number(id);const b=await req.json();const status=String(b.status||"");if(!allowed.includes(status))return NextResponse.json({error:"Geçersiz durum."},{status:400});
 const s=getSupabaseAdmin();
 const {data:order}=await s.from("orders").select("id,status,stock_restored").eq("id",orderId).maybeSingle(); if(!order)return NextResponse.json({error:"Sipariş yok."},{status:404});
 if(status==="İptal" && order.status!=="İptal" && !order.stock_restored){
  const {data:items}=await s.from("order_items").select("product_id,quantity").eq("order_id",orderId);
  for(const item of items||[]){const pid=Number(item.product_id),qty=Math.max(1,Number(item.quantity||1));if(!pid)continue;const {data:p}=await s.from("products").select("stock").eq("id",pid).maybeSingle();if(!p)continue;const before=Number(p.stock||0),after=before+qty;await s.from("products").update({stock:after,updated_at:new Date().toISOString()}).eq("id",pid);await s.from("stock_movements").insert({product_id:pid,order_id:orderId,movement_type:"İPTAL İADESİ",quantity:qty,stock_before:before,stock_after:after});}
 }
 const {data,error}=await s.from("orders").update({status,stock_restored:status==="İptal"?true:order.stock_restored,updated_at:new Date().toISOString()}).eq("id",orderId).select("*").single();
 if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({success:true,order:data});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Hata"},{status:500})}
}
