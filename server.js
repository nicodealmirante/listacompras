import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function extraerJumboId(description) {
  if (!description) return null;

  // si viene tipo "JUMBO:123456"
  const match = description.match(/\d+/);
  return match ? match[0] : null;
}

async function obtenerPrecioJumbo(jumboId) {
  try {
    const r = await fetch(`https://api.jumbo.com.ar/products/${jumboId}`);
    const j = await r.json();
    return Number(j.price);
  } catch {
    return null;
  }
}

async function syncJumboPrices() {
  const { rows } = await pool.query(
    "SELECT id, description, jumbo_price FROM products"
  );

  for (const p of rows) {
    const jumboId = extraerJumboId(p.description);
    if (!jumboId) continue;

    const nuevoPrecio = await obtenerPrecioJumbo(jumboId);
    if (!nuevoPrecio) continue;

    if (Number(p.jumbo_price) !== nuevoPrecio) {
      await pool.query(
        "UPDATE products SET jumbo_price = $1 WHERE id = $2",
        [nuevoPrecio, p.id]
      );

      console.log(
        `Producto ${p.id} | ${p.jumbo_price} → ${nuevoPrecio}`
      );
    }
  }

  console.log("Sync Jumbo OK");
  process.exit(0);
}

syncJumboPrices();
