# SmartJM · Tienda de pedidos por WhatsApp

Página de venta del **iPhone Duo**. El cliente elige color, capacidad y cantidad, llena sus datos y la orden (con número `SJM-AAMMDD-XXXX`) se abre en el WhatsApp del vendedor.

## Estructura
```
index.html        Página
css/styles.css    Estilos (colores de marca en :root)
js/config.js      ⚙️ Número de WhatsApp, precios, colores, pagos
js/app.js         Lógica del configurador y del pedido
assets/           Logo
assets/duo/       Renders, imágenes y videos del iPhone Duo
```

## Antes de publicar
Edita `js/config.js`:
- `whatsappNumber`: número del vendedor, ej. `"573001234567"` (sin + ni espacios).
- `whatsappDisplay` y `email`.
- `capacities[].price`: precios reales (o `null` para mostrar "Precio a confirmar").
- `status`: `"preventa"` o `"disponible"`.
- `deposit`: abono para separar (o `null`).

## Ver en local
Abre `index.html` con doble clic en el navegador. No requiere instalación.

## Publicar (Vercel)
El sitio es estático, no necesita build. Está conectado a Vercel desde GitHub:
cada `git push` a `main` actualiza la web automáticamente.

```
git add -A
git commit -m "Actualizar precios"
git push
```
