export type GroupId =
  | "dis-govde"
  | "on-grup"
  | "arka-grup"
  | "motor-sanziman"
  | "on-takim"
  | "arka-takim";

export type CatalogPart = {
  id:string;
  title:string;
  group:GroupId;
  oem:string;
  match:string[];
};

export const GROUPS:{id:GroupId;title:string;icon:string}[]=[
  {id:"dis-govde",title:"Dış Gövde",icon:"▰"},
  {id:"on-grup",title:"Ön Grup",icon:"▱"},
  {id:"arka-grup",title:"Arka Grup",icon:"▣"},
  {id:"motor-sanziman",title:"Motor & Şanzıman",icon:"⚙"},
  {id:"on-takim",title:"Ön Takım",icon:"⌘"},
  {id:"arka-takim",title:"Arka Takım",icon:"♮"},
];

/*
 Gerçek GLB mesh adlarına bağlanmıştır.
 Aynı fiziksel mesh birden fazla EPC grubunda gösterilebilir.
*/
export const PARTS:CatalogPart[]=[
  // DIŞ GÖVDE
  {
    id:"hood-body",
    title:"Kaput",
    group:"dis-govde",
    oem:"",
    match:["pab_v55_hood_"]
  },
  {
    id:"door-fl",
    title:"Sol Ön Kapı",
    group:"dis-govde",
    oem:"",
    match:["pab_v55_door_FL_"]
  },
  {
    id:"door-fr",
    title:"Sağ Ön Kapı",
    group:"dis-govde",
    oem:"",
    match:["pab_v55_door_FR_"]
  },
  {
    id:"door-rl",
    title:"Sol Arka Kapı",
    group:"dis-govde",
    oem:"",
    match:["pab_v55_door_RL_"]
  },
  {
    id:"door-rr",
    title:"Sağ Arka Kapı",
    group:"dis-govde",
    oem:"",
    match:["pab_v55_door_RR_"]
  },
  {
    id:"trunk-body",
    title:"Bagaj Kapağı",
    group:"dis-govde",
    oem:"",
    match:["pab_v55_trunk_","bootcam_ok_"]
  },
  {
    id:"front-bumper-body",
    title:"Ön Tampon",
    group:"dis-govde",
    oem:"",
    match:["pab_v55_bumper_F_base_","bump_front_ok."]
  },
  {
    id:"rear-bumper-body",
    title:"Arka Tampon",
    group:"dis-govde",
    oem:"",
    match:["pab_v55_bumper_R_","bump_rear_ok."]
  },
  {
    id:"body-shell",
    title:"Gövde Kabuk",
    group:"dis-govde",
    oem:"",
    match:["pab_v55_body_"]
  },

  // ÖN GRUP
  {
    id:"hood-front",
    title:"Kaput",
    group:"on-grup",
    oem:"",
    match:["pab_v55_hood_"]
  },
  {
    id:"front-bumper",
    title:"Ön Tampon",
    group:"on-grup",
    oem:"",
    match:["pab_v55_bumper_F_base_","bump_front_ok."]
  },
  {
    id:"radiator",
    title:"Radyatör",
    group:"on-grup",
    oem:"",
    match:["pab_v55_radiator_"]
  },
  {
    id:"intercooler",
    title:"Intercooler",
    group:"on-grup",
    oem:"",
    match:["pab_v55_intercooler_"]
  },
  {
    id:"right-headlight-glass",
    title:"Sağ Ön Far Camı",
    group:"on-grup",
    oem:"",
    match:["pab_v55_headlightglass_R_"]
  },

  // ARKA GRUP
  {
    id:"trunk-rear",
    title:"Bagaj Kapağı",
    group:"arka-grup",
    oem:"",
    match:["pab_v55_trunk_","bootcam_ok_"]
  },
  {
    id:"rear-bumper",
    title:"Arka Tampon",
    group:"arka-grup",
    oem:"",
    match:["pab_v55_bumper_R_","bump_rear_ok."]
  },
  {
    id:"rear-light",
    title:"Arka Stop Grubu",
    group:"arka-grup",
    oem:"",
    match:[
      "pab_v55_body_pab_v55_taillight_",
      "bootfar_ok_",
      "bootled_ok_",
      "pab_v55_bumper_R_pab_v55_reverselight_"
    ]
  },

  // MOTOR & ŞANZIMAN
  {
    id:"engine-main",
    title:"Motor Komple",
    group:"motor-sanziman",
    oem:"",
    match:[
      "pab_v55_engine_2AR-FE_",
      "pab_v55_engine_2GR-FE_",
      "pab_v55_engine_pab_v55_engine_",
      "pab_v55_engbaycrap_"
    ]
  },
  {
    id:"transmission",
    title:"Şanzıman",
    group:"motor-sanziman",
    oem:"",
    match:["pab_v55_transmission_awd_"]
  },
  {
    id:"driveshaft",
    title:"Şaft",
    group:"motor-sanziman",
    oem:"",
    match:["pab_v55_driveshaft_"]
  },
  {
    id:"fuel-tank",
    title:"Yakıt Deposu",
    group:"motor-sanziman",
    oem:"",
    match:["pab_v55_fueltank_"]
  },

  // ÖN TAKIM
  {
    id:"front-strut",
    title:"Ön Amortisör / Strut",
    group:"on-takim",
    oem:"",
    match:["pab_v55_strut_F_"]
  },
  {
    id:"front-hub",
    title:"Ön Porya",
    group:"on-takim",
    oem:"",
    match:["pab_v55_hub_F_"]
  },
  {
    id:"front-swaybar",
    title:"Ön Viraj Demiri",
    group:"on-takim",
    oem:"",
    match:["pab_v55_swaybar_F_"]
  },
  {
    id:"front-tierod",
    title:"Rot Kolu",
    group:"on-takim",
    oem:"",
    match:["pab_v55_tierod_F_"]
  },
  {
    id:"front-halfshaft",
    title:"Ön Aks",
    group:"on-takim",
    oem:"",
    match:["pab_v55_halfshaft_F_"]
  },
  {
    id:"front-subframe",
    title:"Ön Travers",
    group:"on-takim",
    oem:"",
    match:["pab_v55_subframe_F_"]
  },
  {
    id:"front-lowerarm",
    title:"Ön Alt Salıncak",
    group:"on-takim",
    oem:"",
    match:["pab_v55_lowerarm_F_"]
  },

  // ARKA TAKIM
  {
    id:"rear-subframe",
    title:"Arka Travers",
    group:"arka-takim",
    oem:"",
    match:["pab_v55_subframe_R_"]
  },
  {
    id:"rear-diff",
    title:"Arka Diferansiyel",
    group:"arka-takim",
    oem:"",
    match:["pab_v55_diff_"]
  },
  {
    id:"rear-upperarm",
    title:"Arka Üst Salıncak",
    group:"arka-takim",
    oem:"",
    match:["pab_v55_upperarm_R_"]
  },
  {
    id:"rear-trailingarm",
    title:"Arka Taşıyıcı Kol",
    group:"arka-takim",
    oem:"",
    match:["pab_v55_trailingarm_R_"]
  },
  {
    id:"rear-swaybar",
    title:"Arka Viraj Demiri",
    group:"arka-takim",
    oem:"",
    match:["pab_v55_swaybar_R_"]
  },
  {
    id:"rear-lowerarm",
    title:"Arka Alt Salıncak",
    group:"arka-takim",
    oem:"",
    match:["pab_v55_lowerarm_R_"]
  },
  {
    id:"rear-hub",
    title:"Arka Porya",
    group:"arka-takim",
    oem:"",
    match:["pab_v55_hub_R_"]
  },
  {
    id:"rear-halfshaft",
    title:"Arka Aks",
    group:"arka-takim",
    oem:"",
    match:["pab_v55_halfshaft_R_"]
  },
  {
    id:"rear-coilover",
    title:"Arka Amortisör / Coilover",
    group:"arka-takim",
    oem:"",
    match:["pab_v55_coilover_R_"]
  },
];

export function partsForGroup(group:GroupId){
  return PARTS.filter(p=>p.group===group);
}

export function partForMeshInGroup(meshName:string,group:GroupId){
  const n=meshName.toLowerCase();
  return PARTS.find(
    p=>p.group===group&&
       p.match.some(m=>n.includes(m.toLowerCase()))
  )||null;
}

export function meshBelongsToPart(
  meshName:string,
  part:CatalogPart
){
  const n=meshName.toLowerCase();
  return part.match.some(m=>n.includes(m.toLowerCase()));
}

export function isMechanical(name:string){
  const n=name.toLowerCase();
  return [
    "engine_","engbaycrap","radiator","intercooler",
    "fueltank","strut_","hub_","swaybar_","tierod_",
    "brace","halfshaft","transmission","subframe_",
    "lowerarm_","driveshaft","diff_","upperarm_",
    "trailingarm_","coilover_"
  ].some(x=>n.includes(x));
}

export function isWheel(name:string){
  const n=name.toLowerCase();
  return (
    n.includes("wheel321") ||
    n.startsWith("tire") ||
    n.includes("_tire_")
  );
}

export function isInterior(name:string){
  const n=name.toLowerCase();
  return [
    "steer","needle_","decals_gauges","seats_",
    "paspas","int_int","speedometer"
  ].some(x=>n.includes(x));
}

export function isExterior(name:string){
  return !isMechanical(name)&&!isInterior(name);
}
