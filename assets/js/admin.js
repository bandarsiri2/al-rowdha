/* ============ AL-ROWDHA Admin Panel logic ============ */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;","\">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const AUTH_KEY="ar-admin-auth";

function authed(){ return sessionStorage.getItem(AUTH_KEY)==="1"; }
function show(what){
  $("#login-view").hidden = what!=="login";
  $("#dash-view").hidden = what!=="dash";
  if(what==="dash"){ renderProducts(); renderOrders(); renderPhotos(); renderContent(); }
}

/* ---------- Products ---------- */
function catLabel(c){ return {prayer:"Prayer Rugs",robes:"Robes",perfume:"Perfume",mabkhara:"Mabkhara",bedding:"Bedding"}[c]||c; }
function renderProducts(){
  const rows = AR.catalog().map(p=>{
    const custom = !AR.DEF.find(d=>d.id===p.id);
    return `<tr>
      <td><img class="thumb" src="${AR.prodImgFull(p)}" alt=""></td>
      <td>${esc(p.name_en||p.nameKey||p.id)}</td>
      <td class="keep-ltr">$${p.price}</td>
      <td>${esc(catLabel(p.cat))}</td>
      <td class="keep-ltr">${(p.stock||0)>0?p.stock+" in stock":"out"}</td>
      <td>${custom?"Custom":"Core"}</td>
      <td class="tact"><button class="btn btn-outline" data-act="edit" data-id="${esc(p.id)}" data-i18n="ad_edit">Edit</button><button class="btn btn-outline danger" data-act="del" data-id="${esc(p.id)}" data-i18n="ad_delete">Delete</button></td>
    </tr>`;
  }).join("");
  $("#admin-tbody").innerHTML = rows;
  if(!authed()||true) applyI18nAdmin();
}
function applyI18nAdmin(){
  if(!window.I18N) return;
  const l = document.documentElement.lang||"en";
  document.querySelectorAll("#dash-view [data-i18n]").forEach(el=>{
    const k=el.getAttribute("data-i18n");
    const v=window.I18N[l]&&window.I18N[l][k];
    if(v!==undefined) el.textContent=v;
  });
}

function fillForm(p){
  $("#pf-id").value = p?p.id:"";
  $("#pform-title").textContent = p?("Edit — "+(p.name_en||p.id)):"Add Product";
  $("#pf-name-en").value = p?(p.name_en||""):"";
  $("#pf-name-ar").value = p?(p.name_ar||""):"";
  $("#pf-price").value = p?p.price:150;
  $("#pf-cat").value = p?(p.cat||"prayer"):"prayer";
  $("#pf-color").value = p?(p.color||"emerald"):"emerald";
  $("#pf-mat").value = p?(p.mat||"wool"):"wool";
  $("#pf-size").value = p?(p.size||""):"70x120cm";
  $("#pf-badge").value = p?(p.badge||""):"";
  $("#pf-stock").value = p?(p.stock??20):20;
  $("#pf-rating").value = p?(p.rating||4.8):4.8;
  $("#pf-desc-en").value = p?(p.desc_en||""):"";
  $("#pf-desc-ar").value = p?(p.desc_ar||""):"";
  $("#pf-upload").value = "";
  const sel = $("#pf-img");
  const cur = p?AR.prodImg(p):"";
  sel.innerHTML = `<option value="">Choose a photo…</option>` + AR.photoLib().map(o=>`<option value="${o.src}" ${o.src===cur?"selected":""}>${esc(o.label)} (${o.src.slice(0,26)}…)</option>`).join("");
}

function saveProduct(){
  const id = $("#pf-id").value;
  const nameEn = $("#pf-name-en").value.trim();
  if(!nameEn){ $("#login-err").textContent=""; alert("Please enter a product name (English)."); return; }
  const base = id && AR.DEF.find(d=>d.id===id)
    ? Object.assign({},AR.DEF.find(d=>d.id===id))
    : (id && AR.getAdmin().products[id])
      ? Object.assign({},AR.getAdmin().products[id])
      : null;
  const o = base || {id: id || ("p"+Date.now().toString(36)), custom:true, name_en:"", name_ar:"", price:0, img:"assets/img/giftset.svg", cat:"prayer", color:"emerald", mat:"wool", size:"", badge:"", stock:0, rating:4.8, reviews:0, desc_en:"", desc_ar:""};
  o.name_en=nameEn; o.name_ar=$("#pf-name-ar").value.trim();
  o.price=parseFloat($("#pf-price").value)||0;
  o.cat=$("#pf-cat").value; o.color=$("#pf-color").value; o.mat=$("#pf-mat").value;
  o.size=$("#pf-size").value.trim(); o.badge=$("#pf-badge").value;
  o.stock=parseInt($("#pf-stock").value,10)||0;
  o.rating=parseFloat($("#pf-rating").value)||4.8;
  o.desc_en=$("#pf-desc-en").value.trim(); o.desc_ar=$("#pf-desc-ar").value.trim();
  const imgSel=$("#pf-img").value;
  if(imgSel) o.img=imgSel;
  const up=$("#pf-upload").files[0];
  if(up){
    downscale(up,800,0.82,dataUrl=>{
      const a=AR.getAdmin(); a.uploads= a.uploads||{};
      a.uploads["upload-"+Date.now().toString(36)]=dataUrl; AR.saveAdmin(a);
      o.img=dataUrl;
      persist(o); renderProducts(); $("#pform").hidden=true;
    });
    return;
  }
  persist(o); renderProducts(); $("#pform").hidden=true;
}
function persist(o){
  const a=AR.getAdmin();
  const isDefault = AR.DEF.find(d=>d.id===o.id);
  if(isDefault){
    a.products=a.products||{};
    a.products[o.id]=o;
    a.deleted=(a.deleted||[]).filter(x=>x!==o.id);
  } else {
    a.products=a.products||{};
    a.products[o.id]=o;
  }
  AR.saveAdmin(a);
}
function delProduct(id){
  if(!confirm(`Delete “${(AR.prod(id)||{}).name_en||id}”?`)) return;
  const a=AR.getAdmin();
  if(AR.DEF.find(d=>d.id===id)){
    a.deleted=a.deleted||[]; if(a.deleted.indexOf(id)<0) a.deleted.push(id);
    a.products=a.products||{}; delete a.products[id];
  } else {
    a.products=a.products||{}; delete a.products[id];
  }
  AR.saveAdmin(a);
  renderProducts();
}

/* ---------- Orders (WhatsApp orders) ---------- */
function i18nL(k){ const l=document.documentElement.lang||"en"; return (window.I18N[l]&&window.I18N[l][k])||(window.I18N.en[k])||k; }
function renderOrders(){
  const list = AR.orders();
  $("#ad-no-orders").hidden = list.length > 0;
  $("#orders-tbody").innerHTML = list.map(o=>{
    const st = o.status||"new";
    return `<tr>
      <td class="keep-ltr"><b>${esc(o.id)}</b> <button class="btn btn-outline o-copy" data-id="${esc(o.id)}" title="Copy order number">⧉</button></td>
      <td class="keep-ltr">${new Date(o.ts).toLocaleString()}</td>
      <td>${o.items.map(i=>esc((i.qty||1)+"× "+(i.nameEn||i.name))).join(", ")}</td>
      <td class="keep-ltr">$${o.total}</td>
      <td><select data-ostatus="${esc(o.id)}" style="padding:.35rem .4rem;border:1px solid var(--line,#ddd4c2);border-radius:6px;font-size:.85rem">
        ${["new","confirmed","shipped","done"].map(s=>`<option value="${s}" ${st===s?"selected":""}>${i18nL("st_"+s)}</option>`).join("")}
      </select></td>
      <td class="tact"><button class="btn btn-outline danger o-del" data-id="${esc(o.id)}" title="Delete order">✕</button></td>
    </tr>`;
  }).join("");
}

function downscale(file, maxW, q, cb){
  const fr=new FileReader();
  fr.onload=e=>{
    const im=new Image();
    im.onload=()=>{
      const sc=Math.min(1, maxW/im.width);
      const c=document.createElement("canvas");
      c.width=Math.round(im.width*sc); c.height=Math.round(im.height*sc);
      c.getContext("2d").drawImage(im,0,0,c.width,c.height);
      cb(c.toDataURL("image/jpeg",q));
    };
    im.src=e.target.result;
  };
  fr.readAsDataURL(file);
}

/* ---------- Photos ---------- */
function renderPhotos(){
  const a=AR.getAdmin();
  const up=a.uploads||{};
  $("#photo-lib").innerHTML = AR.photoLib().map(o=>`
    <div class="ph">
      <img src="${o.src}" alt="${esc(o.label)}">
      <em>${esc(o.label)}</em>
      ${o.src.startsWith("data:")?`<button data-up-del="${esc(o.label)}" title="Remove">✕</button>`:""}
    </div>`).join("");
  /* slots */
  const groups={};
  Object.keys(AR.slots()).forEach(k=>{
    const g=k.indexOf("card_")===0?"Shop Cards":(k.indexOf("p_")===0?"Product Pages":(k.indexOf("cat_")===0?"Home Categories":k.charAt(0).toUpperCase()+k.slice(1)+" Pages"));
    groups[g]=groups[g]||[]; groups[g].push(k);
  });
  let html="";
  for(const g in groups){
    html+=`<h4 data-group="${esc(g)}" style="margin:1.2rem 0 .3rem;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold-600,#b08a3e)">${g}</h4>`;
    html+=groups[g].map(k=>{
      const s=AR.slots()[k];
      const cur=(a.photos||{})[k]||s.def;
      const opts=[`<option value="">Default (${s.def.split("/").pop()})</option>`].concat(
        AR.photoLib().map(o=>`<option value="${o.src}" ${o.src===cur?"selected":""}>${esc(o.label)}</option>`)).join("");
      return `<div class="slot-row"><div class="sl"><b>${g}</b>${esc(s.label)}</div><img src="${cur}" alt=""><select data-slot="${esc(k)}" style="padding:.45rem;border:1px solid var(--line,#ddd4c2);border-radius:8px">${opts}</select></div>`;
    }).join("");
  }
  $("#slot-list").innerHTML=html;
}

/* ---------- Site Content ---------- */
const CONTENT_KEYS=[
 ["announce","Announcement bar"],
 ["home_hero_title","Home — hero title"],
 ["home_hero_sub","Home — hero subtitle"],
 ["home_hero_lead","Home — hero lead"],
 ["home_cat_title","Home — categories title"],
 ["home_feat_title","Home — featured title"],
 ["home_craft_title","Home — craft title"],
 ["shop_title","Shop — page title"],
 ["craft_title","Craftsmanship — title"],
 ["foot_tag","Footer — brand tagline"]
];
function defaultContent(){
  const o={en:{},ar:{}};
  const src=window.I18N_DEFAULTS||window.I18N;
  CONTENT_KEYS.forEach(([k])=>{
    if(src){ o.en[k]=src.en[k]||""; o.ar[k]=src.ar[k]||""; }
  });
  return o;
}
function renderContent(){
  if(!window.I18N){ $("#content-rows").innerHTML="<p>Add keys to i18n.js first.</p>"; return; }
  const a=AR.getAdmin();
  const def=defaultContent();
  $("#content-rows").innerHTML=CONTENT_KEYS.map(([k,label])=>`
    <div class="frow" style="margin-bottom:1rem">
      <div class="fld"><span>${esc(label)} — English</span><input data-ck="${k}" data-cl="en" value="${esc((a.content&&a.content.en&&a.content.en[k])||def.en[k])}"></div>
      <div class="fld"><span>${esc(label)} — Arabic</span><input dir="rtl" data-ck="${k}" data-cl="ar" value="${esc((a.content&&a.content.ar&&a.content.ar[k])||def.ar[k])}"></div>
    </div>`).join("");
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", ()=>{
  /* Magic admin link: ?grant=<token> signs in, then the token is removed from the URL */
  const grant=new URLSearchParams(location.search).get("grant");
  if(grant && grant===AR.ADMIN_GRANT_TOKEN){
    sessionStorage.setItem(AUTH_KEY,"1");
    history.replaceState(null,"",location.pathname);
  }
  if(!authed()){ show("login"); }
  else { show("dash"); }
  $("#login-btn").addEventListener("click",()=>{
    const em=($("#login-email").value||"").trim().toLowerCase();
    if(em===AR.ADMIN_EMAIL.toLowerCase() && $("#login-pass").value===AR.ADMIN_PASS){ sessionStorage.setItem(AUTH_KEY,"1"); $("#login-err").textContent=""; show("dash"); }
    else $("#login-err").textContent="Wrong email or password.";
  });
  $("#login-pass").addEventListener("keydown",e=>{ if(e.key==="Enter") $("#login-btn").click(); });
  $("#btn-logout").addEventListener("click",()=>{ sessionStorage.removeItem(AUTH_KEY); show("login"); });
  $("#btn-reset").addEventListener("click",()=>{
    if(confirm("Reset ALL admin changes (products, photos, content)? This cannot be undone.")){
      localStorage.removeItem(AR.ADMIN_KEY); location.reload();
    }
  });
  /* tabs */
  document.querySelectorAll(".admin-tabs button").forEach(b=>{
    b.addEventListener("click",()=>{
      document.querySelectorAll(".admin-tabs button").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      document.querySelectorAll(".admin-tab").forEach(t=>t.classList.remove("active"));
      $("#tab-"+b.dataset.tab).classList.add("active");
    });
  });
  /* products */
  $("#btn-add").addEventListener("click",()=>{ fillForm(null); $("#pform").hidden=false; });
  $("#pf-cancel").addEventListener("click",()=>{ $("#pform").hidden=true; });
  $("#pf-save").addEventListener("click",saveProduct);
  $("#admin-tbody").addEventListener("click",e=>{
    const b=e.target.closest("button[data-act]");
    if(!b) return;
    const id=b.dataset.id;
    if(b.dataset.act==="edit"){ fillForm(AR.prod(id)); $("#pform").hidden=false; $("#pform").scrollIntoView({behavior:"smooth"}); }
    else if(b.dataset.act==="del") delProduct(id);
  });
  /* photos */
  $("#ph-add").addEventListener("click",()=>$("#ph-upload").click());
  $("#ph-upload").addEventListener("change",e=>{
    const f=e.target.files[0]; if(!f) return;
    downscale(f,1100,0.82,dataUrl=>{
      const a=AR.getAdmin(); a.uploads=a.uploads||{};
      a.uploads["upload-"+Date.now().toString(36)]=dataUrl;
      AR.saveAdmin(a); renderPhotos();
    });
  });
  $("#photo-lib").addEventListener("click",e=>{
    const b=e.target.closest("[data-up-del]");
    if(!b) return;
    const a=AR.getAdmin(); const up=a.uploads||{};
    const key=b.dataset.upDel;
    if(up[key]){
      const removedSrc=up[key];
      delete up[key];
      for(const sk in (a.photos||{})){ if(a.photos[sk]===removedSrc) delete a.photos[sk]; }
    }
    AR.saveAdmin(a); renderPhotos();
  });
  $("#slot-list").addEventListener("change",e=>{
    const sel=e.target.closest("[data-slot]");
    if(!sel) return;
    const a=AR.getAdmin(); a.photos=a.photos||{};
    const v=sel.value;
    if(v) a.photos[sel.dataset.slot]=v; else delete a.photos[sel.dataset.slot];
    AR.saveAdmin(a);
  });
  $("#slots-reset").addEventListener("click",()=>{
    const a=AR.getAdmin(); delete a.photos; AR.saveAdmin(a); renderPhotos();
    document.querySelectorAll("#slot-list select[data-slot]").forEach(sel=>sel.value="");
  });
  /* content */
  $("#content-save").addEventListener("click",()=>{
    const a=AR.getAdmin();
    a.content=a.content||{}; a.content.en=a.content.en||{}; a.content.ar=a.content.ar||{};
    document.querySelectorAll("[data-ck]").forEach(el=>{
      const v=el.value.trim();
      const def=defaultContent();
      if(v && v!==def[el.dataset.cl][el.dataset.ck]) a.content[el.dataset.cl][el.dataset.ck]=v;
      else delete a.content[el.dataset.cl][el.dataset.ck];
    });
    AR.saveAdmin(a);
    const f=$("#content-saved"); f.hidden=false;
    setTimeout(()=>f.hidden=true,1800);
  });
  /* orders */
  $("#wa-num").value = AR.waNumber();
  $("#wa-save").addEventListener("click",()=>{
    const v = $("#wa-num").value.replace(/\D/g,"");
    if(!v){ alert("Enter a WhatsApp number (digits only, international format)."); return; }
    const a=AR.getAdmin(); a.waNumber=v; AR.saveAdmin(a);
    const f=$("#wa-saved"); f.hidden=false;
    setTimeout(()=>f.hidden=true,1800);
  });
  $("#orders-tbody").addEventListener("click",e=>{
    const c=e.target.closest(".o-copy");
    if(c){
      const id=c.dataset.id;
      if(navigator.clipboard) navigator.clipboard.writeText(id).catch(()=>{});
      c.textContent="✓"; setTimeout(()=>c.textContent="⧉",1200);
      return;
    }
    const d=e.target.closest(".o-del");
    if(d && confirm("Delete order "+d.dataset.id+"?")){ AR.deleteOrder(d.dataset.id); renderOrders(); }
  });
  $("#orders-tbody").addEventListener("change",e=>{
    const s=e.target.closest("[data-ostatus]");
    if(s){ AR.setOrderStatus(s.dataset.ostatus, s.value); }
  });
});
})();
