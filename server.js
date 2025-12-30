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

/* === SEARCH === */
app.get("/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json([]);

    const r = await fetch(
      "https://ratoneando-go-production.up.railway.app/?q=" +
      encodeURIComponent(q)
    );

    const json = await r.json();
    res.json(json.products || []);
  } catch (e) {
    console.error("SEARCH ERROR:", e);
    res.json([]);
  }
});

/* === ADD === */
app.post("/add", async (req, res) => {
  try {
    const { name, image, price, source, link, category } = req.body;

    if (!name) return res.status(400).json({ error: "name requerido" });

    const nameNorm = name.toLowerCase();

    const r = await pool.query(
      `INSERT INTO products
       (name, name_norm, image, price, source, "originalurl", category)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (name_norm) DO NOTHING
       RETURNING id`,
      [
        name,
        nameNorm,
        image || null,
        price ?? 0,
        source || null,
        link || null,
        category || null
      ]
    );

    res.json({ inserted: r.rowCount });
  } catch (e) {
    console.error("ADD ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () =>
  console.log("OK → http://localhost:3000")
);
