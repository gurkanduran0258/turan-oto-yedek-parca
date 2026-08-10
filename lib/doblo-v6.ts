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

export type Hitbox = {
  partName:string;
  x:number;
  y:number;
  w:number;
  h:number;
};

export const GROUPS:{id:GroupId;title:string;icon:string}[]=[
  {id:"dis-govde",title:"Dış Gövde",icon:"▰"},
  {id:"on-grup",title:"Ön Grup",icon:"▱"},
  {id:"arka-grup",title:"Arka Grup",icon:"▣"},
  {id:"motor-sanziman",title:"Motor & Şanzıman",icon:"⚙"},
  {id:"on-takim",title:"Ön Takım",icon:"⌘"},
  {id:"arka-takim",title:"Arka Takım",icon:"♮"},
];

export const PARTS:DobloPart[]=[
  // Dış gövde
  {id:"hood",group:"dis-govde",name:"Kaput",oem:"51806669",image:"/catalog/doblo/v6/kaput.png"},
  {id:"front-bumper",group:"dis-govde",name:"Ön Tampon",oem:"52149544",image:"/catalog/doblo/v6/on-tampon.png"},
  {id:"front-grille",group:"dis-govde",name:"Ön Izgara",oem:"51853968",image:"/catalog/doblo/v6/on-izgara.png"},
  {id:"left-fender",group:"dis-govde",name:"Sol Ön Çamurluk",oem:"51806671",image:"/catalog/doblo/v6/sol-camurluk.png"},
  {id:"right-fender",group:"dis-govde",name:"Sağ Ön Çamurluk",oem:"51806670",image:"/catalog/doblo/v6/sag-camurluk.png"},
  {id:"left-front-door",group:"dis-govde",name:"Sol Ön Kapı",oem:"51853964",image:"/catalog/doblo/v6/sol-on-kapi.png"},
  {id:"right-front-door",group:"dis-govde",name:"Sağ Ön Kapı",oem:"51853965",image:"/catalog/doblo/v6/sag-on-kapi.png"},
  {id:"left-sliding-door",group:"dis-govde",name:"Sol Sürgülü Kapı",oem:"51806673",image:"/catalog/doblo/v6/sol-surgulu.png"},
  {id:"right-sliding-door",group:"dis-govde",name:"Sağ Sürgülü Kapı",oem:"51806672",image:"/catalog/doblo/v6/sag-surgulu.png"},
  {id:"rear-door",group:"dis-govde",name:"Arka Bagaj Kapağı",oem:"51806667",image:"/catalog/doblo/v6/arka-bagaj.png"},
  {id:"rear-bumper",group:"dis-govde",name:"Arka Tampon",oem:"51806668",image:"/catalog/doblo/v6/arka-tampon.png"},
  {id:"left-tail",group:"dis-govde",name:"Sol Stop Lambası",oem:"51806679",image:"/catalog/doblo/v6/sol-stop.png"},
  {id:"right-tail",group:"dis-govde",name:"Sağ Stop Lambası",oem:"51806678",image:"/catalog/doblo/v6/sag-stop.png"},
  {id:"left-mirror",group:"dis-govde",name:"Sol Ayna",oem:"735642884",image:"/catalog/doblo/v6/sol-ayna.png"},
  {id:"right-mirror",group:"dis-govde",name:"Sağ Ayna",oem:"735642883",image:"/catalog/doblo/v6/sag-ayna.png"},

  // Ön grup
  {id:"og-hood",group:"on-grup",name:"Kaput",oem:"51806669",image:"/catalog/doblo/v6/kaput.png"},
  {id:"og-bumper",group:"on-grup",name:"Ön Tampon",oem:"52149544",image:"/catalog/doblo/v6/on-tampon.png"},
  {id:"og-grille",group:"on-grup",name:"Ön Izgara",oem:"51853968",image:"/catalog/doblo/v6/on-izgara.png"},
  {id:"og-left-fender",group:"on-grup",name:"Sol Ön Çamurluk",oem:"51806671",image:"/catalog/doblo/v6/sol-camurluk.png"},
  {id:"og-right-fender",group:"on-grup",name:"Sağ Ön Çamurluk",oem:"51806670",image:"/catalog/doblo/v6/sag-camurluk.png"},
  {id:"og-left-headlight",group:"on-grup",name:"Sol Ön Far",oem:"",image:"/catalog/doblo/v6/far.png"},
  {id:"og-right-headlight",group:"on-grup",name:"Sağ Ön Far",oem:"",image:"/catalog/doblo/v6/far.png"},
  {id:"og-radiator",group:"on-grup",name:"Radyatör",oem:"",image:"/catalog/doblo/v6/radyator.png"},
  {id:"og-fan",group:"on-grup",name:"Radyatör Fanı",oem:"",image:"/catalog/doblo/v6/fan.png"},
  {id:"og-intercooler",group:"on-grup",name:"Intercooler",oem:"",image:"/catalog/doblo/v6/radyator.png"},

  // Arka grup
  {id:"ag-door",group:"arka-grup",name:"Arka Bagaj Kapağı",oem:"51806667",image:"/catalog/doblo/v6/arka-bagaj.png"},
  {id:"ag-bumper",group:"arka-grup",name:"Arka Tampon",oem:"51806668",image:"/catalog/doblo/v6/arka-tampon.png"},
  {id:"ag-left-tail",group:"arka-grup",name:"Sol Stop Lambası",oem:"51806679",image:"/catalog/doblo/v6/sol-stop.png"},
  {id:"ag-right-tail",group:"arka-grup",name:"Sağ Stop Lambası",oem:"51806678",image:"/catalog/doblo/v6/sag-stop.png"},

  // Motor & Şanzıman
  {id:"engine",group:"motor-sanziman",name:"Motor Komple",oem:"",image:"/catalog/doblo/v6/motor.png"},
  {id:"gearbox",group:"motor-sanziman",name:"Şanzıman",oem:"",image:"/catalog/doblo/v6/sanziman.png"},
  {id:"turbo",group:"motor-sanziman",name:"Turbo",oem:"",image:"/catalog/doblo/v6/turbo.png"},
  {id:"intake",group:"motor-sanziman",name:"Emme Manifoldu",oem:"",image:"/catalog/doblo/v6/motor.png"},

  // Ön takım
  {id:"front-shock",group:"on-takim",name:"Ön Amortisör",oem:"",image:"/catalog/doblo/v6/amortisor.png"},
  {id:"front-arm",group:"on-takim",name:"Ön Salıncak",oem:"",image:"/catalog/doblo/v6/salincak.png"},
  {id:"front-hub",group:"on-takim",name:"Ön Porya",oem:"",image:"/catalog/doblo/v6/porya.png"},

  // Arka takım
  {id:"rear-shock",group:"arka-takim",name:"Arka Amortisör",oem:"",image:"/catalog/doblo/v6/amortisor.png"},
  {id:"rear-spring",group:"arka-takim",name:"Arka Yay",oem:"",image:"/catalog/doblo/v6/yay.png"},
  {id:"rear-hub",group:"arka-takim",name:"Arka Porya",oem:"",image:"/catalog/doblo/v6/porya.png"},
  {id:"rear-torsion",group:"arka-takim",name:"Arka Torsiyon",oem:"",image:"/catalog/doblo/v6/torsiyon.png"},
];

export const VIEWS=[
  {id:"front34",label:"Ön 3/4",src:"/catalog/doblo/v6/front34.png"},
  {id:"front",label:"Ön",src:"/catalog/doblo/v6/front.png"},
  {id:"side",label:"Yan",src:"/catalog/doblo/v6/side.png"},
  {id:"rear34",label:"Arka 3/4",src:"/catalog/doblo/v6/rear34.png"},
  {id:"rear",label:"Arka",src:"/catalog/doblo/v6/rear.png"},
  {id:"top34",label:"Üst 3/4",src:"/catalog/doblo/v6/top34.png"},
] as const;

/*
  These are percentages of the actual 1600x1200 image.
  Invisible hit areas only. No floating number labels.
*/
export const FRONT34_HITS:Hitbox[]=[
  {partName:"Kaput",x:31,y:29,w:25,h:15},
  {partName:"Ön Tampon",x:20,y:58,w:25,h:14},
  {partName:"Ön Izgara",x:23,y:50,w:23,h:9},
  {partName:"Sol Ön Çamurluk",x:52,y:44,w:15,h:19},
  {partName:"Sağ Ön Çamurluk",x:31,y:43,w:11,h:17},
  {partName:"Sol Ön Kapı",x:59,y:31,w:13,h:27},
  {partName:"Sağ Ön Kapı",x:44,y:31,w:11,h:27},
  {partName:"Sol Sürgülü Kapı",x:72,y:31,w:13,h:28},
  {partName:"Sağ Sürgülü Kapı",x:55,y:31,w:12,h:28},
  {partName:"Sol Ayna",x:71,y:25,w:7,h:8},
  {partName:"Sağ Ayna",x:38,y:25,w:7,h:8},
];

export const REAR34_HITS:Hitbox[]=[
  {partName:"Arka Bagaj Kapağı",x:21,y:18,w:34,h:38},
  {partName:"Arka Tampon",x:20,y:59,w:37,h:15},
  {partName:"Sol Stop Lambası",x:18,y:27,w:7,h:27},
  {partName:"Sağ Stop Lambası",x:53,y:27,w:7,h:27},
];

export const EXPLODED_HITS:Hitbox[]=[
  {partName:"Ön Tampon",x:5,y:47,w:18,h:29},
  {partName:"Ön Izgara",x:9,y:31,w:14,h:19},
  {partName:"Sol Ön Far",x:25,y:30,w:10,h:18},
  {partName:"Sol Ön Çamurluk",x:29,y:10,w:13,h:20},
  {partName:"Kaput",x:42,y:4,w:16,h:15},
  {partName:"Sol Ön Kapı",x:67,y:39,w:10,h:39},
  {partName:"Sol Sürgülü Kapı",x:77,y:38,w:11,h:40},
  {partName:"Arka Bagaj Kapağı",x:77,y:5,w:12,h:21},
  {partName:"Arka Tampon",x:91,y:50,w:8,h:17},
];
