import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const n=(v:unknown)=>Number.isFinite(Number(v))?Number(v):0;

export async function POST(request:Request){
  try{
    const body=await request.json();
    const items=Array.isArray(body.items)?body.items:[];
    if(!String(body.receiptNo||"").trim()) return NextResponse.json({error:"İrsaliye no zorunlu."},{status:400});
    if(!items.length) return NextResponse.json({error:"Ürün kalemi gerekli."},{status:400});

    const supabase=getSupabaseAdmin();
    const codes=items.map((x:any)=>String(x.product_code||"").trim());
    const {data:products,error}=await supabase.from("products").select("id,product_code,product_name,stock").in("product_code",codes);
    if(error) return NextResponse.json({error:error.message},{status:500});

    const map=new Map((products||[]).map((p:any)=>[String(p.product_code),p]));
    const missing=codes.filter((c:string)=>!map.has(c));
    if(missing.length) return NextResponse.json({error:`Ürün kodu bulunamadı: ${missing.join(", ")}`},{status:400});

    const shipping=Math.max(0,n(body.shippingCost));
    const extra=Math.max(0,n(body.extraCost));
    const totalNet=items.reduce((s:number,x:any)=>s+Math.max(1,n(x.quantity))*Math.max(0,n(x.purchase_price)),0);
    const totalVat=items.reduce((s:number,x:any)=>{
      const line=Math.max(1,n(x.quantity))*Math.max(0,n(x.purchase_price));
      return s+line*(Math.max(0,n(x.vat))/100);
    },0);

    const {data:receipt,error:receiptError}=await supabase.from("purchase_receipts").insert({
      receipt_no:String(body.receiptNo).trim(),
      supplier_id:body.supplierId||null,
      shipping_cost:shipping,
      extra_cost:extra,
      total_net:Number(totalNet.toFixed(2)),
      total_vat:Number(totalVat.toFixed(2)),
      total_gross:Number((totalNet+totalVat+shipping+extra).toFixed(2)),
    }).select("id").single();

    if(receiptError||!receipt) return NextResponse.json({error:receiptError?.message||"İrsaliye oluşturulamadı."},{status:500});

    let updatedProducts=0;
    for(const item of items){
      const code=String(item.product_code||"").trim();
      const p:any=map.get(code);
      const qty=Math.max(1,Math.floor(n(item.quantity)));
      const buy=Math.max(0,n(item.purchase_price));
      const vat=Math.max(0,n(item.vat));
      const margin=Math.max(0,n(item.profit_margin));
      const line=qty*buy;
      const alloc=(shipping+extra)*(totalNet>0?line/totalNet:0);
      const landed=(line+alloc)/qty;
      const sale=landed*(1+margin/100)*(1+vat/100);

      await supabase.from("purchase_receipt_items").insert({
        receipt_id:receipt.id,product_id:p.id,product_code:code,product_name:p.product_name,
        quantity:qty,purchase_price:buy,vat,profit_margin:margin,allocated_extra:alloc,
        landed_unit_cost:landed,suggested_sale_price:sale
      });

      const before=Number(p.stock||0), after=before+qty;
      const {error:updateError}=await supabase.from("products").update({
        stock:after,purchase_price:Number(landed.toFixed(4)),profit_margin:margin,vat,
        sale_price:Number(sale.toFixed(2)),updated_at:new Date().toISOString()
      }).eq("id",p.id);

      if(!updateError){
        await supabase.from("stock_movements").insert({
          product_id:p.id,receipt_id:receipt.id,movement_type:"ALIŞ / İRSALİYE",
          quantity:qty,stock_before:before,stock_after:after,note:String(body.receiptNo)
        });
        updatedProducts++;
      }
    }

    return NextResponse.json({success:true,updatedProducts});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"İşlem başarısız."},{status:500});
  }
}
