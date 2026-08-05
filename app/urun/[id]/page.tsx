import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/ProductDetailClient";
import { products } from "@/lib/products";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find(p => p.id === Number(id));
  if (!product) notFound();
  return <ProductDetailClient product={product} />;
}
