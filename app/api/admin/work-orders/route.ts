import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const no=()=>`IE-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.floor(1000+Math.random()*9000)}`;

export async function POST(request:Request){
 try{const b=await request.json();const s=getSupabaseAdmin();const {data,error}=await s.from("work_orders").insert({work_order_no:no(),status:"Açık",plate:String(b.plate||"").trim().toUpperCase()||null,chassis:String(b.chassis||"").trim().toUpperCase()||null,customer_name:String(b.customer_name||"").trim()||null,customer_phone:String(b.customer_phone||"").trim()||null,vehicle_brand:String(b.vehicle_brand||"Fiat"),vehicle_model:String(b.vehicle_model||"").trim()||null,vehicle_year:String(b.vehicle_year||"").trim()||null,vehicle_engine:String(b.vehicle_engine||"").trim()||null,kilometer:b.kilometer?Number(b.kilometer):null,complaint:String(b.complaint||"").trim()||null,technician_note:String(b.technician_note||"").trim()||null}).select("*").single();if(error)throw error;return NextResponse.json({success:true,workOrder:data});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"İş emri oluşturulamadı."},{status:500})}
}
