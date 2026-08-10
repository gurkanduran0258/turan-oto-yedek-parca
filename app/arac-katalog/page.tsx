import type {Metadata} from "next";
import DobloCatalogV3 from "@/components/catalog/DobloCatalogV3";

export const metadata:Metadata={
  title:"Fiat Doblo Resimli Parça Kataloğu | Turan Oto"
};

export default function Page(){
  return <DobloCatalogV3/>;
}
