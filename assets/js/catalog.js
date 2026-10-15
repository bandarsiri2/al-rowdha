/* ============ AL-ROWDHA shared catalog + admin store ============
   Pure data layer, no DOM. Used by app.js (storefront) and admin.js. */
(function(){
"use strict";
const PH = "assets/img/photos/";
/* Default products (core, hand-written in HTML) */
const DEF = [
 {id:"carpet",nameKey:"prod_carpet_name",metaKey:"prod_carpet_meta",name_en:"Emerald Gold Mihrab Prayer Rug",price:189,img:"rug-mihrab.svg",cat:"prayer",mat:"wool",color:"emerald",size:"70x120",rating:4.9,reviews:124,badge:"bestseller",stock:24},
 {id:"rug1",nameKey:"rug1_name",metaKey:"rug1_meta",name_en:"Emerald Gold Mihrab Prayer Rug",price:149,img:"rug-mihrab.svg",cat:"prayer",mat:"wool",color:"emerald",size:"70x120",rating:4.9,reviews:124,badge:"bestseller",stock:24},
 {id:"rug2",nameKey:"rug2_name",metaKey:"rug2_meta",name_en:"Emerald Ornate Medallion Rug",price:165,img:"rug-medallion.svg",cat:"prayer",mat:"wool",color:"gold",size:"80x130",rating:4.8,reviews:98,badge:"bestseller",stock:18},
 {id:"rug3",nameKey:"rug3_name",metaKey:"rug3_meta",name_en:"Emerald Vine Pattern Prayer Rug",price:179,img:"rug-vine.svg",cat:"prayer",mat:"wool",color:"emerald",size:"70x120",rating:4.9,reviews:61,badge:"new",stock:15},
 {id:"rug4",nameKey:"rug4_name",metaKey:"rug4_meta",name_en:"Emerald Classic Mihrab Rug",price:189,img:"rug-classic.svg",cat:"prayer",mat:"silk",color:"emerald",size:"90x150",rating:4.8,reviews:87,stock:12},
 {id:"rug5",nameKey:"rug5_name",metaKey:"rug5_meta",name_en:"Emerald Geometric Star Rug",price:159,img:"rug-star.svg",cat:"prayer",mat:"wool",color:"emerald",size:"70x120",rating:4.7,reviews:73,stock:20},
 {id:"rug6",nameKey:"rug6_name",metaKey:"rug6_meta",name_en:"Emerald Arabesque Prayer Rug",price:172,img:"rug-arabesque.svg",cat:"prayer",mat:"silk",color:"emerald",size:"80x130",rating:4.9,reviews:54,stock:14},
 {id:"rob",nameKey:"prod_rob_name",metaKey:"prod_rob_meta",name_en:"Emerald Green Embroidered Robe",price:175,img:"robe.svg",cat:"robes",mat:"cotton",color:"emerald",size:"M",rating:4.9,reviews:124,stock:30},
 {id:"oud",nameKey:"prod_oud_name",metaKey:"prod_oud_meta",name_en:"Oud Perfume — 50ml Eau de Parfum",price:115,img:"perfume.svg",cat:"perfume",mat:"silk",color:"gold",size:"50ml",rating:4.8,reviews:123,stock:40},
 {id:"mab",nameKey:"prod_mab_name",metaKey:"prod_mab_meta",name_en:"Gold Mabkhara Incense Burner",price:68,img:"mabkhara.svg",cat:"mabkhara",mat:"wool",color:"gold",size:"12cm",rating:4.9,reviews:127,stock:50},
 {id:"shar",nameKey:"prod_shar_name",metaKey:"prod_shar_meta",name_en:"Sharashef Gold Embroidered Bed Sheet Set",price:95,img:"bedding.svg",cat:"bedding",mat:"cotton",color:"beige",size:"King",rating:4.8,reviews:1248,stock:60}
];
const ADMIN_KEY="ar-admin-v1";
const ADMIN_EMAIL="admin@alrowdha.com";
const ADMIN_PASS="qoQw7cNrf-tUAof1";
/* Magic admin link: opening admin.html?grant=<token> signs the visitor in as admin. */
const ADMIN_GRANT_TOKEN="90a35bb6be348ecf7726289dd8adf6c0";
function getAdmin(){ try{ const a=JSON.parse(localStorage.getItem(ADMIN_KEY)); return a&&typeof a==="object"?a:{}; }catch(e){ return {}; } }
function saveAdmin(a){ try{ localStorage.setItem(ADMIN_KEY, JSON.stringify(a)); }catch(e){} }
function catalog(){
  const a=getAdmin();
  const p={}; DEF.forEach(d=>{ if((a.deleted||[]).indexOf(d.id)<0) p[d.id]=Object.assign({},d); });
  const custom=a.products||{};
  for(const id in custom){ if(p[id]) Object.assign(p[id],custom[id]); else p[id]=Object.assign({},custom[id]); }
  return Object.values(p);
}
function prod(id){ return catalog().find(p=>p.id===id)||null; }
function prodImg(p,a){ a=a||getAdmin(); const ph=a.photos||{}; return ph["p_"+p.id]||p.img; }
function prodImgFull(p){ const s=prodImg(p); if(/^data:/.test(s)||/^https?:/.test(s)||/^\/\//.test(s)) return s; return /^assets\//.test(s)?s:("assets/img/"+s); }
function prodName(p,lang){ const a=getAdmin(); return a.products&&a.products[p.id]&&a.products[p.id]["name_"+lang] || (lang==="ar"&&p.name_ar) || p.name_en || (p.nameKey||""); }
const CORE_PAGE={rug1:"product-rug.html",rug2:"product-rug.html",rug3:"product-rug.html",rug4:"product-rug.html",rug5:"product-rug.html",rug6:"product-rug.html",rob:"product-robe.html",oud:"product-perfume.html",mab:"product-mabkhara.html",shar:"product-bedding.html",carpet:"product-rug.html"};
function prodPage(p){ return (p.cat&&CORE_PAGE[p.id])||("product.html?id="+encodeURIComponent(p.id)); }
const SL={
 hero_home:["Home — Hero",PH+"photo-3.jpg"],
 cat_rugs:["Home — Category: Prayer Rugs",PH+"photo-3.jpg"],
 cat_bedding:["Home — Category: Bedding",PH+"photo-2.jpg"],
 cat_mabkhara:["Home — Category: Mabkhara",PH+"photo-7.jpg"],
 cat_perfume:["Home — Category: Perfume",PH+"photo-6.jpg"],
 cat_robe:["Home — Category: Robes",PH+"photo-5.jpg"],
 cat_gift:["Home — Category: Gifting Sets",PH+"photo-8.jpg"],
 card_rug1:["Shop — Card: Rug 1",PH+"photo-3.jpg"],
 card_rug2:["Shop — Card: Rug 2",PH+"photo-4.jpg"],
 card_rug3:["Shop — Card: Rug 3",PH+"photo-9.jpg"],
 card_rug4:["Shop — Card: Rug 4","rug-classic.svg"],
 card_rug5:["Shop — Card: Rug 5","rug-star.svg"],
 card_rug6:["Shop — Card: Rug 6","rug-arabesque.svg"],
 p_carpet:["Product — Al Noor (home)",PH+"photo-4.jpg"],
 p_rug1:["Product — Prayer Rug",PH+"photo-3.jpg"],
 p_rob:["Product — Robe",PH+"photo-5.jpg"],
 p_rob_2:["Product — Robe (view 2)",PH+"photo-7.jpg"],
 p_oud:["Product — Oud Perfume",PH+"photo-6.jpg"],
 p_oud_2:["Product — Oud (view 2)",PH+"photo-8.jpg"],
 p_mab:["Product — Mabkhara",PH+"photo-7.jpg"],
 p_mab_2:["Product — Mabkhara (view 2)",PH+"photo-8.jpg"],
 p_shar:["Product — Sharashef Bedding",PH+"photo-2.jpg"],
 p_shar_2:["Product — Bedding (view 2)",PH+"photo-9.jpg"],
 craft_hero:["Craftsmanship — Hero",PH+"photo-1.jpg"]
};
function slots(){ const o={}; for(const k in SL) o[k]={label:SL[k][0],def:SL[k][1]}; return o; }
function photoLib(a){ a=a||getAdmin(); const lib=[]; for(let i=1;i<=9;i++){ const f=PH+"photo-"+i+".jpg"; lib.push({src:f,label:"Photo "+i}); }
  const up=a.uploads||{}; for(const k in up) lib.push({src:up[k],label:k}); return lib; }
/* ---------- WhatsApp orders (shared by storefront + admin) ---------- */
const ORDERS_KEY="ar-orders-v1";
/* Default WhatsApp number = site phone +90 850 000 0000. Owner can change it in Admin → Orders. */
const WA_DEFAULT="908500000000";
function waNumber(){ const a=getAdmin(); return (a.waNumber&&String(a.waNumber).replace(/\D/g,""))||WA_DEFAULT; }
function genOrderId(){
  const d=new Date();
  const ymd=String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,"0")+String(d.getDate()).padStart(2,"0");
  return "AR-"+ymd+"-"+Math.random().toString(36).slice(2,6).toUpperCase();
}
function orders(){ try{ const o=JSON.parse(localStorage.getItem(ORDERS_KEY)); return Array.isArray(o)?o:[]; }catch(e){ return []; } }
function saveOrder(order){ const o=orders(); o.unshift(order); try{ localStorage.setItem(ORDERS_KEY, JSON.stringify(o)); }catch(e){} return order; }
function setOrderStatus(id,status){ const o=orders(); const it=o.find(x=>x.id===id); if(it){ it.status=status; try{ localStorage.setItem(ORDERS_KEY, JSON.stringify(o)); }catch(e){} } return it||null; }
function deleteOrder(id){ const o=orders().filter(x=>x.id!==id); try{ localStorage.setItem(ORDERS_KEY, JSON.stringify(o)); }catch(e){} }
window.AR={DEF:DEF,getAdmin,saveAdmin,catalog,prod,prodImg,prodImgFull,prodName,prodPage,slots,photoLib,ADMIN_PASS,ADMIN_EMAIL,ADMIN_GRANT_TOKEN,ADMIN_KEY,waNumber,genOrderId,orders,saveOrder,setOrderStatus,deleteOrder};
})();
