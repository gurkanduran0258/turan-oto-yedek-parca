export type CatalogGroup =
  | "dis-govde"
  | "on-grup"
  | "arka-grup"
  | "motor-sanziman"
  | "on-takim"
  | "arka-takim";

export type CatalogPart = {
  id: string;
  group: CatalogGroup;
  name: string;
  oem: string;
  note?: string;
};

export const DOBLO_GROUPS: {
  id: CatalogGroup;
  title: string;
  icon: string;
}[] = [
  { id: "dis-govde", title: "Dış Gövde", icon: "▰" },
  { id: "on-grup", title: "Ön Grup", icon: "◫" },
  { id: "arka-grup", title: "Arka Grup", icon: "▣" },
  { id: "motor-sanziman", title: "Motor & Şanzıman", icon: "⚙" },
  { id: "on-takim", title: "Ön Takım", icon: "⌁" },
  { id: "arka-takim", title: "Arka Takım", icon: "⌁" },
];

export const DOBLO_PARTS: CatalogPart[] = [
  { id: "hood", group: "dis-govde", name: "Kaput", oem: "51806669" },
  { id: "front-bumper", group: "dis-govde", name: "Ön Tampon", oem: "735574911" },
  { id: "front-grille", group: "dis-govde", name: "Ön Izgara", oem: "735574912" },
  { id: "fender-left", group: "dis-govde", name: "Sol Çamurluk", oem: "51926506" },
  { id: "fender-right", group: "dis-govde", name: "Sağ Çamurluk", oem: "51926505" },
  { id: "door-front-left", group: "dis-govde", name: "Sol Ön Kapı", oem: "51974435" },
  { id: "door-front-right", group: "dis-govde", name: "Sağ Ön Kapı", oem: "51974434" },
  { id: "sliding-left", group: "dis-govde", name: "Sol Sürgülü Kapı", oem: "51974437" },

  { id: "hood-front", group: "on-grup", name: "Kaput", oem: "51806669" },
  { id: "bumper-front", group: "on-grup", name: "Ön Tampon", oem: "735574911" },
  { id: "grille-front", group: "on-grup", name: "Ön Izgara", oem: "735574912" },
  { id: "fender-front-left", group: "on-grup", name: "Sol Çamurluk", oem: "51926506" },
  { id: "fender-front-right", group: "on-grup", name: "Sağ Çamurluk", oem: "51926505" },

  { id: "rear-door-left", group: "arka-grup", name: "Sol Arka Kapı", oem: "51974437" },
  { id: "rear-door-right", group: "arka-grup", name: "Sağ Arka Kapı", oem: "51974438" },
  { id: "rear-bumper", group: "arka-grup", name: "Arka Tampon", oem: "735574915" },

  { id: "engine", group: "motor-sanziman", name: "Motor Grubu", oem: "MOTOR" },
  { id: "transmission", group: "motor-sanziman", name: "Şanzıman Grubu", oem: "SANZIMAN" },
  { id: "front-suspension", group: "on-takim", name: "Ön Süspansiyon Grubu", oem: "ONTAKIM" },
  { id: "rear-suspension", group: "arka-takim", name: "Arka Süspansiyon Grubu", oem: "ARKATAKIM" },
];

export const DOBLO_VIEWS = [
  { id: "front34", label: "Ön 3/4", src: "/catalog/doblo/doblo-front-34.png" },
  { id: "front", label: "Ön", src: "/catalog/doblo/doblo-front.png" },
  { id: "side", label: "Yan", src: "/catalog/doblo/doblo-side.png" },
  { id: "rear34", label: "Arka 3/4", src: "/catalog/doblo/doblo-rear-34.png" },
  { id: "rear", label: "Arka", src: "/catalog/doblo/doblo-rear.png" },
  { id: "top34", label: "Üst 3/4", src: "/catalog/doblo/doblo-top-34.png" },
] as const;
