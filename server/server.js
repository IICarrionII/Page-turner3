const bcrypt = require("bcrypt"); // For hashing passwords
const jwt = require("jsonwebtoken"); // For generating tokens
const SECRET_KEY = "your_jwt_secret_key"; // Replace with a secure secret key
const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const cookieParser = require("cookie-parser");
const path = require("path");
const stripe = require("stripe")("sk_test_51QTe37Ggb0HFI2Kdvohdaq57HLywXhsR9ihgzvBj5PosMF1ocJKyGhHLISKDcUMFd7VBuWmajqtxtej0owiwf6ql001t6Bv7tO");

const app = express();
const PORT = 3000;
const { Parser } = require("json2csv");
// Admin Credentials
const adminCredentials = {
    username: "admin",
    password: "admin123",
};

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());
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
// Create Users Table
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            email TEXT UNIQUE,
            name TEXT
        )
    `);
});
// Create Tickets Table
db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'Open',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);

// Admin Login
app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;

    if (username === adminCredentials.username && password === adminCredentials.password) {
        // Set admin session
        res.cookie("isAdmin", true, { httpOnly: true });
        res.json({ success: true });
    } else {
        res.status(401).json({ error: "Invalid admin credentials" });
    }
});
// Route to check admin status and serve admin.html
app.get("/admin.html", (req, res) => {
    const isAdmin = req.cookies && req.cookies.isAdmin === "true";

    if (isAdmin) {
        res.sendFile(path.join(__dirname, "../admin.html"));
    } else {
        res.redirect("/admin-login.html");
    }
});

// Admin Logout
app.post("/api/admin/logout", (req, res) => {
    res.clearCookie("isAdmin");
    res.json({ success: true });
});

// Check Admin Status
app.get("/api/admin/status", (req, res) => {
    const isAdmin = req.cookies && req.cookies.isAdmin;
    res.json({ isAdmin: !!isAdmin });
});

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

    db.run(`
        INSERT INTO books (title, author, price, stock, category)
        VALUES (?, ?, ?, ?, ?)
    `, [title, author, price, stock, category], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ id: this.lastID });
        }
    });
});

// Delete a Book
app.delete("/api/books/:id", (req, res) => {
    const { id } = req.params;

    db.run("DELETE FROM books WHERE id = ?", [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ deleted: this.changes });
        }
    });
});

// Get All Orders
app.get("/api/orders", (req, res) => {
    db.all(`
        SELECT 
            ph.id AS order_id,
            c.name AS customer_name,
            c.email AS customer_email,
            GROUP_CONCAT(b.title || ' x ' || ph.quantity) AS books,
            SUM(ph.quantity * b.price) AS total_price,
            ph.date AS order_date
        FROM purchase_history ph
        JOIN customers c ON ph.customer_id = c.id
        JOIN books b ON ph.book_id = b.id
        GROUP BY ph.id
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
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
        res.status(500).json({ error: "Failed to process checkout" });
    }
});
// Export Books Report as CSV
app.get("/api/export/books", (req, res) => {
    db.all("SELECT * FROM books", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Failed to fetch books." });
        }

        try {
            const fields = ["id", "title", "author", "price", "stock", "category"];
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(rows);

            res.header("Content-Type", "text/csv");
            res.attachment("books-report.csv");
            res.send(csv);
        } catch (error) {
            res.status(500).json({ error: "Failed to export data." });
        }
    });
});

// Export Orders Report as CSV
app.get("/api/export/orders", (req, res) => {
    db.all(
        `
        SELECT 
            ph.id AS order_id,
            c.name AS customer_name,
            c.email AS customer_email,
            GROUP_CONCAT(b.title || ' x ' || ph.quantity) AS books,
            SUM(ph.quantity * b.price) AS total_price,
            ph.date AS order_date
        FROM purchase_history ph
        JOIN customers c ON ph.customer_id = c.id
        JOIN books b ON ph.book_id = b.id
        GROUP BY ph.id
        `,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: "Failed to fetch orders." });
            }

            try {
                const fields = ["order_id", "customer_name", "customer_email", "books", "total_price", "order_date"];
                const json2csvParser = new Parser({ fields });
                const csv = json2csvParser.parse(rows);

                res.header("Content-Type", "text/csv");
                res.attachment("orders-report.csv");
                res.send(csv);
            } catch (error) {
                res.status(500).json({ error: "Failed to export data." });
            }
        }
    );
});
// Get Low Stock Books
app.get("/api/books/low-stock", (req, res) => {
    db.all("SELECT * FROM books WHERE stock < 5", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: "Failed to fetch low stock books." });
        } else {
            res.json(rows);
        }
    });
});// User Registration Endpoint
app.post("/api/register", async (req, res) => {
    const { username, password, email, name } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password securely
        db.run(
            `INSERT INTO users (username, password, email, name) VALUES (?, ?, ?, ?)`,
            [username, hashedPassword, email, name],
            function (err) {
                if (err) {
                    return res.status(400).json({ error: "Username or email already exists." });
                }
                res.status(201).json({ success: "User registered successfully." });
            }
        );
    } catch (error) {
        res.status(500).json({ error: "Registration failed." });
    }
});
// User Login Endpoint
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: "Invalid username or password." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password); // Compare hashed password
        if (!passwordMatch) {
            return res.status(400).json({ error: "Invalid username or password." });
        }

        // Generate JWT Token for session management
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ success: "Login successful.", token });
    });
});
// Submit a New Ticket
app.post("/api/tickets", (req, res) => {
    const { user_name, email, subject, description } = req.body;

    db.run(
        `INSERT INTO tickets (user_name, email, subject, description) VALUES (?, ?, ?, ?)`,
        [user_name, email, subject, description],
        function (err) {
            if (err) {
                return res.status(500).json({ error: "Failed to submit ticket" });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Get All Tickets (For Admin)
app.get("/api/tickets", (req, res) => {
    db.all(`SELECT * FROM tickets`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Failed to fetch tickets" });
        }
        res.json(rows);
    });
});

// Update Ticket Status (For Admin)
app.put("/api/tickets/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    db.run(`UPDATE tickets SET status = ? WHERE id = ?`, [status, id], function (err) {
        if (err) {
            return res.status(500).json({ error: "Failed to update ticket status" });
        }
        res.json({ success: true, updated: this.changes });
    });
});
// Start the Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
