import type {Metadata} from "next";
import DobloCatalogV5 from "@/components/catalog/DobloCatalogV5";

export const metadata:Metadata={
  title:"Fiat Doblo Resimli Parça Kataloğu | Turan Oto"
};

export default function Page(){
  return <DobloCatalogV5/>;
}
