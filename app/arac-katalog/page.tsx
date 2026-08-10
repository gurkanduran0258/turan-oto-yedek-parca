import type {Metadata} from "next";
import EgeaRealEPC from "@/components/catalog/EgeaRealEPC";

export const metadata:Metadata={
  title:"Fiat Egea Gerçek 3D Parça Kataloğu | Turan Oto"
};

export default function Page(){
  return <EgeaRealEPC/>;
}
