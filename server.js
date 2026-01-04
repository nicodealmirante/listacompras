import express from "express";
import pkg from "pg";
import fetch from "node-fetch";

const { Pool } = pkg;
const app = express();

app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.get("/ping", (_, res) => res.send("OK"));

/* =========================
   SEARCH (sin cambios)
========================= */
app.get("/search", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json([]);

    const r = await fetch(
      "https://ratoneando-go-production.up.railway.app/?q=" +
        encodeURIComponent(q)
    );
    const j = await r.json();

    res.json(j.products || []);
  } catch (e) {
    console.error("SEARCH ERR:", e);
    res.status(500).json([]);
  }
});

/* =========================
   ADD (ADAPTADO)
========================= */
app.post("/add", async (req, res) => {
  try {
    const {
      name,
      image,
      source,
      link,
      category,
      price,
      description, // 👈 NUEVO
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name requerido" });
    }

    const nameNorm = name
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const r = await pool.query(
      `
      INSERT INTO products
        (name, name_norm, image, price, description, source, originalurl, category)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (name_norm) DO NOTHING
      RETURNING id
      `,
      [
        name,
        nameNorm,
        image || null,
        price ?? 0,
        description || null,
        source || null,
        link || null,
        category || null,
      ]
    );

    console.log("INSERTED:", r.rowCount);
    res.json({ inserted: r.rowCount });
  } catch (e) {
    console.error("ADD ERR:", e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("SERVER OK")
);
