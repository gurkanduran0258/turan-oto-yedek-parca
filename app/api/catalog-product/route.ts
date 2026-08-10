import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

export const dynamic="force-dynamic";

export async function GET(req:NextRequest){
  const oem=req.nextUrl.searchParams.get("oem")?.trim();
  if(!oem)return NextResponse.json({product:null});

  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if(!url||!key){
    return NextResponse.json(
      {product:null,error:"Supabase env eksik"},
      {status:503}
    );
  }

  const sb=createClient(url,key,{
    auth:{persistSession:false,autoRefreshToken:false}
  });

  const {data,error}=await sb
    .from("products")
    .select("id,product_code,product_name,sale_price,stock,image_url")
    .eq("product_code",oem)
    .limit(1)
    .maybeSingle();

  if(error){
    return NextResponse.json(
      {product:null,error:error.message},
      {status:500}
    );
  }

  return NextResponse.json({product:data||null});
}
