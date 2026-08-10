import type {Metadata} from "next";
import EgeaEPC from "@/components/vehicle-3d/EgeaEPC";

export const metadata:Metadata={
  title:"Fiat Resimli Parça Kataloğu | Turan Oto"
};

export default function Page(){
  return <main><EgeaEPC/></main>;
}
