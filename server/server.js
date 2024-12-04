const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../')));

// Mock database for users
const users = [];

// Routes
app.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (users.find(user => user.email === email)) {
        return res.status(400).send({ message: 'User already exists' });
    }

    users.push({ name, email, password });
    res.send({ message: 'Registration successful' });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find(user => user.email === email && user.password === password);
    if (!user) {
        return res.status(401).send({ message: 'Invalid credentials' });
    }

    res.send({ message: 'Login successful' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
