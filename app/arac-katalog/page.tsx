import type { Metadata } from "next";
import VehicleCatalog3D from "@/components/vehicle-3d/VehicleCatalog3D";

export const metadata: Metadata = {
  title: "3D Araç Kataloğu | Turan Oto Yedek Parça",
  description:
    "Fiat Egea üzerinde parçayı seçerek yedek parçaya ulaşın.",
};

export default function AracKatalogPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f8f8f8" }}>
      <VehicleCatalog3D />
    </main>
  );
}
