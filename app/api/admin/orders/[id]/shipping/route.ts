import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
type P={params:Promise<{id:string}>};
export async function PATCH(req:Request,{params}:P){
 try{const {id}=await params;const b=await req.json();const s=getSupabaseAdmin();const {data,error}=await s.from("orders").update({shipping_company:String(b.shipping_company||"").trim()||null,tracking_number:String(b.tracking_number||"").trim()||null,status:String(b.tracking_number||"").trim()?"Kargoda":undefined,shipped_at:String(b.tracking_number||"").trim()?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq("id",Number(id)).select("*").single();if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({success:true,order:data});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Hata"},{status:500})}}
