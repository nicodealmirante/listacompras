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

    const text = await r.text(); // 👈 LEER COMO TEXTO

    // log real para ver qué devuelve
    console.log("RAW RESPONSE:", text.slice(0, 300));

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.json([]);
    }

    res.json(data);

  } catch (e) {
    console.error("SEARCH ERROR:", e);
    res.json([]);
  }
});


    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error("SEARCH ERROR:", e.message);
    res.status(500).json([]);
  }
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
