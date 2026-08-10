export type GroupId =
  | "dis-govde"
  | "on-grup"
  | "arka-grup"
  | "motor-sanziman"
  | "on-takim"
  | "arka-takim";

export type DobloPart = {
  id:string;
  group:GroupId;
  name:string;
  oem:string;
  image:string;
};

export const DOBLO_GROUPS:{id:GroupId;title:string;icon:string}[]=[
  {id:"dis-govde",title:"Dış Gövde",icon:"▰"},
  {id:"on-grup",title:"Ön Grup",icon:"▱"},
  {id:"arka-grup",title:"Arka Grup",icon:"▣"},
  {id:"motor-sanziman",title:"Motor & Şanzıman",icon:"⚙"},
  {id:"on-takim",title:"Ön Takım",icon:"⌘"},
  {id:"arka-takim",title:"Arka Takım",icon:"♮"},
];

export const DOBLO_PARTS:DobloPart[]=[
  // DIŞ GÖVDE
  {id:"kaput",group:"dis-govde",name:"Kaput",oem:"51806669",image:"/catalog/doblo/v3/kaput.png"},
  {id:"on-tampon",group:"dis-govde",name:"Ön Tampon",oem:"52149544",image:"/catalog/doblo/v3/on-tampon.png"},
  {id:"on-izgara",group:"dis-govde",name:"Ön Izgara",oem:"51853968",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"sol-on-camurluk",group:"dis-govde",name:"Sol Ön Çamurluk",oem:"51806671",image:"/catalog/doblo/v3/sol-camurluk.png"},
  {id:"sag-on-camurluk",group:"dis-govde",name:"Sağ Ön Çamurluk",oem:"51806670",image:"/catalog/doblo/v3/sag-camurluk.png"},
  {id:"sol-on-kapi",group:"dis-govde",name:"Sol Ön Kapı",oem:"51853964",image:"/catalog/doblo/v3/sol-on-kapi.png"},
  {id:"sag-on-kapi",group:"dis-govde",name:"Sağ Ön Kapı",oem:"51853965",image:"/catalog/doblo/v3/sag-on-kapi.png"},
  {id:"sol-surgulu",group:"dis-govde",name:"Sol Sürgülü Kapı",oem:"51806673",image:"/catalog/doblo/v3/sol-surgulu.png"},
  {id:"sag-surgulu",group:"dis-govde",name:"Sağ Sürgülü Kapı",oem:"51806672",image:"/catalog/doblo/v3/sag-surgulu.png"},
  {id:"arka-bagaj",group:"dis-govde",name:"Arka Bagaj Kapağı",oem:"51806667",image:"/catalog/doblo/v3/arka-bagaj.png"},
  {id:"arka-tampon",group:"dis-govde",name:"Arka Tampon",oem:"51806668",image:"/catalog/doblo/v3/arka-tampon.png"},
  {id:"sol-stop",group:"dis-govde",name:"Sol Stop Lambası",oem:"51806679",image:"/catalog/doblo/v3/sol-stop.png"},
  {id:"sag-stop",group:"dis-govde",name:"Sağ Stop Lambası",oem:"51806678",image:"/catalog/doblo/v3/sag-stop.png"},
  {id:"sol-ayna",group:"dis-govde",name:"Sol Ayna",oem:"735642884",image:"/catalog/doblo/v3/sol-ayna.png"},
  {id:"sag-ayna",group:"dis-govde",name:"Sağ Ayna",oem:"735642883",image:"/catalog/doblo/v3/sag-ayna.png"},

  // ÖN GRUP
  {id:"og-kaput",group:"on-grup",name:"Kaput",oem:"51806669",image:"/catalog/doblo/v3/kaput.png"},
  {id:"og-tampon",group:"on-grup",name:"Ön Tampon",oem:"52149544",image:"/catalog/doblo/v3/on-tampon.png"},
  {id:"og-izgara",group:"on-grup",name:"Ön Izgara",oem:"51853968",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"og-sol-camurluk",group:"on-grup",name:"Sol Ön Çamurluk",oem:"51806671",image:"/catalog/doblo/v3/sol-camurluk.png"},
  {id:"og-sag-camurluk",group:"on-grup",name:"Sağ Ön Çamurluk",oem:"51806670",image:"/catalog/doblo/v3/sag-camurluk.png"},
  {id:"og-sol-far",group:"on-grup",name:"Sol Ön Far",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"og-sag-far",group:"on-grup",name:"Sağ Ön Far",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"og-radyator",group:"on-grup",name:"Radyatör",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"og-fan",group:"on-grup",name:"Radyatör Fanı",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"og-intercooler",group:"on-grup",name:"Intercooler",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},

  // ARKA GRUP
  {id:"ag-bagaj",group:"arka-grup",name:"Arka Bagaj Kapağı",oem:"51806667",image:"/catalog/doblo/v3/arka-bagaj.png"},
  {id:"ag-tampon",group:"arka-grup",name:"Arka Tampon",oem:"51806668",image:"/catalog/doblo/v3/arka-tampon.png"},
  {id:"ag-sol-stop",group:"arka-grup",name:"Sol Stop Lambası",oem:"51806679",image:"/catalog/doblo/v3/sol-stop.png"},
  {id:"ag-sag-stop",group:"arka-grup",name:"Sağ Stop Lambası",oem:"51806678",image:"/catalog/doblo/v3/sag-stop.png"},
  {id:"ag-sol-surgulu",group:"arka-grup",name:"Sol Sürgülü Kapı",oem:"51806673",image:"/catalog/doblo/v3/sol-surgulu.png"},
  {id:"ag-sag-surgulu",group:"arka-grup",name:"Sağ Sürgülü Kapı",oem:"51806672",image:"/catalog/doblo/v3/sag-surgulu.png"},

  // MOTOR & ŞANZIMAN
  {id:"ms-motor",group:"motor-sanziman",name:"Motor Komple",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"ms-sanziman",group:"motor-sanziman",name:"Şanzıman",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"ms-turbo",group:"motor-sanziman",name:"Turbo",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"ms-emme",group:"motor-sanziman",name:"Emme Manifoldu",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"ms-egzoz",group:"motor-sanziman",name:"Egzoz Sistemi",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},

  // ÖN TAKIM
  {id:"ot-amortisor",group:"on-takim",name:"Ön Amortisör",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"ot-salincak",group:"on-takim",name:"Ön Salıncak",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"ot-porya",group:"on-takim",name:"Ön Porya",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"ot-rot",group:"on-takim",name:"Rot / Rot Kolu",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},
  {id:"ot-aks",group:"on-takim",name:"Ön Aks",oem:"",image:"/catalog/doblo/v3/on-izgara.png"},

  // ARKA TAKIM
  {id:"at-amortisor",group:"arka-takim",name:"Arka Amortisör",oem:"",image:"/catalog/doblo/v3/arka-tampon.png"},
  {id:"at-yay",group:"arka-takim",name:"Arka Yay",oem:"",image:"/catalog/doblo/v3/arka-tampon.png"},
  {id:"at-porya",group:"arka-takim",name:"Arka Porya",oem:"",image:"/catalog/doblo/v3/arka-tampon.png"},
  {id:"at-salincak",group:"arka-takim",name:"Arka Salıncak",oem:"",image:"/catalog/doblo/v3/arka-tampon.png"},
  {id:"at-torsiyon",group:"arka-takim",name:"Arka Torsiyon",oem:"",image:"/catalog/doblo/v3/arka-tampon.png"},
];

export const DOBLO_VIEWS=[
  {id:"front34",label:"Ön 3/4",src:"/catalog/doblo/v3/front34.png"},
  {id:"front",label:"Ön",src:"/catalog/doblo/v3/front.png"},
  {id:"side",label:"Yan",src:"/catalog/doblo/v3/side.png"},
  {id:"rear34",label:"Arka 3/4",src:"/catalog/doblo/v3/rear34.png"},
  {id:"rear",label:"Arka",src:"/catalog/doblo/v3/rear.png"},
  {id:"top34",label:"Üst 3/4",src:"/catalog/doblo/v3/top34.png"},
] as const;
