// Fetch Books from Backend
function loadBooks() {
    fetch('/api/books')
        .then(response => response.json())
        .then(books => {
            const bookList = document.getElementById("book-list");
            if (!bookList) return; // Only run this on pages with the book list

            bookList.innerHTML = books.map(book => `
                <div class="book">
                    <img src="images/book${book.id}.jpg" alt="${book.title}">
                    <h4>${book.title}</h4>
                    <p>$${book.price.toFixed(2)}</p>
                    <button onclick="addToCart(${book.id})">Add to Cart</button>
                </div>
            `).join("");
        })
        .catch(err => console.error("Error fetching books:", err));
}

// Cart Storage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Add to Cart
function addToCart(id) {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // Fetch book details from backend
        fetch(`/api/books`)
            .then(response => response.json())
            .then(books => {
                const book = books.find(b => b.id === id);
                if (book) {
                    cart.push({ ...book, quantity: 1 });
                    localStorage.setItem("cart", JSON.stringify(cart));
                    alert(`${book.title} added to cart!`);
                }
            })
            .catch(err => console.error("Error fetching book details:", err));
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

// Load Cart
function loadCart() {
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    if (!cartItems || !cartTotal) return; // Only run this on pages with the cart

    cartItems.innerHTML = "";

    let total = 0;
    cart.forEach(item => {
        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
            <img src="images/book${item.id}.jpg" alt="${item.title}" class="cart-item-image">
            <div>
                <p><strong>${item.title}</strong></p>
                <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
            </div>
            <button onclick="removeFromCart(${item.id})" class="remove-btn">Remove</button>
        `;
        cartItems.appendChild(div);
        total += item.price * item.quantity;
    });

    cartTotal.textContent = total.toFixed(2);
}

// Remove from Cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

// Checkout
function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    // Simulate checkout process (can be extended for backend integration)
    alert("Thank you for your purchase! Your cart will now be cleared.");
    cart = [];
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    loadBooks();
    loadCart();
});

document.getElementById("checkout")?.addEventListener("click", checkout);
