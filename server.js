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


app.post("/add", async (req, res) => {
  const { name, image, price, source, originalUrl } = req.body;

  const nameNorm = name.toLowerCase();

  const r = await pool.query(
    `INSERT INTO products (name, name_norm, image, price, source, originalUrl)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (name_norm) DO NOTHING
     RETURNING id`,
    [name, nameNorm, image || null, price ?? 0, source || null, originalUrl || null]
  );

  res.json({ inserted: r.rowCount });
});


app.listen(3000, () =>
  console.log("OK → http://localhost:3000")
);
