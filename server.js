import express from "express";
import pkg from "pg";
import fetch from "node-fetch";

const { Pool } = pkg;
const app = express();

app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
  connectionString: "postgresql://postgres:sOTeSNeYMpDLhjyaEVWlFqsZbSkJsgaT@interchange.proxy.rlwy.net:55828/railway",
  ssl: { rejectUnauthorized: false }
});

/* ===== SEARCH (backend) ===== */
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
    console.error(e);
    res.json([]);
  }
});

/* ===== ADD ===== */
app.post("/add", async (req, res) => {
  const { name, image, price, source, link, category } = req.body;
  const nameNorm = name.toLowerCase();

  const r = await pool.query(
    `INSERT INTO products
     (name, name_norm, image, price, source, "originalUrl", category)
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
});

app.listen(process.env.PORT || 3000, () =>
  console.log("OK → http://localhost:3000")
);
