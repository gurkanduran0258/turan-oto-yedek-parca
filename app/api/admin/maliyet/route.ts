import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
const n=(v:unknown)=>Number.isFinite(Number(v))?Number(v):0;
export async function POST(req:Request){
 try{const b=await req.json();const items=Array.isArray(b.items)?b.items:[];if(!String(b.receiptNo||"").trim())return NextResponse.json({error:"İrsaliye no zorunlu."},{status:400});if(!items.length)return NextResponse.json({error:"Ürün kalemi gerekli."},{status:400});
 const s=getSupabaseAdmin();const codes=items.map((x:any)=>String(x.product_code||"").trim());const {data:products}=await s.from("products").select("id,product_code,product_name,stock").in("product_code",codes);const map=new Map((products||[]).map((p:any)=>[String(p.product_code),p]));const missing=codes.filter((c:string)=>!map.has(c));if(missing.length)return NextResponse.json({error:`Ürün kodu bulunamadı: ${missing.join(", ")}`},{status:400});
 const shipping=Math.max(0,n(b.shippingCost)),extra=Math.max(0,n(b.extraCost)),net=items.reduce((sum:number,x:any)=>sum+Math.max(1,n(x.quantity))*Math.max(0,n(x.purchase_price)),0),vatTotal=items.reduce((sum:number,x:any)=>{const line=Math.max(1,n(x.quantity))*Math.max(0,n(x.purchase_price));return sum+line*(Math.max(0,n(x.vat))/100)},0);
 const {data:receipt,error:rerr}=await s.from("purchase_receipts").insert({receipt_no:String(b.receiptNo).trim(),supplier_id:b.supplierId||null,shipping_cost:shipping,extra_cost:extra,total_net:net,total_vat:vatTotal,total_gross:net+vatTotal+shipping+extra}).select("id").single();if(rerr||!receipt)return NextResponse.json({error:rerr?.message||"İrsaliye oluşturulamadı."},{status:500});
 let updatedProducts=0;
 for(const item of items){const code=String(item.product_code||"").trim();const p:any=map.get(code);const qty=Math.max(1,Math.floor(n(item.quantity))),buy=Math.max(0,n(item.purchase_price)),vat=Math.max(0,n(item.vat)),margin=Math.max(0,n(item.profit_margin)),line=qty*buy,alloc=(shipping+extra)*(net>0?line/net:0),landed=(line+alloc)/qty,sale=landed*(1+margin/100)*(1+vat/100);
 await s.from("purchase_receipt_items").insert({receipt_id:receipt.id,product_id:p.id,product_code:code,product_name:p.product_name,quantity:qty,purchase_price:buy,vat,profit_margin:margin,allocated_extra:alloc,landed_unit_cost:landed,suggested_sale_price:sale});
 const before=Number(p.stock||0),after=before+qty;const {error:uerr}=await s.from("products").update({stock:after,purchase_price:Number(landed.toFixed(4)),profit_margin:margin,vat,sale_price:Number(sale.toFixed(2)),updated_at:new Date().toISOString()}).eq("id",p.id);if(!uerr){await s.from("stock_movements").insert({product_id:p.id,receipt_id:receipt.id,movement_type:"ALIŞ / İRSALİYE",quantity:qty,stock_before:before,stock_after:after,note:String(b.receiptNo)});updatedProducts++;}}
 return NextResponse.json({success:true,updatedProducts});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Hata"},{status:500})}
}
