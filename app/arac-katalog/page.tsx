import type {Metadata} from "next";
import DobloCatalogV6 from "@/components/catalog/DobloCatalogV6";

export const metadata:Metadata={
  title:"Fiat Doblo Resimli Parça Kataloğu | Turan Oto"
};

export default function Page(){
  return <DobloCatalogV6/>;
}
