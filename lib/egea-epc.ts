export type GroupId =
  | "dis-govde"
  | "on-grup"
  | "arka-grup"
  | "motor"
  | "on-takim"
  | "arka-takim";

export type CatalogPart = {
  id: string;
  title: string;
  group: GroupId;
  match: string[];
  oemCodes: string[];
};

export const GROUPS: {id:GroupId; title:string; description:string}[] = [
  { id:"dis-govde", title:"Dış Gövde", description:"Kapılar, çamurluklar, kaput, bagaj ve dış kaporta" },
  { id:"on-grup", title:"Ön Grup", description:"Ön tampon, farlar, radyatör, intercooler ve ön panel bölgesi" },
  { id:"arka-grup", title:"Arka Grup", description:"Arka tampon, stoplar ve bagaj bölgesi" },
  { id:"motor", title:"Motor & Şanzıman", description:"Motor, turbo, emme, şanzıman ve aktarma" },
  { id:"on-takim", title:"Ön Takım", description:"Salıncak, amortisör, porya, rot, aks ve travers" },
  { id:"arka-takim", title:"Arka Takım", description:"Arka süspansiyon, amortisör, yay, porya ve torsiyon" },
];

export const PARTS: CatalogPart[] = [
  {id:"front-bumper",title:"Ön Tampon",group:"on-grup",match:["front_bumper"],oemCodes:[]},
  {id:"headlight-left",title:"Sol Ön Far",group:"on-grup",match:["headlight_left"],oemCodes:[]},
  {id:"headlight-right",title:"Sağ Ön Far",group:"on-grup",match:["headlight_right"],oemCodes:[]},
  {id:"radiator",title:"Radyatör",group:"on-grup",match:["mechanical_radiator"],oemCodes:[]},
  {id:"intercooler",title:"Intercooler",group:"on-grup",match:["mechanical_intercooler"],oemCodes:[]},
  {id:"radiator-fan",title:"Radyatör Fanı",group:"on-grup",match:["mechanical_radiator_fan"],oemCodes:[]},

  {id:"hood",title:"Kaput",group:"dis-govde",match:["hood"],oemCodes:[]},
  {id:"fender-left",title:"Sol Ön Çamurluk",group:"dis-govde",match:["front_fender_left"],oemCodes:[]},
  {id:"fender-right",title:"Sağ Ön Çamurluk",group:"dis-govde",match:["front_fender_right"],oemCodes:[]},
  {id:"door-fl",title:"Sol Ön Kapı",group:"dis-govde",match:["door_front_left"],oemCodes:[]},
  {id:"door-fr",title:"Sağ Ön Kapı",group:"dis-govde",match:["door_front_right"],oemCodes:[]},
  {id:"door-rl",title:"Sol Arka Kapı",group:"dis-govde",match:["door_rear_left"],oemCodes:[]},
  {id:"door-rr",title:"Sağ Arka Kapı",group:"dis-govde",match:["door_rear_right"],oemCodes:[]},

  {id:"rear-bumper",title:"Arka Tampon",group:"arka-grup",match:["rear_bumper"],oemCodes:[]},
  {id:"trunk",title:"Bagaj Kapağı",group:"arka-grup",match:["trunk"],oemCodes:[]},
  {id:"taillight-left",title:"Sol Stop",group:"arka-grup",match:["taillight_left"],oemCodes:[]},
  {id:"taillight-right",title:"Sağ Stop",group:"arka-grup",match:["taillight_right"],oemCodes:[]},

  {id:"engine",title:"Motor",group:"motor",match:["mechanical_engine"],oemCodes:[]},
  {id:"transmission",title:"Şanzıman",group:"motor",match:["mechanical_transmission"],oemCodes:[]},
  {id:"turbo",title:"Turbo",group:"motor",match:["mechanical_turbo"],oemCodes:[]},
  {id:"intake",title:"Emme Sistemi",group:"motor",match:["mechanical_intake"],oemCodes:[]},
  {id:"transfer",title:"Transfer / Aktarma",group:"motor",match:["mechanical_transfercase","mechanical_driveshaft"],oemCodes:[]},
  {id:"exhaust",title:"Egzoz Sistemi",group:"motor",match:["mechanical_exhaust"],oemCodes:[]},

  {id:"front-strut",title:"Ön Amortisör",group:"on-takim",match:["mechanical_strut_front"],oemCodes:[]},
  {id:"front-hub",title:"Ön Porya",group:"on-takim",match:["mechanical_hub_front"],oemCodes:[]},
  {id:"front-arm",title:"Ön Salıncak",group:"on-takim",match:["mechanical_lowerarm_front"],oemCodes:[]},
  {id:"front-tie",title:"Rot / Rot Kolu",group:"on-takim",match:["mechanical_tierod_front"],oemCodes:[]},
  {id:"front-axle",title:"Ön Aks",group:"on-takim",match:["mechanical_halfshaft_front"],oemCodes:[]},
  {id:"front-subframe",title:"Ön Travers",group:"on-takim",match:["mechanical_subframe_front"],oemCodes:[]},
  {id:"front-sway",title:"Ön Viraj Demiri",group:"on-takim",match:["mechanical_swaybar_front"],oemCodes:[]},

  {id:"rear-shock",title:"Arka Amortisör",group:"arka-takim",match:["mechanical_shock_rear"],oemCodes:[]},
  {id:"rear-spring",title:"Arka Yay",group:"arka-takim",match:["mechanical_spring_rear"],oemCodes:[]},
  {id:"rear-hub",title:"Arka Porya",group:"arka-takim",match:["mechanical_hub_rear"],oemCodes:[]},
  {id:"rear-arm",title:"Arka Salıncak",group:"arka-takim",match:["mechanical_lowerarm_rear","mechanical_trailingarm_rear"],oemCodes:[]},
  {id:"rear-torsion",title:"Arka Torsiyon",group:"arka-takim",match:["mechanical_torsionbeam"],oemCodes:[]},
  {id:"rear-subframe",title:"Arka Travers",group:"arka-takim",match:["mechanical_subframe_rear"],oemCodes:[]},
];

export const isBodyMesh = (n:string) =>
  ["fiategea_body","door_","front_fender","hood","trunk","front_bumper","rear_bumper",
   "headlight","taillight","mirror","doorglass","windshield","backlight","handle_","badge_"].some(x=>n.toLowerCase().includes(x));

export const isWheelMesh = (n:string) =>
  ["fiat_egea_factory_rim","egea_tire"].some(x=>n.toLowerCase().includes(x));

export function partForMesh(name:string) {
  const n=name.toLowerCase();
  return PARTS.find(p=>p.match.some(m=>n.includes(m)));
}
