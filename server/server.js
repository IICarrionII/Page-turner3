const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const stripe = require("stripe")("sk_test_51QTe37Ggb0HFI2Kdvohdaq57HLywXhsR9ihgzvBj5PosMF1ocJKyGhHLISKDcUMFd7VBuWmajqtxtej0owiwf6ql001t6Bv7tO");


const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../"))); // Serve static files

// Initialize SQLite database
const db = new sqlite3.Database("bookstore.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

// Create Tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      category TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS purchase_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    )
  `);

  console.log("Tables created successfully.");
});

// Routes
// Get All Books
app.get("/api/books", (req, res) => {
    db.all("SELECT * FROM books", [], (err, rows) => {
        if (err) {
            console.error("Error fetching books:", err.message);
            res.status(500).json({ error: err.message });
        } else {
            console.log("Books fetched successfully:", rows); // Debugging log
            res.json(rows);
        }
    });
});


// Checkout Route
app.post("/api/checkout", async (req, res) => {
    const { customerId, items } = req.body;

    if (!customerId || !items || items.length === 0) {
        return res.status(400).json({ error: "Invalid request data" });
    }

    let totalAmount = 0;
    items.forEach((item) => {
        if (!item.price || !item.quantity) {
            return res.status(400).json({ error: "Invalid item format" });
        }
        totalAmount += item.price * item.quantity;
    });

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // Convert to cents
            currency: "usd",
            automatic_payment_methods: { enabled: true },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error("Error processing checkout:", error.message);
        res.status(500).json({ error: "Failed to process checkout" });
    }
});


// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
