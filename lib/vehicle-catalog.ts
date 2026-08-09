export type CatalogGroupId = "on-grup" | "kaporta" | "arka-grup";

export type CatalogPart = {
  meshNames: string[];
  title: string;
  group: CatalogGroupId;
  searchTerms: string[];
};

export const GROUPS: Record<
  CatalogGroupId,
  { title: string; description: string }
> = {
  "on-grup": {
    title: "Ön Grup",
    description: "Tampon, far, panjur, kaput ve ön gövde parçaları",
  },
  kaporta: {
    title: "Kaporta",
    description: "Kapılar, çamurluklar, tavan ve yan gövde parçaları",
  },
  "arka-grup": {
    title: "Arka Grup",
    description: "Arka tampon, stop, bagaj kapağı ve arka gövde parçaları",
  },
};

export const VEHICLE_PARTS: CatalogPart[] = [
  {
    meshNames: ["front_bumper"],
    title: "Ön Tampon",
    group: "on-grup",
    searchTerms: ["ön tampon", "tampon braketi", "tampon demiri", "ızgara"],
  },
  {
    meshNames: ["hood"],
    title: "Kaput",
    group: "on-grup",
    searchTerms: ["kaput", "kaput menteşesi", "kaput kilidi"],
  },
  {
    meshNames: ["headlight_left"],
    title: "Sol Ön Far",
    group: "on-grup",
    searchTerms: ["sol ön far", "far braketi"],
  },
  {
    meshNames: ["headlight_right"],
    title: "Sağ Ön Far",
    group: "on-grup",
    searchTerms: ["sağ ön far", "far braketi"],
  },
  {
    meshNames: ["front_fender_left"],
    title: "Sol Ön Çamurluk",
    group: "kaporta",
    searchTerms: ["sol ön çamurluk", "davlumbaz"],
  },
  {
    meshNames: ["front_fender_right"],
    title: "Sağ Ön Çamurluk",
    group: "kaporta",
    searchTerms: ["sağ ön çamurluk", "davlumbaz"],
  },
  {
    meshNames: ["door_front_left"],
    title: "Sol Ön Kapı",
    group: "kaporta",
    searchTerms: ["sol ön kapı", "kapı kolu", "kapı menteşesi", "cam"],
  },
  {
    meshNames: ["door_front_right"],
    title: "Sağ Ön Kapı",
    group: "kaporta",
    searchTerms: ["sağ ön kapı", "kapı kolu", "kapı menteşesi", "cam"],
  },
  {
    meshNames: ["door_rear_left"],
    title: "Sol Arka Kapı",
    group: "kaporta",
    searchTerms: ["sol arka kapı", "kapı kolu", "kapı menteşesi", "cam"],
  },
  {
    meshNames: ["door_rear_right"],
    title: "Sağ Arka Kapı",
    group: "kaporta",
    searchTerms: ["sağ arka kapı", "kapı kolu", "kapı menteşesi", "cam"],
  },
  {
    meshNames: ["roof"],
    title: "Tavan",
    group: "kaporta",
    searchTerms: ["tavan", "tavan çıtası"],
  },
  {
    meshNames: ["rear_bumper"],
    title: "Arka Tampon",
    group: "arka-grup",
    searchTerms: ["arka tampon", "tampon braketi", "reflektör"],
  },
  {
    meshNames: ["trunk"],
    title: "Bagaj Kapağı",
    group: "arka-grup",
    searchTerms: ["bagaj kapağı", "bagaj kilidi", "bagaj menteşesi"],
  },
  {
    meshNames: ["taillight_left"],
    title: "Sol Stop",
    group: "arka-grup",
    searchTerms: ["sol stop", "stop lambası"],
  },
  {
    meshNames: ["taillight_right"],
    title: "Sağ Stop",
    group: "arka-grup",
    searchTerms: ["sağ stop", "stop lambası"],
  },
];

export function findCatalogPart(meshName: string) {
  return VEHICLE_PARTS.find((part) =>
    part.meshNames.some((name) => meshName.toLowerCase().includes(name))
  );
}
