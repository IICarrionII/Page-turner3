const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

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

// Insert Sample Books
const sampleBooks = [
  { title: "Shadows of Eternity", author: "John Doe", price: 10.99, stock: 50, category: "Fantasy" },
  { title: "The Forgotten Realm", author: "Jane Smith", price: 12.99, stock: 30, category: "Adventure" },
  { title: "Whispers in the Wind", author: "Emily Brown", price: 15.99, stock: 20, category: "Mystery" },
  { title: "Echoes of the Past", author: "Michael Johnson", price: 9.99, stock: 25, category: "History" },
  { title: "Crimson Horizon", author: "Sophia Wilson", price: 11.99, stock: 40, category: "Sci-Fi" },
  { title: "Secrets of the Deep", author: "Chris Green", price: 13.99, stock: 15, category: "Thriller" },
  { title: "The Enchanted Forest", author: "Lily White", price: 14.99, stock: 35, category: "Fantasy" },
  { title: "Legends of Lumora", author: "Anna Lee", price: 8.99, stock: 60, category: "Adventure" },
  { title: "Mystic Tides", author: "Ethan Harris", price: 16.99, stock: 10, category: "Mystery" },
  { title: "The Lost Chronicle", author: "Olivia Parker", price: 19.99, stock: 5, category: "Fantasy" },
];

// Insert Sample Data into Books Table
function populateBooks() {
  db.serialize(() => {
    sampleBooks.forEach((book) => {
      db.run(
        `INSERT INTO books (title, author, price, stock, category) VALUES (?, ?, ?, ?, ?)`,
        [book.title, book.author, book.price, book.stock, book.category],
        (err) => {
          if (err && err.message.includes("UNIQUE constraint failed")) {
            // Ignore duplicate entries
            return;
          } else if (err) {
            console.error("Error inserting sample books:", err.message);
          }
        }
      );
    });
    console.log("Sample books added successfully.");
  });
}

// Call populateBooks to insert the sample data
populateBooks();

// Routes
// Get All Books
app.get("/api/books", (req, res) => {
  db.all("SELECT * FROM books", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Add a New Book
app.post("/api/books", (req, res) => {
  const { title, author, price, stock, category } = req.body;
  db.run(
    `INSERT INTO books (title, author, price, stock, category) VALUES (?, ?, ?, ?, ?)`,
    [title, author, price, stock, category],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID });
      }
    }
  );
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
