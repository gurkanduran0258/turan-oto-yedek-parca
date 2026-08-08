import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
export async function PATCH(request:Request){
 try{const b=await request.json();const pid=Number(b.productId);const s=getSupabaseAdmin();const {data:old}=await s.from("service_stock").select("quantity").eq("product_id",pid).maybeSingle();const {error}=await s.from("service_stock").upsert({product_id:pid,quantity:Number(old?.quantity||0),min_quantity:Math.max(0,Number(b.minQuantity||0)),location:String(b.location||"").trim()||null,updated_at:new Date().toISOString()},{onConflict:"product_id"});if(error)throw error;return NextResponse.json({success:true});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Kaydedilemedi."},{status:500})}
}
