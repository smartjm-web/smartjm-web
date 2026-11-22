/* ============================================================
   SMARTJM · CONFIGURACIÓN DE LA TIENDA
   Edita este archivo para cambiar número, precios y datos.
   ============================================================ */
window.SMARTJM_CONFIG = {
  storeName: "SmartJM",
  slogan: "Tecnología a tu alcance",

  // ⚠️ CAMBIAR: número de WhatsApp del vendedor.
  // Formato: indicativo del país + número, sin "+", espacios ni guiones.
  // Ejemplo Colombia: "573001234567"
  whatsappNumber: "573000000000",

  // Texto visible del número (solo para mostrar en la página)
  whatsappDisplay: "300 000 0000",

  city: "Colombia",
  email: "ventas@smartjm.co", // ⚠️ CAMBIAR

  product: {
    id: "iphone-duo",
    name: "iPhone Duo",
    tagline: "El primer iPhone que se abre.",
    // "disponible" | "preventa"
    status: "preventa",

    colors: [
      { id: "cielo-nocturno", name: "Cielo nocturno", swatch: "#2b3446",
        image: "assets/duo/duo-render-cielo-nocturno-1200.webp" },
      { id: "blanco-estrella", name: "Blanco estrella", swatch: "#ece8df",
        image: "assets/duo/duo-render-blanco-estrella-1200.webp" }
    ],

    // ⚠️ CAMBIAR: precios en pesos colombianos (sin puntos).
    // Si pones null se muestra "Precio a confirmar".
    // available: false => se muestra "Agotado" y no se puede elegir.
    capacities: [
      { id: "256", label: "256 GB", price: null, available: false },
      { id: "512", label: "512 GB", note: "eSIM", price: 8700000, available: true }
    ],

    // Abono para separar el equipo (null para ocultarlo)
    deposit: 500000,
    maxQty: 3
  },

  deliveryOptions: [
    { id: "envio", label: "Envío a domicilio", hint: "A toda Colombia" },
    { id: "tienda", label: "Recoger en tienda", hint: "Te confirmamos el punto" }
  ],

  paymentOptions: [
    { id: "contraentrega", label: "Contra entrega" },
    { id: "transferencia", label: "Transferencia / Nequi / Daviplata" },
    { id: "tarjeta", label: "Tarjeta débito o crédito" },
    { id: "abono", label: "Separar con abono" },
    { id: "credito", label: "Crédito / financiación" }
  ]
};
