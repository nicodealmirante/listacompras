import express from "express";
import pkg from "pg";
import fetch from "node-fetch";

const { Pool } = pkg;
const app = express();

/* === NO CACHE === */
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
  connectionString: "postgresql://postgres:sOTeSNeYMpDLhjyaEVWlFqsZbSkJsgaT@interchange.proxy.rlwy.net:55828/railway",
  ssl: { rejectUnauthorized: false }
});

/* === SEARCH === */app.get("/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json([]);

    const r = await fetch(
      "https://ratoneando-go-production.up.railway.app/?q=" +
      encodeURIComponent(q)
    );

    const text = await r.text();
    console.log("RAW RESPONSE:", text.slice(0, 200));

    const json = JSON.parse(text);

    // 👇 CLAVE
    res.json(json.products || []);

  } catch (e) {
    console.error("SEARCH ERROR:", e);
    res.json([]);
  }
});


/* === ADD === */
app.post("/add", async (req, res) => {
  const { name, image, price } = req.body;

await pool.query(
  `INSERT INTO products (name, image, price)
   VALUES ($1,$2,$3)
   ON CONFLICT (LOWER(name))
   DO UPDATE SET
     image = EXCLUDED.image,
     price = EXCLUDED.price`,
  [name, image || null, price ?? 0]
);

  res.json({ ok: true });
});

app.listen(3000, () =>
  console.log("OK → http://localhost:3000")
);
