import type {Metadata} from "next";
import VehicleEPC from "@/components/vehicle-3d/VehicleEPC";

export const metadata:Metadata={
  title:"Fiat Resimli Parça Kataloğu | Turan Oto",
  description:"Fiat Egea, Doblo ve Fiorino resimli yedek parça kataloğu"
};

export default function Page(){
  return <main><VehicleEPC/></main>;
}
