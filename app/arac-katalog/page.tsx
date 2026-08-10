import type {Metadata} from "next";
import Doblo3DEPC from "@/components/catalog/Doblo3DEPC";

export const metadata:Metadata={
  title:"Fiat Doblo 3D Parça Kataloğu | Turan Oto"
};

export default function Page(){
  return <Doblo3DEPC/>;
}
