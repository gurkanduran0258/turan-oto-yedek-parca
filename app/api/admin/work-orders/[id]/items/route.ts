import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
type P={params:Promise<{id:string}>};

export async function POST(request:Request,{params}:P){
 try{const {id}=await params;const wid=Number(id);const b=await request.json();const pid=Number(b.productId);const qty=Math.max(1,Math.floor(Number(b.quantity||1)));const s=getSupabaseAdmin();
 const {data:o}=await s.from("work_orders").select("stock_issued").eq("id",wid).maybeSingle();if(!o)return NextResponse.json({error:"İş emri yok."},{status:404});if(o.stock_issued)return NextResponse.json({error:"Stok çıkışı yapılmış iş emrine parça eklenemez."},{status:400});
 const {data:p}=await s.from("products").select("id,product_code,product_name,purchase_price").eq("id",pid).maybeSingle();if(!p)return NextResponse.json({error:"Ürün yok."},{status:404});
 const cost=Number(p.purchase_price||0);const {data:ex}=await s.from("work_order_items").select("id,quantity").eq("work_order_id",wid).eq("product_id",pid).maybeSingle();
 if(ex){const nq=Number(ex.quantity||0)+qty;const {error}=await s.from("work_order_items").update({quantity:nq,unit_cost:cost,line_cost:cost*nq}).eq("id",ex.id);if(error)throw error;}else{const {error}=await s.from("work_order_items").insert({work_order_id:wid,product_id:pid,product_code:p.product_code,product_name:p.product_name,quantity:qty,unit_cost:cost,line_cost:cost*qty});if(error)throw error;}
 return NextResponse.json({success:true});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Eklenemedi."},{status:500})}
}

export async function DELETE(request:Request,{params}:P){
 try{const {id}=await params;const wid=Number(id);const itemId=Number(new URL(request.url).searchParams.get("itemId"));const s=getSupabaseAdmin();const {data:o}=await s.from("work_orders").select("stock_issued").eq("id",wid).maybeSingle();if(o?.stock_issued)return NextResponse.json({error:"Stok çıkışı sonrası parça silinemez."},{status:400});const {error}=await s.from("work_order_items").delete().eq("id",itemId).eq("work_order_id",wid);if(error)throw error;return NextResponse.json({success:true});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Silinemedi."},{status:500})}
}
