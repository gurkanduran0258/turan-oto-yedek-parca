import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
type P={params:Promise<{id:string}>};

export async function POST(_:Request,{params}:P){
 try{const {id}=await params;const wid=Number(id);const s=getSupabaseAdmin();const {data:o}=await s.from("work_orders").select("id,work_order_no,stock_issued").eq("id",wid).maybeSingle();if(!o)return NextResponse.json({error:"İş emri yok."},{status:404});if(o.stock_issued)return NextResponse.json({error:"Stok çıkışı zaten yapılmış."},{status:400});
 const {data:items}=await s.from("work_order_items").select("product_id,product_code,product_name,quantity").eq("work_order_id",wid);if(!items?.length)return NextResponse.json({error:"İş emrinde parça yok."},{status:400});
 for(const i of items){const {data:ss}=await s.from("service_stock").select("quantity").eq("product_id",i.product_id).maybeSingle();const have=Number(ss?.quantity||0),need=Number(i.quantity||0);if(have<need)return NextResponse.json({error:`${i.product_code} servis stok yetersiz. Mevcut ${have}, gerekli ${need}.`},{status:400});}
 for(const i of items){const {data:ss}=await s.from("service_stock").select("quantity").eq("product_id",i.product_id).single();const before=Number(ss.quantity||0),q=Number(i.quantity||0),after=before-q;const {error}=await s.from("service_stock").update({quantity:after,updated_at:new Date().toISOString()}).eq("product_id",i.product_id);if(error)throw error;await s.from("service_stock_movements").insert({product_id:i.product_id,work_order_id:wid,movement_type:"İŞ EMRİ ÇIKIŞI",quantity:-q,stock_before:before,stock_after:after,note:o.work_order_no});}
 await s.from("work_orders").update({stock_issued:true,stock_returned:false,status:"Onarımda",updated_at:new Date().toISOString()}).eq("id",wid);
 return NextResponse.json({success:true});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Stok çıkışı başarısız."},{status:500})}
}
