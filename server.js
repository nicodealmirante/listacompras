import fetch from "node-fetch";
import pkg from "pg";

const { Pool } = pkg;

/* =======================
   DB
======================= */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/* =======================
   HELPERS
======================= */
const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/* =======================
   JUMBO SEARCH (SIN HASH)
======================= */
async function buscarEnJumbo(nombre) {
  const q = encodeURIComponent(normalize(nombre));

  const r = await fetch(
    `https://www.jumbo.com.ar/api/catalog_system/pub/products/search/?ft=${q}`
  );

  const j = await r.json();
  const prod = j?.[0];
  const item = prod?.items?.[0];
  const offer = item?.sellers?.[0]?.commertialOffer;

  if (!prod || !offer) return null;

  return {
    jumbo_id: prod.productId,
    price: offer.Price,
  };
}

/* =======================
   UPDATE PRODUCT
======================= */
async function actualizarProducto(producto) {
  const data = await buscarEnJumbo(producto.nombre);

  if (!data) {
    console.log("❌ No encontrado:", producto.nombre);
    return;
  }

  await pool.query(
    `
    UPDATE products
    SET
      price = $1,
      description = $2,
      updated_at = NOW()
    WHERE id = $3
    `,
    [data.price, data.jumbo_id, producto.id]
  );

  console.log(
    "✅",
    producto.nombre,
    "| $",
    data.price,
    "| jumbo_id:",
    data.jumbo_id
  );
}

/* =======================
   MAIN
======================= */
async function run() {
  const r = await pool.query(`
    SELECT id, nombre
    FROM products
    WHERE source = 'jumbo'
  `);

  for (const p of r.rows) {
    await actualizarProducto(p);
    await new Promise((r) => setTimeout(r, 1000)); // evita bloqueos
  }

  console.log("🚀 Actualización finalizada");
  process.exit(0);
}

run().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
