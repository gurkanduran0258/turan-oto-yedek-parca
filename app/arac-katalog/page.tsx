import type {Metadata} from "next";
import DobloCatalogV4 from "@/components/catalog/DobloCatalogV4";

export const metadata:Metadata={
  title:"Fiat Doblo Resimli Parça Kataloğu | Turan Oto"
};

export default function Page(){
  return <DobloCatalogV4/>;
}
