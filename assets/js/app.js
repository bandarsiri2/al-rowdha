/* ============ AL-ROWDHA app (v2: photos + admin-aware) ============ */
(function(){
"use strict";
const IMG = "assets/img/";
const CAT = window.AR ? window.AR.DEF : {};

/* ---------- i18n (merges admin Site-Content overrides) ---------- */
let lang = localStorage.getItem("arlang") || "en";
function mergeAdminContent(){
  if(!window.I18N || !window.AR) return;
  const a = window.AR.getAdmin();
  const c = a.content||{};
  if(c.en && window.I18N.en) Object.assign(window.I18N.en, c.en);
  if(c.ar && window.I18N.ar) Object.assign(window.I18N.ar, c.ar);
}
mergeAdminContent();
function t(key, vars){
  let s = (window.I18N[lang] && window.I18N[lang][key]) ?? (window.I18N.en && window.I18N.en[key]) ?? key;
  if(vars) for(const k in vars) s = s.replace("{"+k+"}", vars[k]);
  return s;
}
function fmtPrice(n){ return lang==="ar" ? n + " $" : "$" + n; }
function applyI18n(){
  const root = document.documentElement;
  root.lang = lang; root.dir = lang==="ar" ? "rtl" : "ltr";
  document.body.classList.toggle("lang-ar", lang==="ar");
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const k = el.getAttribute("data-i18n");
    if(window.I18N[lang][k] !== undefined) el.textContent = window.I18N[lang][k];
  });
  document.querySelectorAll("[data-i18n-title]").forEach(el=>{
    const k = el.getAttribute("data-i18n-title");
    if(window.I18N[lang][k] !== undefined) el.setAttribute("title", window.I18N[lang][k]);
  });
  document.querySelectorAll(".lang-toggle button").forEach(b=>{
    b.classList.toggle("active", b.getAttribute("data-lang")===lang);
  });
  renderDynamic();
}
function setLang(l){
  lang = l; localStorage.setItem("arlang", l);
  applyI18n();
}

/* ---------- Admin-aware product helpers ---------- */
function merged(id){ return window.AR ? window.AR.prod(id) : (CAT[id]||null); }
function prodName(p){
  if(window.AR) return window.AR.prodName(p, lang);
  return t(p.nameKey);
}
function prodImgFull(p){
  if(window.AR) return window.AR.prodImgFull(p);
  return IMG + p.img;
}
function prodPageUrl(p){
  if(window.AR) return window.AR.prodPage(p);
  return p.id ? ("product.html?id="+p.id) : "#";
}
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---------- Photo slots (admin Photos tab) ---------- */
function applySlots(){
  if(!window.AR) return;
  const ph = window.AR.getAdmin().photos || {};
  document.querySelectorAll("[data-photo-slot]").forEach(el=>{
    const s = ph[el.getAttribute("data-photo-slot")];
    if(s) el.src = s;
  });
}

/* ---------- Cart ---------- */
let cart = [];
try{ cart = JSON.parse(localStorage.getItem("ar-cart")||"[]"); }catch(e){}
function saveCart(){ localStorage.setItem("ar-cart", JSON.stringify(cart)); }
function cartCount(){ return cart.reduce((s,i)=>s+i.qty,0); }
function cartTotal(){ return cart.reduce((s,i)=>{ const p=merged(i.id); return s + i.qty*(p?p.price:0); },0); }
function renderCart(){
  document.querySelectorAll(".cart-count").forEach(el=>{
    el.textContent = cartCount();
    el.style.display = cartCount()? "grid":"none";
  });
  const box = document.getElementById("cart-items");
  if(!box) return;
  if(!cart.length){
    box.innerHTML = `<div class="cart-empty">
      <svg class="ic" viewBox="0 0 24 24"><path d="M6 7h12l1.5 13.5H4.5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
      <h4 style="font-size:1.1rem;margin-bottom:.4rem">${t("cart_empty_title")}</h4>
      <p style="font-size:.9rem">${t("cart_empty_txt")}</p>
      <button class="btn btn-emerald" style="margin-top:1.2rem" onclick="closeCart()">${t("btn_continue")}</button>
    </div>`;
    const total = document.getElementById("cart-total-row");
    if(total) total.style.display="none";
    const co = document.getElementById("checkout-btn");
    if(co) co.style.display="none";
    return;
  }
  const total = document.getElementById("cart-total-row");
  if(total) total.style.display="";
  const co = document.getElementById("checkout-btn");
  if(co) co.style.display="";
  box.innerHTML = cart.map(i=>{
    const p = merged(i.id);
    if(!p) return "";
    return `<div class="cart-item">
      <img src="${prodImgFull(p)}" alt="">
      <div>
        <div class="ci-name">${prodName(p)}</div>
        <div class="ci-price keep-ltr">${fmtPrice(p.price)}</div>
        <span class="ci-qty">
          <button data-cart-qty="-1" data-id="${i.id}">−</button>
          <span class="keep-ltr">${i.qty}</span>
          <button data-cart-qty="1" data-id="${i.id}">+</button>
        </span>
      </div>
      <button class="ci-remove" data-cart-rm="${i.id}" title="✕">✕</button>
    </div>`;
  }).join("");
  const tot = document.getElementById("cart-total-val");
  if(tot) tot.textContent = fmtPrice(cartTotal());
}
function addToCart(id, qty){
  if(!merged(id)) return;
  qty = qty||1;
  const ex = cart.find(i=>i.id===id);
  if(ex) ex.qty += qty; else cart.push({id, qty});
  saveCart(); renderCart();
  openCart();
  toast(t("toast_added"));
}

/* ---------- Drawer ---------- */
function openCart(){ if(!document.getElementById("cart-drawer")) return; document.getElementById("cart-drawer").classList.add("open"); document.getElementById("drawer-overlay").classList.add("open"); document.body.style.overflow="hidden"; }
function closeCart(){ if(!document.getElementById("cart-drawer")) return; document.getElementById("cart-drawer").classList.remove("open"); document.getElementById("drawer-overlay").classList.remove("open"); document.body.style.overflow=""; }
window.closeCart = closeCart;

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg){
  let el = document.getElementById("toast");
  if(!el){
    el = document.createElement("div");
    el.id = "toast"; el.className = "toast";
    el.innerHTML = `<svg class="ic" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg><span></span>`;
    document.body.appendChild(el);
  }
  el.querySelector("span").textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove("show"), 2600);
}

/* ---------- WhatsApp orders (buy via WhatsApp + order number) ---------- */
const WA_ICON = `<svg class="ic" viewBox="0 0 24 24"><path d="M21 12a8.5 8.5 0 0 1-8.5 8.5c-1.6 0-3-.4-4.3-1L3 21l1.5-5.2A8.5 8.5 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4"/></svg>`;
function waUrl(text){ return "https://wa.me/" + (window.AR ? window.AR.waNumber() : "") + "?text=" + encodeURIComponent(text); }
function orderLines(items){
  return items.map(i=>{
    const p = merged(i.id); if(!p) return null;
    return {
      name: prodName(p),
      nameEn: window.AR ? window.AR.prodName(p,"en") : prodName(p),
      nameAr: window.AR ? (window.AR.prodName(p,"ar")||"") : "",
      qty: i.qty, price: p.price
    };
  }).filter(Boolean);
}
function waOrderText(order){
  const en = order.items.map(i=>`• ${i.nameEn||i.name} × ${i.qty} — $${i.price*i.qty}`).join("\n");
  const ar = order.items.map(i=>`• ${i.nameAr||i.name} × ${i.qty} — $${i.price*i.qty}`).join("\n");
  const c = order.customer||{};
  return [
    "NEW ORDER — AL-ROWDHA",
    `Order #${order.id}`, "", en, "",
    `Total: $${order.total}`, "",
    `Name: ${c.name||""}`, `Phone: ${c.phone||""}`, `Address: ${c.address||""}`,
    ...(c.notes ? [`Notes: ${c.notes}`] : []),
    "", "—", "",
    "طلب جديد — الرودا",
    `رقم الطلب: ${order.id}`, "", ar, "",
    `المجموع: $${order.total}`, "",
    `الاسم: ${c.name||""}`, `الهاتف: ${c.phone||""}`, `العنوان: ${c.address||""}`,
    ...(c.notes ? [`ملاحظات: ${c.notes}`] : [])
  ].join("\n");
}
function placeWaOrder(items, customer){
  if(!window.AR || !items.length) return null;
  const lines = orderLines(items); if(!lines.length) return null;
  const total = lines.reduce((s,i)=>s+i.price*i.qty,0);
  const order = { id: window.AR.genOrderId(), ts: Date.now(), items: lines, total, customer: customer||null };
  window.AR.saveOrder(order);
  const url = waUrl(waOrderText(order));
  try{ window.open(url, "_blank", "noopener"); }catch(e){ location.href = url; }
  showOrderModal(order.id);
  return order;
}
function showOrderModal(orderId){
  let ov = document.getElementById("wa-modal");
  if(!ov){
    ov = document.createElement("div");
    ov.id = "wa-modal"; ov.className = "wa-modal-overlay";
    ov.innerHTML = `
      <div class="wa-modal" role="dialog" aria-modal="true">
        <button class="icon-btn wa-close" aria-label="Close">✕</button>
        <svg class="wa-check ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></svg>
        <h3 data-i18n="wa_modal_title">${t("wa_modal_title")}</h3>
        <p class="wa-no-label" data-i18n="wa_order_no">${t("wa_order_no")}</p>
        <div class="wa-no-row"><span class="wa-no keep-ltr" id="wa-modal-id"></span><button class="btn btn-outline wa-copy">${t("btn_copy")}</button></div>
        <p class="wa-modal-txt" data-i18n="wa_modal_txt">${t("wa_modal_txt")}</p>
        <button class="btn btn-emerald btn-block wa-done" data-i18n="wa_close">${t("wa_close")}</button>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener("click", e=>{ if(e.target===ov || e.target.closest(".wa-close")) closeOrderModal(); });
    ov.querySelector(".wa-done").addEventListener("click", closeOrderModal);
    ov.querySelector(".wa-copy").addEventListener("click", ()=>{
      const id = ov.querySelector("#wa-modal-id").textContent;
      if(navigator.clipboard) navigator.clipboard.writeText(id).catch(()=>{});
      const b = ov.querySelector(".wa-copy");
      b.textContent = t("copied_ok");
      setTimeout(()=>{ b.textContent = t("btn_copy"); }, 1600);
    });
  }
  ov.querySelector("#wa-modal-id").textContent = orderId;
  ov.classList.add("open");
}
function closeOrderModal(){ const ov = document.getElementById("wa-modal"); if(ov) ov.classList.remove("open"); }

/* ---------- Checkout: collect customer details (validated) before WhatsApp ---------- */
function validPhone(v){ const s = String(v).replace(/[\s\-().]/g, ""); return /^\+?\d{8,15}$/.test(s); }
function coSummaryHtml(){
  const rows = cart.map(i=>{
    const p = merged(i.id); if(!p) return "";
    return `<div class="co-line"><span>${esc(prodName(p))} × ${i.qty}</span><span class="keep-ltr">${fmtPrice(p.price*i.qty)}</span></div>`;
  }).join("");
  return rows + `<div class="co-line co-total"><span>${t("cart_total")}</span><span class="keep-ltr">${fmtPrice(cartTotal())}</span></div>`;
}
function openCheckout(){
  if(!cart.length) return;
  let ov = document.getElementById("checkout-modal");
  if(!ov){
    ov = document.createElement("div");
    ov.id = "checkout-modal"; ov.className = "co-overlay";
    ov.innerHTML = `
      <div class="co-modal" role="dialog" aria-modal="true">
        <button class="icon-btn co-close" aria-label="Close">✕</button>
        <h3 data-i18n="co_title">${t("co_title")}</h3>
        <div class="co-summary" id="co-summary"></div>
        <p class="co-sec">${t("co_contact")}</p>
        <form id="co-form" novalidate>
          <div class="field">
            <label for="co-name">${t("co_name")}</label>
            <input id="co-name" type="text" autocomplete="name">
            <span class="co-err"></span>
          </div>
          <div class="field">
            <label for="co-phone">${t("co_phone")}</label>
            <input id="co-phone" type="tel" inputmode="tel" class="keep-ltr" autocomplete="tel">
            <span class="co-err"></span>
          </div>
          <div class="field">
            <label for="co-address">${t("co_address")}</label>
            <textarea id="co-address" rows="2"></textarea>
            <span class="co-err"></span>
          </div>
          <div class="field">
            <label for="co-notes">${t("co_notes")}</label>
            <input id="co-notes" type="text">
          </div>
          <button type="submit" class="btn btn-wa btn-block co-submit">${WA_ICON} ${t("co_submit")}</button>
        </form>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener("click", e=>{ if(e.target===ov || e.target.closest(".co-close")) closeCheckout(); });
    ov.querySelector("#co-form").addEventListener("submit", e=>{ e.preventDefault(); submitCheckout(); });
    ["co-name","co-phone","co-address"].forEach(id=>{
      ov.querySelector("#"+id).addEventListener("input", e=>{
        const f = e.target.closest(".field");
        if(f.classList.contains("invalid")){ f.classList.remove("invalid"); e.target.nextElementSibling.textContent = ""; }
      });
    });
  }
  ov.querySelector("#co-summary").innerHTML = coSummaryHtml();
  ov.classList.add("open");
  setTimeout(()=>{ const n = ov.querySelector("#co-name"); if(n) n.focus(); }, 320);
}
function closeCheckout(){ const ov = document.getElementById("checkout-modal"); if(ov) ov.classList.remove("open"); }
function submitCheckout(){
  const ov = document.getElementById("checkout-modal"); if(!ov) return;
  const name = ov.querySelector("#co-name").value.trim();
  const phone = ov.querySelector("#co-phone").value.trim();
  const address = ov.querySelector("#co-address").value.trim();
  const notes = ov.querySelector("#co-notes").value.trim();
  let firstBad = null;
  const setErr = (id, msg)=>{
    const el = ov.querySelector("#"+id);
    const f = el.closest(".field");
    if(msg){ f.classList.add("invalid"); el.nextElementSibling.textContent = msg; if(!firstBad) firstBad = el; }
    else { f.classList.remove("invalid"); el.nextElementSibling.textContent = ""; }
  };
  setErr("co-name", name.length >= 2 ? "" : t("co_err_name"));
  setErr("co-phone", validPhone(phone) ? "" : t("co_err_phone"));
  setErr("co-address", address.length >= 10 ? "" : t("co_err_address"));
  if(firstBad){ firstBad.focus(); return; }
  closeCheckout();
  placeWaOrder(cart.map(i=>({id:i.id, qty:i.qty})), { name, phone, address, notes });
}
/* Inject WhatsApp buy buttons (idempotent): product cards, product pages, cart drawer */
function ensureWaButtons(){
  document.querySelectorAll(".pc-actions").forEach(box=>{
    if(box.querySelector("[data-buy-wa]")) return;
    const card = box.closest(".prod-card"); if(!card) return;
    const addBtn = box.querySelector("[data-add]");
    const id = card.getAttribute("data-id") || (addBtn ? addBtn.getAttribute("data-add") : null);
    if(!id) return;
    box.insertAdjacentHTML("beforeend", `<button class="btn btn-wa wa-icon-btn" data-buy-wa="${id}" title="WhatsApp">${WA_ICON}</button>`);
  });
  document.querySelectorAll(".pd-actions").forEach(box=>{
    if(box.querySelector("[data-buy-wa]")) return;
    const addBtn = box.querySelector("[data-add]") || box.querySelector("[data-buy]");
    if(!addBtn) return;
    const id = addBtn.getAttribute("data-add") || addBtn.getAttribute("data-buy");
    box.insertAdjacentHTML("beforeend", `<button class="btn btn-wa" data-buy-wa="${id}">${WA_ICON} <span data-i18n="btn_order_wa">${t("btn_order_wa")}</span></button>`);
  });
}

/* ---------- Product detail: gallery & qty ---------- */
function initGallery(){
  const main = document.querySelector(".pd-gallery .main-img img");
  if(!main) return;
  document.querySelectorAll(".pd-thumbs button").forEach(b=>{
    b.addEventListener("click", ()=>{
      main.src = b.querySelector("img").getAttribute("src");
      document.querySelectorAll(".pd-thumbs button").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
    });
  });
}
function initQty(){
  document.querySelectorAll(".qty button").forEach(b=>{
    b.addEventListener("click", ()=>{
      const q = b.parentElement.querySelector("span");
      let n = parseInt(q.textContent,10) + parseInt(b.getAttribute("data-step"),10);
      if(n<1) n=1; if(n>99) n=99;
      q.textContent = n;
    });
  });
}
function initAddButtons(){
  document.querySelectorAll("[data-add]").forEach(b=>{
    if(b.dataset.addBound) return;
    b.dataset.addBound = "1";
    b.addEventListener("click", ()=>{
      const qtyEl = document.querySelector(".buy-row .qty span");
      const q = qtyEl ? parseInt(qtyEl.textContent,10) : 1;
      addToCart(b.getAttribute("data-add"), q);
    });
  });
  document.querySelectorAll("[data-buy]").forEach(b=>{
    if(b.dataset.buyBound) return;
    b.dataset.buyBound = "1";
    b.addEventListener("click", ()=>{
      const qtyEl = document.querySelector(".buy-row .qty span");
      const q = qtyEl ? parseInt(qtyEl.textContent,10) : 1;
      addToCart(b.getAttribute("data-buy"), q);
    });
  });
}

/* ---------- Product detail page (admin-aware) ---------- */
function initProductPage(){
  const id = document.body.getAttribute("data-product-id");
  if(!id || !window.AR) return;
  const p = merged(id); if(!p) return;
  const a = window.AR.getAdmin();
  const setTxt=(sel,s)=>{ const el=document.querySelector(sel); if(el&&s!=null) el.textContent=s; };
  const h1=document.querySelector(".pd-info h1"); if(h1) h1.textContent=prodName(p);
  const pr=document.querySelector(".pd-price");
  if(pr){ const tx=pr.querySelector(".tax"); pr.textContent=fmtPrice(p.price); if(tx) pr.appendChild(tx); }
  const ad=a.products&&a.products[id];
  if(ad){
    if(ad["desc_"+lang]) setTxt(".pd-desc", ad["desc_"+lang]);
    if(ad["color_"+lang]) setTxt(".pd-specs [data-spec=color]", ad["color_"+lang]);
  }
  const main=document.querySelector(".pd-gallery .main-img img");
  if(main) main.src = window.AR.prodImgFull(p);
  const ths=Array.from(document.querySelectorAll(".pd-thumbs button"));
  ths.forEach((b,i)=>{
    const s=a.photos&&a.photos["p_"+id+(i===0?"":"_"+(i+1))];
    if(s) b.querySelector("img").src=s;
  });
  const stk=document.querySelector('.pd-specs [data-i18n="pd_stock"]');
  if(stk){ const ins=(p.stock||0)>0; stk.style.color=ins?"var(--emerald-700)":"#b3261e"; stk.textContent=ins?(lang==="ar"?"متوفر، جاهز للشحن":"In stock, ready to ship"):(lang==="ar"?"نفد المخزون":"Out of stock"); }
}

/* ---------- Shop page: filters / sort (admin-aware) ---------- */
const CARD_TMPL =
 `<article class="prod-card" data-id="{ID}" data-cat="{CAT}" data-color="{COLOR}" data-mat="{MAT}" data-size="{SIZE}">
  <a class="pc-img" href="{HREF}"><img src="{IMG}" alt="" data-photo-slot="p_{ID}">{BADGE}</a>
  <div class="pc-body">
    <h3 data-prod-name="{ID}">{NAME}</h3>
    <p class="pc-meta">{META}</p>
    <div class="pc-rating"><span class="stars">{STARS}</span> <span class="keep-ltr">{RATING}</span> <span class="count">({REVS})</span></div>
    <div class="pc-price keep-ltr" data-prod-price="{ID}">{PRICE}</div>
    <div class="pc-stock keep-ltr">{STOCK}</div>
    <div class="pc-actions"><button class="btn btn-emerald" data-add="{ID}"><svg class="ic" viewBox="0 0 24 24"><path d="M6 7h12l1.5 13.5h-15L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg> <span data-i18n="btn_add_cart">Add to Cart</span></button></div>
  </div>
</article>`;
function badgeHtml(b){ if(!b) return ""; const key=`b_badge_${b==="new"?"new":"bestseller"}`; return `<span class="pc-badge${b==="new"?" new":""}" data-i18n="${key}">${t(key)}</span>`; }
function starsHtml(r){
  const f=Math.round(r); let s="";
  for(let i=1;i<=5;i++) s += i<=f?"★":"<i class='dim'>★</i>";
  return s;
}
function metaStr(p){
  const c={emerald:"Emerald",gold:"Gold",beige:"Beige"}, m={wool:"Wool",silk:"Silk",cotton:"Cotton"};
  return [p.size, m[p.mat], c[p.color]].filter(Boolean).join(" • ");
}
function cardMatchesPage(p){
  const page = document.body.getAttribute("data-shop");
  if(!page) return false;
  if(page==="prayer") return p.cat==="prayer";
  if(page==="shop") return true;
  return p.cat===page;
}
function syncShop(){
  if(!document.body.hasAttribute("data-shop") || !window.AR) return;
  const grid = document.querySelector(".shop-grid"); if(!grid) return;
  const a = window.AR.getAdmin();
  const set = window.AR.catalog().filter(cardMatchesPage);
  const ids = set.map(p=>p.id);
  grid.querySelectorAll(".prod-card").forEach(c=>{
    if(ids.indexOf(c.dataset.id)<0) c.remove();
  });
  set.forEach((p,i)=>{
    let el = grid.querySelector(`.prod-card[data-id="${p.id}"]`);
    if(!el){
      el = document.createElement("div");
      el.innerHTML = CARD_TMPL
        .replace(/\{ID\}/g,p.id).replace(/\{HREF\}/g,prodPageUrl(p)).replace(/\{IMG\}/g,window.AR.prodImgFull(p))
        .replace(/\{CAT\}/g,p.cat||"").replace(/\{COLOR\}/g,p.color||"").replace(/\{MAT\}/g,p.mat||"").replace(/\{SIZE\}/g,p.size||"")
        .replace("{BADGE}",badgeHtml(p.badge)).replace("{NAME}",prodName(p)).replace(/\{META\}/g,metaStr(p))
        .replace("{STARS}",starsHtml(p.rating||4.8)).replace("{RATING}",String(p.rating||4.8)).replace("{REVS}",String(p.reviews||0))
        .replace("{PRICE}",fmtPrice(p.price))
        .replace("{STOCK}",(p.stock||0)>0?(p.stock+" in stock"):"Out of stock");
      el = el.firstElementChild;
      grid.appendChild(el);
    } else {
      /* update static core cards with admin values */
      el.dataset.cat=p.cat; el.dataset.color=p.color||""; el.dataset.mat=p.mat||""; el.dataset.size=p.size||"";
      const im=el.querySelector(".pc-img img"); if(im) im.src=window.AR.prodImgFull(p);
      const h3=el.querySelector("h3"); if(h3){ h3.setAttribute("data-prod-name",p.id); h3.textContent=prodName(p); }
      const pr=el.querySelector(".pc-price"); if(pr) pr.textContent=fmtPrice(p.price);
      const st=el.querySelector(".pc-stock"); if(st) st.textContent=(p.stock||0)>0?(p.stock+" in stock"):"Out of stock";
      const me=el.querySelector(".pc-meta"); if(me) me.textContent=metaStr(p);
    }
  });
}
function initShop(){
  if(!document.body.hasAttribute("data-shop")) return;
  const cards = ()=>Array.from(document.querySelectorAll(".shop-grid .prod-card"));
  const resEl = document.getElementById("results-count");
  const sortSel = document.getElementById("sort-select");
  function currentFilters(){
    const f = {cat:[], color:[], mat:[], size:[]};
    document.querySelectorAll(".filters input:checked").forEach(cb=>{
      const g = cb.name; if(f[g]) f[g].push(cb.value);
    });
    return f;
  }
  function apply(){
    syncShop();
    const f = currentFilters();
    let list = cards().map(c=>{ const p=merged(c.dataset.id); return p?{el:c,data:p}:null; })
      .filter(Boolean)
      .filter(({data})=>
        (!f.cat.length || f.cat.includes(data.cat)) &&
        (!f.color.length || f.color.includes(data.color)) &&
        (!f.mat.length || f.mat.includes(data.mat)) &&
        (!f.size.length || f.size.includes(data.size))
      );
    const s = sortSel ? sortSel.value : "featured";
    if(s==="price_asc") list.sort((a,b)=>a.data.price-b.data.price);
    else if(s==="price_desc") list.sort((a,b)=>b.data.price-a.data.price);
    else if(s==="rating") list.sort((a,b)=>b.data.rating-a.data.rating);
    const grid = document.querySelector(".shop-grid");
    if(grid) list.forEach(({el})=>grid.appendChild(el));
    const total = cards().length, n = list.length;
    cards().forEach(el=>el.style.display="none");
    list.slice(0,6).forEach(({el})=>el.style.display="");
    if(resEl) resEl.textContent = t("results",{n: Math.min(n,6), t: total});
  }
  document.querySelectorAll(".filters input").forEach(cb=>cb.addEventListener("change", apply));
  if(sortSel) sortSel.addEventListener("change", apply);
  var fSel = document.querySelector('.shop-filters select[data-f="color"]');
  if(fSel) fSel.addEventListener("change",function(){
    document.querySelectorAll('.filters input[name="color"]').forEach(function(cb){ cb.checked = (fSel.value!=="" && cb.value===fSel.value); });
    apply();
  });

  const clearBtn = document.querySelector(".filters .btn-clear");
  if(clearBtn) clearBtn.addEventListener("click", ()=>{
    document.querySelectorAll(".filters input").forEach(cb=>cb.checked=false);
    apply();
  });
  window.__shopApply = apply;
  apply();
}

/* ---------- Dynamic renders (language-dependent lists) ---------- */
function renderDynamic(){
  document.querySelectorAll("[data-prod-name]").forEach(el=>{
    const id = el.getAttribute("data-prod-name");
    const p = merged(id);
    if(p) el.textContent = prodName(p);
  });
  document.querySelectorAll("[data-prod-meta]").forEach(el=>{
    const p = merged(el.getAttribute("data-prod-meta"));
    if(p && p.metaKey) el.textContent = t(p.metaKey);
  });
  document.querySelectorAll(".pc-price[data-prod-price]").forEach(el=>{
    const p = merged(el.getAttribute("data-prod-price"));
    if(p) el.textContent = fmtPrice(p.price);
  });
  applySlots();
  initProductPage();
  if(window.__shopApply) window.__shopApply();
  ensureWaButtons();
}

/* ---------- Dynamic product page (product.html?id=) ---------- */
function initProductTemplate(){
  if(!window.AR || !document.body.hasAttribute("data-dynamic-product")) return;
  const params = new URLSearchParams(location.search);
  const pid = params.get("id") || document.body.getAttribute("data-dynamic-product") || "";
  const p = merged(pid); if(!p) return;
  const h1 = document.querySelector(".pd-info h1");
  if(h1) h1.textContent = prodName(p);
  const pr = document.querySelector(".pd-price");
  if(pr){ const tx = pr.querySelector(".tax"); pr.textContent = fmtPrice(p.price); if(tx) pr.appendChild(tx); }
  const a = window.AR.getAdmin();
  const d = a.products && a.products[pid];
  const desc = document.querySelector(".pd-desc");
  if(desc) desc.textContent = d && (d["desc_"+lang]||d["desc_en"]) || "";
  const specs = document.querySelector(".pd-specs");
  if(specs){
    const rows = [];
    rows.push(`<div class="row"><b>${lang==="ar"?"اللون":"Color"}</b><span>${d && (d["color_"+lang]||d["color_en"]) || {emerald:"Emerald / Gold",gold:"Gold",beige:"Beige / Ivory"}[p.color] || "—"}</span></div>`);
    if(p.size) rows.push(`<div class="row"><b>${lang==="ar"?"المقاس":"Size"}</b><span>${p.size}</span></div>`);
    if(p.mat) rows.push(`<div class="row"><b>${lang==="ar"?"الخامة":"Material"}</b><span>${{wool:"Wool",silk:"Silk",cotton:"Cotton"}[p.mat] || p.mat}</span></div>`);
    rows.push(`<div class="row"><b>${lang==="ar"?"المخزون":"Stock"}</b><span data-i18n="pd_stock" style="color:${(p.stock||0)>0?"var(--emerald-700)":"#b3261e"}">${(p.stock||0)>0?(lang==="ar"?"متوفر":"In stock, ready to ship"):(lang==="ar"?"نفد المخزون":"Out of stock")}</span></div>`);
    specs.innerHTML = rows.join("");
  }
  document.querySelectorAll(".pd-actions [data-add]").forEach(b=>b.setAttribute("data-add", p.id));
  document.querySelectorAll(".pd-actions [data-buy]").forEach(b=>b.setAttribute("data-buy", p.id));
  const badge = document.querySelector(".pd-badge");
  if(badge) badge.style.display = p.badge ? "" : "none";
  const rating = document.querySelector(".pd-rating");
  if(rating) rating.innerHTML = `<span class="stars">${starsHtml(p.rating||4.8)}</span> <span class="keep-ltr">${p.rating||4.8}</span> <span class="count">(${p.reviews||0} ${lang==="ar"?"تقييم":"reviews"})</span>`;
  const main = document.querySelector(".pd-gallery .main-img img");
  if(main) main.src = window.AR.prodImgFull(p);
  document.querySelectorAll(".pd-thumbs button").forEach((b,i)=>{
    const s = a.photos && a.photos["p_"+pid+(i===0?"":"_"+(i+1))];
    if(s || i===0) b.querySelector("img").src = s || window.AR.prodImgFull(p);
  });
  const related = document.querySelector(".rel-grid");
  if(related){
    const others = window.AR.catalog().filter(x=>x.id!==pid).slice(0,3);
    related.innerHTML = others.map(o=>
      `<article class="prod-card"><a class="pc-img" href="${prodPageUrl(o)}"><img src="${window.AR.prodImgFull(o)}" alt=""></a>
      <div class="pc-body"><h3>${prodName(o)}</h3><p class="pc-meta">${metaStr(o)}</p>
      <div class="pc-price keep-ltr">${fmtPrice(o.price)}</div>
      <div class="pc-actions"><button class="btn btn-emerald" data-add="${o.id}"><span data-i18n="btn_add_cart">Add to Cart</span></button></div></div></article>`).join("");
    initAddButtons();
  }
  document.querySelectorAll(".pd-actions [data-add]").forEach(b=>b.setAttribute("data-add", pid));
  document.title = prodName(p) + " — AL-ROWDHA";
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", ()=>{
  applyI18n();
  renderCart();
  document.querySelectorAll(".lang-toggle button").forEach(b=>{
    b.addEventListener("click", ()=>setLang(b.getAttribute("data-lang")));
  });
  const burger = document.querySelector(".nav-burger");
  const nav = document.querySelector(".main-nav");
  if(burger && nav) burger.addEventListener("click", ()=>nav.classList.toggle("open"));
  document.querySelectorAll(".cart-btn").forEach(b=>b.addEventListener("click", openCart));
  const ov = document.getElementById("drawer-overlay");
  if(ov) ov.addEventListener("click", closeCart);
  document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ closeCart(); closeOrderModal(); closeCheckout(); } });
  document.addEventListener("click", e=>{
    const b = e.target.closest("[data-buy-wa]");
    if(b){
      let q = 1;
      const qtyEl = document.querySelector(".buy-row .qty span");
      if(b.closest(".pd-actions") && qtyEl) q = parseInt(qtyEl.textContent,10)||1;
      placeWaOrder([{id:b.getAttribute("data-buy-wa"), qty:q}]);
      return;
    }
  });
  document.getElementById("cart-items")?.addEventListener("click", e=>{
    const q = e.target.closest("[data-cart-qty]");
    const r = e.target.closest("[data-cart-rm]");
    if(q){
      const id = q.dataset.id; const it = cart.find(i=>i.id===id);
      if(it){ it.qty += parseInt(q.dataset.cartQty,10); if(it.qty<1) it.qty=1; saveCart(); renderCart(); }
    } else if(r){
      cart = cart.filter(i=>i.id!==r.dataset.cartRm); saveCart(); renderCart();
    }
  });
  const co = document.getElementById("checkout-btn");
  if(co) co.addEventListener("click", ()=>{
    if(!cart.length){ toast(t("cart_empty_title")); return; }
    openCheckout();
  });
  initGallery(); initQty(); initAddButtons(); initShop(); initProductTemplate(); initProductPage();
  ensureWaButtons();
});
})();
