/* Shared helpers for every page: XML loading, cart (localStorage), header/footer */
const money = n => "₹" + Number(n).toLocaleString("en-IN");
const esc = s => { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; };
const tint = c => "t-" + c.toLowerCase().replace(/[^a-z]/g, "");
const stars = r => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));
const FREE_SHIPPING_ABOVE = 999, SHIPPING_FEE = 49;

/* ---------- XML ---------- */
function parseProducts(xmlText){
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Invalid XML");
  return Array.from(doc.getElementsByTagName("product")).map(p => {
    const g = tag => { const el = p.getElementsByTagName(tag)[0]; return el ? el.textContent.trim() : ""; };
    return { id: g("id"), name: g("name"), category: g("category"), price: Number(g("price")),
             mrp: Number(g("mrp")), rating: Number(g("rating")), stock: Number(g("stock")),
             icon: g("icon"), description: g("description") };
  });
}
let _products;
function loadProducts(){
  if (_products) return Promise.resolve(_products);
  return fetch("products.xml")
    .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
    .catch(() => window.PRODUCTS_XML)          // opened from a folder: use the embedded copy
    .then(text => { _products = parseProducts(text); return _products; });
}
function showError(el){
  el.innerHTML = '<div class="empty">Sorry, the product data could not be loaded.</div>';
}

/* ---------- Cart ---------- */
function getCart(){ try { return JSON.parse(localStorage.getItem("cart") || "{}"); } catch (e) { return {}; } }
function saveCart(c){ try { localStorage.setItem("cart", JSON.stringify(c)); } catch (e) {} updateBadge(); }
function addToCart(id, qty = 1){ const c = getCart(); c[id] = (c[id] || 0) + qty; saveCart(c); toast("Added to cart"); }
function setQty(id, q){ const c = getCart(); if (q <= 0) delete c[id]; else c[id] = q; saveCart(c); }
function clearCart(){ saveCart({}); }
function cartCount(){ return Object.values(getCart()).reduce((a, b) => a + b, 0); }
function cartLines(products){            // [{p, qty}] for items still in the catalogue
  const c = getCart();
  return Object.keys(c).map(id => ({ p: products.find(x => x.id === id), qty: c[id] })).filter(l => l.p);
}
function totals(lines){
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  return { subtotal, shipping, total: subtotal + shipping };
}

/* ---------- UI ---------- */
function updateBadge(){ const b = document.getElementById("badge"); if (b) b.textContent = cartCount() || ""; }
function toast(msg){
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 1400);
}
function renderLayout(active){
  const links = [["index.html", "Home"], ["products.html", "Products"], ["cart.html", "Cart"]];
  document.getElementById("site-header").innerHTML =
    '<div class="announce">🚚 Free delivery on orders above ₹999 · ↩️ 7-day easy returns</div>' +
    '<header class="top"><div class="bar"><a class="brand" href="index.html"><span class="brand-mark">🛍️</span>ShopEasy</a><nav>' +
    links.map(l => '<a href="' + l[0] + '" class="' + (active === l[0] ? "on" : "") + '">' + l[1] +
      (l[0] === "cart.html" ? '<span class="badge" id="badge"></span>' : "") + "</a>").join("") +
    "</nav></div></header>";
  const cats = ["Electronics", "Books", "Fashion", "Home"];
  document.getElementById("site-footer").innerHTML =
    '<footer class="foot"><div class="foot-in">' +
    '<div><b>🛍️ ShopEasy</b><p>A demo online store built with HTML, CSS, JavaScript and XML.</p></div>' +
    '<div><h4>Quick links</h4><a href="index.html">Home</a><a href="products.html">All products</a><a href="cart.html">Your cart</a></div>' +
    '<div><h4>Categories</h4>' + cats.map(c => '<a href="products.html?cat=' + c + '">' + c + "</a>").join("") + "</div></div>" +
    '<div class="foot-bot">© ' + new Date().getFullYear() + " ShopEasy. All rights reserved.</div></footer>";
  updateBadge();
}
function productCard(p){
  const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const out = p.stock < 1;
  return '<article class="pcard">' +
    '<a class="pimg ' + tint(p.category) + '" href="product.html?id=' + p.id + '"><span class="emo">' + p.icon + "</span>" + (off ? '<span class="off">' + off + "% off</span>" : "") + "</a>" +
    '<div class="pbody"><span class="cat">' + esc(p.category) + "</span>" +
    '<h3><a href="product.html?id=' + p.id + '">' + esc(p.name) + "</a></h3>" +
    '<div class="stars">' + stars(p.rating) + " <small>" + p.rating + "</small></div>" +
    '<div class="price">' + money(p.price) + (off ? "<s>" + money(p.mrp) + "</s>" : "") + "</div>" +
    '<button class="btn" data-add="' + p.id + '"' + (out ? " disabled" : "") + ">" + (out ? "Out of stock" : "Add to cart") + "</button></div></article>";
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-add]");
  if (b) addToCart(b.dataset.add);
});
