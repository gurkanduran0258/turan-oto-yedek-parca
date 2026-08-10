export type GroupId =
  | "dis-govde"
  | "on-grup"
  | "arka-grup"
  | "motor"
  | "on-takim"
  | "arka-takim";

export type CatalogPart = {
  id:string;
  title:string;
  group:GroupId;
  match:string[];
  oem:string;
};

export const GROUPS:{id:GroupId;title:string}[]=[
  {id:"dis-govde",title:"Dış Gövde"},
  {id:"on-grup",title:"Ön Grup"},
  {id:"arka-grup",title:"Arka Grup"},
  {id:"motor",title:"Motor & Şanzıman"},
  {id:"on-takim",title:"Ön Takım"},
  {id:"arka-takim",title:"Arka Takım"},
];

export const PARTS:CatalogPart[]=[
  {id:"hood",title:"Kaput",group:"dis-govde",match:["hood","hood_apron"],oem:"51806669"},
  {id:"front-bumper",title:"Ön Tampon",group:"on-grup",match:["front_bumper"],oem:"52149544"},
  {id:"front-grille",title:"Ön Izgara",group:"on-grup",match:["front_grille","front_lower_grille"],oem:"51853968"},
  {id:"headlight-left",title:"Sol Ön Far",group:"on-grup",match:["headlight_left"],oem:""},
  {id:"headlight-right",title:"Sağ Ön Far",group:"on-grup",match:["headlight_right"],oem:""},
  {id:"fender-left",title:"Sol Ön Çamurluk",group:"dis-govde",match:["front_fender_left"],oem:"51806671"},
  {id:"fender-right",title:"Sağ Ön Çamurluk",group:"dis-govde",match:["front_fender_right"],oem:"51806670"},
  {id:"door-fl",title:"Sol Ön Kapı",group:"dis-govde",match:["front_door_left"],oem:"51853964"},
  {id:"door-fr",title:"Sağ Ön Kapı",group:"dis-govde",match:["front_door_right"],oem:"51853965"},
  {id:"slide-left",title:"Sol Sürgülü Kapı",group:"dis-govde",match:["sliding_door_left"],oem:"51806673"},
  {id:"slide-right",title:"Sağ Sürgülü Kapı",group:"dis-govde",match:["sliding_door_right"],oem:"51806672"},
  {id:"rear-door",title:"Arka Bagaj Kapağı",group:"arka-grup",match:["rear_door"],oem:"51806667"},
  {id:"rear-bumper",title:"Arka Tampon",group:"arka-grup",match:["rear_bumper"],oem:"51806668"},
  {id:"tail-left",title:"Sol Stop Lambası",group:"arka-grup",match:["taillight_left"],oem:"51806679"},
  {id:"tail-right",title:"Sağ Stop Lambası",group:"arka-grup",match:["taillight_right"],oem:"51806678"},
  {id:"mirror-left",title:"Sol Ayna",group:"dis-govde",match:["mirror_left"],oem:"735642884"},
  {id:"mirror-right",title:"Sağ Ayna",group:"dis-govde",match:["mirror_right"],oem:"735642883"},

  {id:"radiator",title:"Radyatör",group:"on-grup",match:["mechanical_radiator"],oem:""},
  {id:"intercooler",title:"Intercooler",group:"on-grup",match:["mechanical_intercooler"],oem:""},
  {id:"engine",title:"Motor Komple",group:"motor",match:["mechanical_engine"],oem:""},
  {id:"transmission",title:"Şanzıman",group:"motor",match:["mechanical_transmission"],oem:""},

  {id:"front-strut-left",title:"Sol Ön Amortisör",group:"on-takim",match:["mechanical_front_strut_left"],oem:""},
  {id:"front-strut-right",title:"Sağ Ön Amortisör",group:"on-takim",match:["mechanical_front_strut_right"],oem:""},
  {id:"front-arm-left",title:"Sol Ön Salıncak",group:"on-takim",match:["mechanical_front_arm_left"],oem:""},
  {id:"front-arm-right",title:"Sağ Ön Salıncak",group:"on-takim",match:["mechanical_front_arm_right"],oem:""},

  {id:"rear-shock-left",title:"Sol Arka Amortisör",group:"arka-takim",match:["mechanical_rear_shock_left"],oem:""},
  {id:"rear-shock-right",title:"Sağ Arka Amortisör",group:"arka-takim",match:["mechanical_rear_shock_right"],oem:""},
  {id:"rear-torsion",title:"Arka Torsiyon",group:"arka-takim",match:["mechanical_rear_torsion"],oem:""},
];

export function partForMesh(name:string){
  const n=name.toLowerCase();
  return PARTS.find(p=>p.match.some(m=>n.includes(m.toLowerCase())))||null;
}

export function isBodyMesh(name:string){
  const n=name.toLowerCase();
  return [
    "body_","roof","windshield","window_","hood",
    "front_bumper","front_grille","front_lower_grille",
    "headlight_","front_fender_","front_door_",
    "sliding_door_","rear_quarter_","rear_door",
    "rear_glass","rear_bumper","taillight_","mirror_"
  ].some(x=>n.includes(x));
}

export function isWheelMesh(name:string){
  const n=name.toLowerCase();
  return n.includes("tire_")||n.includes("rim_")||n.includes("hub_");
}
