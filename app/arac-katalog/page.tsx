import type {Metadata} from "next";
import DobloCatalogV7 from "@/components/catalog/DobloCatalogV7";

export const metadata:Metadata={
  title:"Fiat Doblo Resimli Parça Kataloğu | Turan Oto"
};

export default function Page(){
  return <DobloCatalogV7/>;
}
