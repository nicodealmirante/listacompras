import express from "express";
import pkg from "pg";

const { Pool } = pkg;
const app = express();
app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
  connectionString: "postgresql://postgres:sOTeSNeYMpDLhjyaEVWlFqsZbSkJsgaT@interchange.proxy.rlwy.net:55828/railway",
  ssl: { rejectUnauthorized: false }
});

app.post("/add", async (req, res) => {
  const { nombre, price, image } = req.body;

  await pool.query(
    `INSERT INTO products (name, price, image)
     VALUES ($1,$2,$3)
     ON CONFLICT DO NOTHING`,
    [nombre, price || 0, image || null]
  );

  res.json({ ok: true });
});

app.listen(3000, () => console.log("OK http://localhost:3000"));
