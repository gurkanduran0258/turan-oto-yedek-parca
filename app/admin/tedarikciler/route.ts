import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
export async function POST(req:Request){
 try{const b=await req.json();const name=String(b.name||"").trim();if(!name)return NextResponse.json({error:"Tedarikçi adı zorunlu."},{status:400});const s=getSupabaseAdmin();const {data,error}=await s.from("suppliers").insert({name,phone:b.phone||null,email:b.email||null,tax_number:b.tax_number||null,note:b.note||null}).select("*").single();if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({success:true,data});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Hata"},{status:500})}}
