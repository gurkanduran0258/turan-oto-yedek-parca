import type {Metadata} from "next";
import DobloCatalog from "@/components/catalog/DobloCatalog";

export const metadata:Metadata={
  title:"Fiat Doblo Resimli Parça Kataloğu | Turan Oto",
  description:"Fiat Doblo 263 resimli yedek parça kataloğu"
};

export default function Page(){
  return <DobloCatalog/>;
}
