import express from "express";
import pkg from "pg";

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
  const q = req.query.q;
  if (!q) return res.json([]);

  const r = await fetch(
    "https://ratoneando-go-production.up.railway.app/?q=" +
      encodeURIComponent(q)
  );
  const data = await r.json();
  res.json(data);
});

/* === ADD === */
app.post("/add", async (req, res) => {
  const { nombre, price, image } = req.body;

  await pool.query(
    `INSERT INTO products (name, price, image)
     VALUES ($1,$2,$3)`,
    [nombre, price || 0, image || null]
  );

  res.json({ ok: true });
});

app.listen(3000, () =>
  console.log("OK → http://localhost:3000")
);
