import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
type P={params:Promise<{id:string}>};

export async function POST(_:Request,{params}:P){
 try{const {id}=await params;const wid=Number(id);const s=getSupabaseAdmin();const {data:o}=await s.from("work_orders").select("id,work_order_no,stock_issued,stock_returned").eq("id",wid).maybeSingle();if(!o)return NextResponse.json({error:"İş emri yok."},{status:404});if(!o.stock_issued)return NextResponse.json({error:"Stok çıkışı yapılmamış."},{status:400});if(o.stock_returned)return NextResponse.json({error:"Zaten iade edilmiş."},{status:400});
 const {data:items}=await s.from("work_order_items").select("product_id,quantity").eq("work_order_id",wid);
 for(const i of items||[]){const {data:ss}=await s.from("service_stock").select("quantity").eq("product_id",i.product_id).maybeSingle();const before=Number(ss?.quantity||0),q=Number(i.quantity||0),after=before+q;await s.from("service_stock").upsert({product_id:i.product_id,quantity:after,updated_at:new Date().toISOString()},{onConflict:"product_id"});await s.from("service_stock_movements").insert({product_id:i.product_id,work_order_id:wid,movement_type:"İŞ EMRİ İADESİ",quantity:q,stock_before:before,stock_after:after,note:o.work_order_no});}
 await s.from("work_orders").update({stock_returned:true,status:"Parça İade",updated_at:new Date().toISOString()}).eq("id",wid);
 return NextResponse.json({success:true});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"İade başarısız."},{status:500})}
}
