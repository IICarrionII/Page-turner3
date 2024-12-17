if (typeof Stripe === "undefined") {
    console.error("Stripe.js failed to load. Ensure the Stripe script is included in cart.html before script.js.");
} else {
    console.log("Stripe.js successfully loaded.");
}


let stripe;
let elements;

// Load Books
function loadBooks() {
    fetch('/api/books')
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch books.");
            }
            return response.json();
        })
        .then((books) => {
            const bookList = document.getElementById("book-list");
            if (!bookList) return;

            // Display books
            bookList.innerHTML = books.map((book) => `
                <div class="book">
                    <img src="images/book${book.id}.jpg" alt="${book.title}">
                    <h4>${book.title}</h4>
                    <p>Author: ${book.author}</p>
                    <p>Price: $${book.price.toFixed(2)}</p>
                    <button onclick="addToCart(${book.id})">Add to Cart</button>
                </div>
            `).join("");
        })
        .catch((err) => {
            console.error("Error fetching books:", err.message);
        });
}

// Add to Cart
function addToCart(bookId) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    fetch('/api/books')
        .then((response) => response.json())
        .then((books) => {
            const book = books.find((b) => b.id === bookId);
            if (!book) {
                alert("Book not found!");
                return;
            }

            const existingItem = cart.find((item) => item.id === book.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ ...book, quantity: 1 });
            }

            localStorage.setItem("cart", JSON.stringify(cart));
            alert(`${book.title} added to cart!`);
        })
        .catch((err) => {
            console.error("Error adding book to cart:", err.message);
        });
}

// Load Cart Items and Display Payment Form
function loadCart() {
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (!cartItems || !cartTotal) return;

    cartItems.innerHTML = "";
    let total = 0;

    cart.forEach((item) => {
        const div = document.createElement("div");
        div.innerHTML = `
            <div class="cart-item">
                <img src="images/book${item.id}.jpg" alt="${item.title}" class="cart-item-image">
                <div>
                    <p><strong>${item.title}</strong></p>
                    <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
                </div>
                <button onclick="removeFromCart(${item.id})" class="remove-btn">Remove</button>
            </div>
        `;
        cartItems.appendChild(div);
        total += item.price * item.quantity;
    });

    cartTotal.textContent = total.toFixed(2);
}

// Remove an Item from Cart
function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter((item) => item.id !== id);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

// Setup Stripe Payment Element
async function setupStripe() {
    console.log("Initializing Stripe...");

    try {
        stripe = Stripe("pk_test_51QTe37Ggb0HFI2Kds6PSqpz16jtA1xmKi0xA1QKS94hGE9tXsl8xhJMKvohDz8cH0poT8DBw9csKoeUsgM1aRWVz00IJBWE6EK");

        console.log("Stripe instance created:", stripe);

        const response = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customerId: 1, // Example customer ID
                items: JSON.parse(localStorage.getItem("cart")) || [],
            }),
        });

        if (!response.ok) {
            throw new Error(`Checkout API returned status ${response.status}`);
        }

        const { clientSecret } = await response.json();
        console.log("Client Secret received:", clientSecret);

        elements = stripe.elements({ clientSecret });
        const paymentElement = elements.create("payment");
        paymentElement.mount("#payment-form");
        console.log("Stripe payment element mounted successfully.");
    } catch (error) {
        console.error("Error during Stripe setup:", error.message);
    }
}


// Handle Payment Submission
async function handlePayment() {
    const paymentStatus = document.getElementById("payment-status");
    paymentStatus.textContent = "Processing payment...";

    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: `${window.location.origin}/confirmation.html`,
        },
    });

    if (error) {
        paymentStatus.textContent = `Payment failed: ${error.message}`;
    } else {
        paymentStatus.textContent = "Payment successful! Redirecting...";
    }
}
//admin button
async function checkAdminStatus() {
    const response = await fetch("/api/admin/status");
    const data = await response.json();

    if (data.isAdmin) {
        document.getElementById("admin-button").style.display = "inline";
    }
}

// Run on page load
document.addEventListener("DOMContentLoaded", () => {
    checkAdminStatus();
});
// Function to check if the user is an admin
async function checkAdminStatus() {
    const response = await fetch("/api/admin/status");
    const data = await response.json();

    if (data.isAdmin) {
        document.getElementById("admin-button").style.display = "inline";
    }
}

// Run on page load
document.addEventListener("DOMContentLoaded", () => {
    checkAdminStatus();
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname;

    if (currentPage.includes("index.html")) {
        loadBooks(); // Load books on the homepage
    }

    if (currentPage.includes("cart.html")) {
        loadCart();
        setupStripe();
    }
});

document.getElementById("submit-payment")?.addEventListener("click", handlePayment);
