import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

export const dynamic="force-dynamic";

function getSupabase(){
  const url=
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const key=
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if(!url||!key){
    return null;
  }

  return createClient(url,key,{
    auth:{
      persistSession:false,
      autoRefreshToken:false
    }
  });
}

export async function GET(request:NextRequest){
  const oem=request.nextUrl.searchParams.get("oem")?.trim();

  if(!oem){
    return NextResponse.json(
      {product:null,error:"OEM zorunlu."},
      {status:400}
    );
  }

  // MOTOR/SANZIMAN gibi grup anahtarlarını ürün kodu sanma.
  if(!/^[A-Za-z0-9]{6,14}$/.test(oem) || !/\d/.test(oem)){
    return NextResponse.json({product:null});
  }

  const supabase=getSupabase();

  if(!supabase){
    return NextResponse.json(
      {
        product:null,
        error:"Supabase ortam değişkenleri tanımlı değil."
      },
      {status:503}
    );
  }

  const {data,error}=await supabase
    .from("products")
    .select("id,product_code,product_name,sale_price,stock,image_url")
    .eq("product_code",oem)
    .limit(1)
    .maybeSingle();

  if(error){
    console.error("catalog-product:",error);
    return NextResponse.json(
      {product:null,error:error.message},
      {status:500}
    );
  }

  return NextResponse.json({product:data||null});
}
