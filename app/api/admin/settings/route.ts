import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
export async function PATCH(req:Request){
 try{const b=await req.json();const s=getSupabaseAdmin();const {data,error}=await s.from("site_settings").update({...b,id:undefined,updated_at:new Date().toISOString()}).eq("id",1).select("*").single();if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({success:true,data});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Hata"},{status:500})}}
