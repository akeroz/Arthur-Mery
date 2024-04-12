const express = require("express");
const postgres = require("postgres");
const z = require("zod");

const app = express();
const port = 8000;
const sql = postgres({ db: "mydb", user: "user", password: "password" });

app.use(express.json());

// Schemas
const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  about: z.string(),
  price: z.number().positive(),
});

// GET product by ID
app.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await sql`
      SELECT * FROM products WHERE id = ${id}
    `;
    if (product.length === 0) {
      res.status(404).json({ error: "G pas trouvé le produit chef" });
    } else {
      res.json(product[0]);
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET all products with pagination
app.get("/products", async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const offset = (page - 1) * limit;
    const products = await sql`
      SELECT * FROM products LIMIT ${limit} OFFSET ${offset}
    `;
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST create a new product
app.post("/products", async (req, res) => {
  try {
    const newProduct = ProductSchema.parse(req.body);
    const { id, name, about, price } = newProduct;
    await sql`
      INSERT INTO products (id, name, about, price)
      VALUES (${id}, ${name}, ${about}, ${price})
    `;
    res.status(201).json({ message: "gg t'as crée le produit" });
  } catch (error) {
    console.error("Error creating product:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid data provided" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

// DELETE a product
app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await sql`
      DELETE FROM products WHERE id = ${id}
    `;
    res.json({ message: "gg t'as supprimé le produit" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
