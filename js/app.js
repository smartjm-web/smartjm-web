/* ============================================================
   SMARTJM · Lógica de la tienda y pedidos por WhatsApp
   ============================================================ */
(function () {
  "use strict";

  const CFG = window.SMARTJM_CONFIG;
  const P = CFG.product;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const isAvailable = (c) => c.available !== false;
  const firstAvailable = Math.max(0, P.capacities.findIndex(isAvailable));
  const state = { color: 0, capacity: firstAvailable, qty: 1, shot: 0 };
  const capLabel = (c) => c.label + (c.note ? ` (${c.note})` : "");

  /* ---------- Utilidades ---------- */
  const money = (n) =>
    n == null ? "Precio a confirmar" : "$" + new Intl.NumberFormat("es-CO").format(n);

  const currentColor = () => P.colors[state.color];
  const currentCap = () => P.capacities[state.capacity];
  const unitPrice = () => currentCap().price;
  const total = () => (unitPrice() == null ? null : unitPrice() * state.qty);

  const waLink = (text) =>
    `https://wa.me/${CFG.whatsappNumber}?text=${encodeURIComponent(text)}`;

  const pad = (n) => String(n).padStart(2, "0");

  function newOrderId() {
    const d = new Date();
    const date = `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "X");
    return `SJM-${date}-${rand}`;
  }

  function formatDate(d) {
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /* ---------- Estado (preventa / disponible) ---------- */
  function renderStatus() {
    const txt = P.status === "disponible"
      ? "Disponible · Entrega inmediata"
      : "Preventa · Pedidos abiertos";
    $$("[data-status-badge]").forEach((el) => (el.textContent = txt));
  }

  /* ---------- Galería ---------- */
  const EXTRA_SHOTS = [
    { src: "assets/duo/duo-portada-fin.webp", alt: "iPhone Duo abierto en las manos" },
    { src: "assets/duo/duo-pantalla-fin.webp", alt: "Pantalla interior de 7,6 pulgadas" },
    { src: "assets/duo/duo-posturas-fin.webp", alt: "iPhone Duo en varias posturas" }
  ];

  function shots() {
    const c = currentColor();
    return [{ src: c.image, alt: `iPhone Duo en color ${c.name}, cerrado y abierto` }].concat(EXTRA_SHOTS);
  }

  function setMainImage(src, alt) {
    const img = $("[data-main-image]");
    if (img.getAttribute("src") === src) { img.alt = alt; return; }
    img.classList.add("is-fading");
    const pre = new Image();
    pre.onload = pre.onerror = () => {
      img.src = src;
      img.alt = alt;
      requestAnimationFrame(() => img.classList.remove("is-fading"));
    };
    pre.src = src;
  }

  function renderGallery() {
    const list = shots();
    const wrap = $("[data-thumbs]");
    wrap.innerHTML = "";
    list.forEach((s, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "thumb" + (i === state.shot ? " is-active" : "");
      b.setAttribute("role", "listitem");
      b.setAttribute("aria-label", `Ver imagen ${i + 1}: ${s.alt}`);
      b.innerHTML = `<img src="${s.src}" alt="" loading="lazy">`;
      b.addEventListener("click", () => { state.shot = i; renderGallery(); });
      wrap.appendChild(b);
    });
    setMainImage(list[state.shot].src, list[state.shot].alt);
  }

  /* ---------- Videos de escenas: se reproducen al verse ---------- */
  function setupScenes() {
    const vids = $$("video[data-scene]");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      vids.forEach((v) => { v.removeAttribute("autoplay"); v.pause(); });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) {
          if (v.preload === "none") { v.preload = "auto"; v.load(); }
          if (v.ended) v.currentTime = 0;
          const p = v.play();
          if (p && p.catch) p.catch(() => {});
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: 0.45 });
    vids.forEach((v) => io.observe(v));
  }

  /* ---------- Configurador ---------- */
  function renderColors() {
    const wrap = $("[data-colors]");
    wrap.innerHTML = "";
    P.colors.forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch" + (i === state.color ? " is-active" : "");
      b.setAttribute("aria-label", c.name);
      b.setAttribute("aria-pressed", i === state.color);
      b.title = c.name;
      b.innerHTML = `<span style="background:${c.swatch}"></span>`;
      b.addEventListener("click", () => { state.color = i; state.shot = 0; update(); });
      wrap.appendChild(b);
    });
    $("[data-color-name]").textContent = currentColor().name;
  }

  function renderCapacities() {
    const wrap = $("[data-capacities]");
    wrap.innerHTML = "";
    P.capacities.forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      const ok = isAvailable(c);
      b.className = "cap" + (i === state.capacity ? " is-active" : "") + (ok ? "" : " is-soldout");
      b.setAttribute("aria-pressed", i === state.capacity);
      b.disabled = !ok;
      const detail = ok
        ? money(c.price) + (c.note ? ` · ${c.note}` : "")
        : "Agotado";
      b.innerHTML = `<strong>${c.label}</strong><small>${detail}</small>`;
      if (ok) b.addEventListener("click", () => { state.capacity = i; update(); });
      wrap.appendChild(b);
    });
  }

  function renderPrice() {
    $("[data-price]").textContent = money(total());
    const prices = P.capacities.filter(isAvailable).map((c) => c.price).filter((p) => p != null);
    $$("[data-from-price]").forEach((el) =>
      (el.textContent = prices.length ? money(Math.min(...prices)) : "Precio a confirmar"));

    const depLine = $("[data-deposit-line]");
    if (P.deposit && total() != null) {
      const saldo = total() - P.deposit * state.qty;
      depLine.innerHTML = `Sepáralo con <strong>${money(P.deposit * state.qty)}</strong> · Saldo al recibir ${money(saldo)}`;
    } else if (P.deposit) {
      depLine.innerHTML = `Sepáralo con un abono desde <strong>${money(P.deposit)}</strong>`;
    } else {
      depLine.textContent = "Te confirmamos el precio final por WhatsApp.";
    }
    const depCard = $("[data-deposit-card]");
    if (depCard && P.deposit) {
      depCard.textContent = `Aparta tu equipo con ${money(P.deposit)} al precio de hoy y paga el saldo al recibir.`;
    }
  }

  function renderQty() {
    $("[data-qty-value]").textContent = state.qty;
    $('[data-qty="-1"]').disabled = state.qty <= 1;
    $('[data-qty="1"]').disabled = state.qty >= P.maxQty;
  }

  function renderSummary() {
    const c = currentColor();
    $("[data-summary]").innerHTML = `
      <img src="${c.image}" alt="">
      <div class="summary__info">
        <strong>${P.name} · ${capLabel(currentCap())}</strong>
        <small>${c.name} · Cantidad: ${state.qty}</small>
      </div>
      <div class="summary__total"><small>Total</small>${money(total())}</div>`;
  }

  function update() {
    renderColors();
    renderCapacities();
    renderPrice();
    renderQty();
    renderSummary();
    renderGallery();
  }

  /* ---------- Cantidad ---------- */
  function setupQty() {
    $$("[data-qty]").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.qty = Math.min(P.maxQty, Math.max(1, state.qty + Number(btn.dataset.qty)));
        update();
      }));
  }

  /* ---------- Menú móvil ---------- */
  function setupNav() {
    const burger = $("#burger");
    const nav = $("#nav");
    burger.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open);
    });
    $$("a", nav).forEach((a) => a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    }));
  }

  /* ---------- WhatsApp directo y datos de contacto ---------- */
  function setupDirectWhatsApp() {
    const msg = `Hola ${CFG.storeName} 👋, vengo de la página web y quiero información del ${P.name}.`;
    $$("[data-whatsapp-direct]").forEach((el) =>
      el.addEventListener("click", (e) => {
        e.preventDefault();
        window.open(waLink(msg), "_blank", "noopener");
      }));
    $$("[data-wa-display]").forEach((el) => (el.textContent = CFG.whatsappDisplay));
    $$("[data-email]").forEach((el) => {
      el.textContent = CFG.email;
      el.href = `mailto:${CFG.email}`;
    });
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  /* ---------- Modal de pedido ---------- */
  const modal = $("#orderModal");
  const form = $("#orderForm");
  let lastFocus = null;

  function showStep(step) {
    $$("[data-order-step]", modal).forEach((el) => (el.hidden = el.dataset.orderStep !== step));
  }

  function openOrder() {
    lastFocus = document.activeElement;
    renderSummary();
    showStep("form");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => form.elements.nombre.focus(), 250);
  }

  function closeOrder() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  function setupModal() {
    $$("[data-open-order]").forEach((b) => b.addEventListener("click", openOrder));
    $$("[data-close-order]", modal).forEach((b) => b.addEventListener("click", closeOrder));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeOrder();
    });

    const delivery = $("[data-delivery]");
    CFG.deliveryOptions.forEach((o, i) => {
      const label = document.createElement("label");
      label.className = "radio-card";
      label.innerHTML = `<input type="radio" name="entrega" value="${o.id}" ${i === 0 ? "checked" : ""}>
        <span><strong>${o.label}</strong><small>${o.hint}</small></span>`;
      delivery.appendChild(label);
    });
    delivery.addEventListener("change", syncDelivery);
    syncDelivery();

    $("[data-payments]").innerHTML = `<option value="">Selecciona una opción</option>` +
      CFG.paymentOptions.map((o) => `<option value="${o.id}">${o.label}</option>`).join("");

    ["celular", "cedula"].forEach((n) =>
      form.elements[n].addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/[^\d\s]/g, "");
      }));

    form.addEventListener("input", (e) => e.target.classList.remove("is-invalid"));
    form.addEventListener("submit", onSubmit);
  }

  function syncDelivery() {
    const isShip = form.elements.entrega.value === "envio";
    $("[data-address-field]").hidden = !isShip;
    form.elements.direccion.required = isShip;
  }

  function validate(data) {
    const errors = [];
    const mark = (name) => form.elements[name].classList.add("is-invalid");
    if (data.nombre.length < 3) { errors.push("tu nombre"); mark("nombre"); }
    const digits = data.celular.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 12) { errors.push("un celular válido"); mark("celular"); }
    if (data.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) { errors.push("un correo válido"); mark("correo"); }
    if (!data.ciudad) { errors.push("la ciudad"); mark("ciudad"); }
    if (!data.departamento) { errors.push("el departamento"); mark("departamento"); }
    if (data.entrega === "envio" && data.direccion.length < 5) { errors.push("la dirección"); mark("direccion"); }
    if (!data.pago) { errors.push("el método de pago"); mark("pago"); }
    return errors;
  }

  function buildMessage(id, data) {
    const c = currentColor();
    const cap = currentCap();
    const delivery = CFG.deliveryOptions.find((o) => o.id === data.entrega);
    const payment = CFG.paymentOptions.find((o) => o.id === data.pago);
    const lines = [
      `🛒 *NUEVO PEDIDO · ${CFG.storeName}*`,
      `Orden: *${id}*`,
      `Fecha: ${formatDate(new Date())}`,
      ``,
      `📱 *Producto*`,
      `${P.name} · ${capLabel(cap)} · ${c.name}`,
      `Cantidad: ${state.qty}`,
      `Precio unitario: ${money(cap.price)}`,
      `*Total: ${money(total())}*`
    ];
    if (data.pago === "abono" && P.deposit) {
      lines.push(`Abono para separar: ${money(P.deposit * state.qty)}`);
    }
    lines.push(``, `👤 *Cliente*`, `Nombre: ${data.nombre}`, `Celular: ${data.celular}`);
    if (data.cedula) lines.push(`Cédula: ${data.cedula}`);
    if (data.correo) lines.push(`Correo: ${data.correo}`);
    lines.push(``, `🚚 *Entrega:* ${delivery ? delivery.label : data.entrega}`,
      `Ciudad: ${data.ciudad}, ${data.departamento}`);
    if (data.entrega === "envio") lines.push(`Dirección: ${data.direccion}`);
    lines.push(``, `💳 *Pago:* ${payment ? payment.label : data.pago}`);
    if (data.notas) lines.push(`📝 *Notas:* ${data.notas}`);
    lines.push(``, `Quedo atento(a) a la confirmación de mi pedido. ¡Gracias!`);
    return lines.join("\n");
  }

  function saveOrder(order) {
    try {
      const key = "smartjm_orders";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.unshift(order);
      localStorage.setItem(key, JSON.stringify(list.slice(0, 20)));
    } catch (_) { /* almacenamiento no disponible: no pasa nada */ }
  }

  function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(form);
    const data = {};
    ["nombre", "celular", "cedula", "correo", "entrega", "ciudad", "departamento", "direccion", "pago", "notas"]
      .forEach((k) => (data[k] = String(fd.get(k) || "").trim()));

    const errorBox = $("[data-form-error]");
    const errors = validate(data);
    if (errors.length) {
      errorBox.textContent = "Por favor revisa: " + errors.join(", ") + ".";
      const first = form.querySelector(".is-invalid");
      if (first) first.focus();
      return;
    }
    errorBox.textContent = "";

    const id = newOrderId();
    const url = waLink(buildMessage(id, data));

    saveOrder({
      id, date: new Date().toISOString(),
      product: P.name, color: currentColor().name, capacity: capLabel(currentCap()),
      qty: state.qty, total: total(), customer: data
    });

    $("[data-order-id]").textContent = id;
    $("[data-order-link]").href = url;
    showStep("done");
    window.open(url, "_blank", "noopener");
  }

  /* ---------- Inicio ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderStatus();
    setupScenes();
    setupQty();
    setupNav();
    setupDirectWhatsApp();
    setupModal();
    update();
  });
})();
