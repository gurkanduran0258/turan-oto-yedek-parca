export type GroupId =
  | "dis-govde"
  | "on-grup"
  | "arka-grup"
  | "motor"
  | "on-takim"
  | "arka-takim";

export type VehicleId = "egea" | "doblo" | "fiorino";

export type CatalogPart = {
  id: string;
  title: string;
  group: GroupId;
  match: string[];
  searchTerms: string[];
};

export const VEHICLES = [
  { id:"egea" as VehicleId, title:"Fiat Egea", subtitle:"Sedan", modelUrl:"/models/fiat-egea-catalog.glb", ready:true },
  { id:"doblo" as VehicleId, title:"Fiat Doblo", subtitle:"263", modelUrl:"/models/fiat-doblo-catalog.glb", ready:false },
  { id:"fiorino" as VehicleId, title:"Fiat Fiorino", subtitle:"Qubo / Cargo", modelUrl:"/models/fiat-fiorino-catalog.glb", ready:false },
];

export const GROUPS: {id:GroupId;title:string;description:string}[] = [
  { id:"dis-govde", title:"Dış Gövde", description:"Kapılar, çamurluklar, kaput, bagaj ve dış kaporta" },
  { id:"on-grup", title:"Ön Grup", description:"Ön tampon, farlar, radyatör, intercooler ve ön panel bölgesi" },
  { id:"arka-grup", title:"Arka Grup", description:"Arka tampon, stoplar ve bagaj bölgesi" },
  { id:"motor", title:"Motor & Şanzıman", description:"Motor, turbo, emme, şanzıman ve aktarma" },
  { id:"on-takim", title:"Ön Takım", description:"Salıncak, amortisör, porya, rot, aks ve travers" },
  { id:"arka-takim", title:"Arka Takım", description:"Arka süspansiyon, amortisör, yay, porya ve torsiyon" },
];

export const PARTS:CatalogPart[] = [
  {id:"front-bumper",title:"Ön Tampon",group:"on-grup",match:["front_bumper"],searchTerms:["ön tampon","tampon ön","tampon"]},
  {id:"headlight-left",title:"Sol Ön Far",group:"on-grup",match:["headlight_left"],searchTerms:["sol ön far","sol far"]},
  {id:"headlight-right",title:"Sağ Ön Far",group:"on-grup",match:["headlight_right"],searchTerms:["sağ ön far","sağ far"]},
  {id:"radiator",title:"Radyatör",group:"on-grup",match:["mechanical_radiator"],searchTerms:["radyatör"]},
  {id:"intercooler",title:"Intercooler",group:"on-grup",match:["mechanical_intercooler"],searchTerms:["intercooler","ara soğutucu"]},
  {id:"radiator-fan",title:"Radyatör Fanı",group:"on-grup",match:["mechanical_radiator_fan"],searchTerms:["radyatör fanı","fan motoru"]},

  {id:"hood",title:"Kaput",group:"dis-govde",match:["hood"],searchTerms:["kaput"]},
  {id:"fender-left",title:"Sol Ön Çamurluk",group:"dis-govde",match:["front_fender_left"],searchTerms:["sol ön çamurluk","sol çamurlurluk"]},
  {id:"fender-right",title:"Sağ Ön Çamurluk",group:"dis-govde",match:["front_fender_right"],searchTerms:["sağ ön çamurluk","sağ çamurluk"]},
  {id:"door-fl",title:"Sol Ön Kapı",group:"dis-govde",match:["door_front_left"],searchTerms:["sol ön kapı","ön kapı sol"]},
  {id:"door-fr",title:"Sağ Ön Kapı",group:"dis-govde",match:["door_front_right"],searchTerms:["sağ ön kapı","ön kapı sağ"]},
  {id:"door-rl",title:"Sol Arka Kapı",group:"dis-govde",match:["door_rear_left"],searchTerms:["sol arka kapı","arka kapı sol"]},
  {id:"door-rr",title:"Sağ Arka Kapı",group:"dis-govde",match:["door_rear_right"],searchTerms:["sağ arka kapı","arka kapı sağ"]},

  {id:"rear-bumper",title:"Arka Tampon",group:"arka-grup",match:["rear_bumper"],searchTerms:["arka tampon","tampon arka"]},
  {id:"trunk",title:"Bagaj Kapağı",group:"arka-grup",match:["trunk"],searchTerms:["bagaj kapağı","bagaj kapak"]},
  {id:"taillight-left",title:"Sol Stop",group:"arka-grup",match:["taillight_left"],searchTerms:["sol stop","sol arka stop"]},
  {id:"taillight-right",title:"Sağ Stop",group:"arka-grup",match:["taillight_right"],searchTerms:["sağ stop","sağ arka stop"]},

  {id:"engine",title:"Motor",group:"motor",match:["mechanical_engine"],searchTerms:["motor komple","motor"]},
  {id:"transmission",title:"Şanzıman",group:"motor",match:["mechanical_transmission"],searchTerms:["şanzıman"]},
  {id:"turbo",title:"Turbo",group:"motor",match:["mechanical_turbo"],searchTerms:["turbo","turboşarj"]},
  {id:"intake",title:"Emme Sistemi",group:"motor",match:["mechanical_intake"],searchTerms:["emme manifoldu","emme"]},
  {id:"transfer",title:"Aktarma",group:"motor",match:["mechanical_transfercase","mechanical_driveshaft"],searchTerms:["aks","aktarma"]},
  {id:"exhaust",title:"Egzoz Sistemi",group:"motor",match:["mechanical_exhaust"],searchTerms:["egzoz"]},

  {id:"front-strut",title:"Ön Amortisör",group:"on-takim",match:["mechanical_strut_front"],searchTerms:["ön amortisör","amortisör ön"]},
  {id:"front-hub",title:"Ön Porya",group:"on-takim",match:["mechanical_hub_front"],searchTerms:["ön porya","porya ön"]},
  {id:"front-arm",title:"Ön Salıncak",group:"on-takim",match:["mechanical_lowerarm_front"],searchTerms:["ön salıncak","salıncak"]},
  {id:"front-tie",title:"Rot / Rot Kolu",group:"on-takim",match:["mechanical_tierod_front"],searchTerms:["rot başı","rot kolu","rot"]},
  {id:"front-axle",title:"Ön Aks",group:"on-takim",match:["mechanical_halfshaft_front"],searchTerms:["ön aks","aks"]},
  {id:"front-subframe",title:"Ön Travers",group:"on-takim",match:["mechanical_subframe_front"],searchTerms:["ön travers","travers"]},
  {id:"front-sway",title:"Ön Viraj Demiri",group:"on-takim",match:["mechanical_swaybar_front"],searchTerms:["viraj demiri","denge kolu"]},

  {id:"rear-shock",title:"Arka Amortisör",group:"arka-takim",match:["mechanical_shock_rear"],searchTerms:["arka amortisör","amortisör arka"]},
  {id:"rear-spring",title:"Arka Yay",group:"arka-takim",match:["mechanical_spring_rear"],searchTerms:["arka yay","helezon yay"]},
  {id:"rear-hub",title:"Arka Porya",group:"arka-takim",match:["mechanical_hub_rear"],searchTerms:["arka porya","porya arka"]},
  {id:"rear-arm",title:"Arka Salıncak",group:"arka-takim",match:["mechanical_lowerarm_rear","mechanical_trailingarm_rear"],searchTerms:["arka salıncak","salıncak arka"]},
  {id:"rear-torsion",title:"Arka Torsiyon",group:"arka-takim",match:["mechanical_torsionbeam"],searchTerms:["arka torsiyon","torsiyon"]},
  {id:"rear-subframe",title:"Arka Travers",group:"arka-takim",match:["mechanical_subframe_rear"],searchTerms:["arka travers","travers arka"]},
];

export const isBodyMesh=(n:string)=>
  ["fiategea_body","door_","front_fender","hood","trunk","front_bumper","rear_bumper",
   "headlight","taillight","mirror","doorglass","windshield","backlight","handle_","badge_"]
    .some(x=>n.toLowerCase().includes(x));

export const isWheelMesh=(n:string)=>
  ["fiat_egea_factory_rim","egea_tire"].some(x=>n.toLowerCase().includes(x));

export function partForMesh(name:string){
  const n=name.toLowerCase();
  return PARTS.find(p=>p.match.some(m=>n.includes(m)));
}
