export type DobloPart = {
  id:string;
  name:string;
  oem:string;
  image:string;
};

export const DOBLO_PARTS:DobloPart[]=[
  {id:"kaput",name:"Kaput",oem:"51806669",image:"/catalog/doblo/v3/kaput.png"},
  {id:"on-tampon",name:"Ön Tampon",oem:"52149544",image:"/catalog/doblo/v3/on-tampon.png"},
  {id:"on-izgara",name:"Ön Izgara",oem:"51853968",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"sol-on-camurluk",name:"Sol Ön Çamurluk",oem:"51806671",image:"/catalog/doblo/v3/sol-camurluk.png"},
  {id:"sag-on-camurluk",name:"Sağ Ön Çamurluk",oem:"51806670",image:"/catalog/doblo/v3/sag-camurluk.png"},
  {id:"sol-on-kapi",name:"Sol Ön Kapı",oem:"51853964",image:"/catalog/doblo/v3/sol-on-kapi.png"},
  {id:"sag-on-kapi",name:"Sağ Ön Kapı",oem:"51853965",image:"/catalog/doblo/v3/sag-on-kapi.png"},
  {id:"sol-surgulu",name:"Sol Sürgülü Kapı",oem:"51806673",image:"/catalog/doblo/v3/sol-surgulu.png"},
  {id:"sag-surgulu",name:"Sağ Sürgülü Kapı",oem:"51806672",image:"/catalog/doblo/v3/sag-surgulu.png"},
  {id:"arka-bagaj",name:"Arka Bagaj Kapağı",oem:"51806667",image:"/catalog/doblo/v3/arka-bagaj.png"},
  {id:"arka-tampon",name:"Arka Tampon",oem:"51806668",image:"/catalog/doblo/v3/arka-tampon.png"},
  {id:"sol-stop",name:"Sol Stop Lambası",oem:"51806679",image:"/catalog/doblo/v3/sol-stop.png"},
  {id:"sag-stop",name:"Sağ Stop Lambası",oem:"51806678",image:"/catalog/doblo/v3/sag-stop.png"},
  {id:"sol-ayna",name:"Sol Ayna",oem:"735642884",image:"/catalog/doblo/v3/sol-ayna.png"},
  {id:"sag-ayna",name:"Sağ Ayna",oem:"735642883",image:"/catalog/doblo/v3/sag-ayna.png"},
];

export const DOBLO_VIEWS=[
  {id:"front34",label:"Ön 3/4",src:"/catalog/doblo/v3/front34.png"},
  {id:"front",label:"Ön",src:"/catalog/doblo/v3/front.png"},
  {id:"side",label:"Yan",src:"/catalog/doblo/v3/side.png"},
  {id:"rear34",label:"Arka 3/4",src:"/catalog/doblo/v3/rear34.png"},
  {id:"rear",label:"Arka",src:"/catalog/doblo/v3/rear.png"},
  {id:"top34",label:"Üst 3/4",src:"/catalog/doblo/v3/top34.png"},
] as const;
