// Book Data
const books = [
    { id: 1, title: "The Great Gatsby", price: 10.99, image: "images/book1.jpg" },
    { id: 2, title: "To Kill a Mockingbird", price: 12.99, image: "images/book2.jpg" },
    { id: 3, title: "1984", price: 15.99, image: "images/book3.jpg" },
    { id: 4, title: "Pride and Prejudice", price: 9.99, image: "images/book4.jpg" },
    { id: 5, title: "Moby-Dick", price: 11.99, image: "images/book5.jpg" },
    { id: 6, title: "The Catcher in the Rye", price: 13.99, image: "images/book6.jpg" },
    { id: 7, title: "Brave New World", price: 14.99, image: "images/book7.jpg" },
    { id: 8, title: "Animal Farm", price: 8.99, image: "images/book8.jpg" },
    { id: 9, title: "The Hobbit", price: 16.99, image: "images/book9.jpg" },
    { id: 10, title: "The Lord of the Rings", price: 19.99, image: "images/book10.jpg" },
];

// Cart Storage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Load Books
function loadBooks() {
    const bookList = document.getElementById("book-list");
    bookList.innerHTML = books.map(book => `
        <div class="book">
            <img src="${book.image}" alt="${book.title}">
            <h4>${book.title}</h4>
            <p>$${book.price.toFixed(2)}</p>
            <button onclick="addToCart(${book.id})">Add to Cart</button>
        </div>
    `).join("");
}

// Search Filter
function filterBooks() {
    const query = document.getElementById("search-bar").value.toLowerCase();
    const filteredBooks = books.filter(book => book.title.toLowerCase().includes(query));
    const bookList = document.getElementById("book-list");
    bookList.innerHTML = filteredBooks.map(book => `
        <div class="book">
            <img src="${book.image}" alt="${book.title}">
            <h4>${book.title}</h4>
            <p>$${book.price.toFixed(2)}</p>
            <button onclick="addToCart(${book.id})">Add to Cart</button>
        </div>
    `).join("");
}

// Add to Cart
function addToCart(id) {
    const book = books.find(book => book.id === id);
    const cartItem = cart.find(item => item.id === id);
    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        cart.push({ ...book, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${book.title} added to cart!`);
}

// Load Cart
function loadCart() {
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    cartItems.innerHTML = "";

    let total = 0;
    cart.forEach(item => {
        const div = document.createElement("div");
        div.innerHTML = `
            <p>${item.title} - $${item.price.toFixed(2)} x ${item.quantity}</p>
            <button onclick="removeFromCart(${item.id})">Remove</button>
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

    alert("Thank you for your purchase! Your cart will now be cleared.");
    cart = [];
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

document.getElementById("checkout")?.addEventListener("click", checkout);

document.addEventListener("DOMContentLoaded", () => {
    loadBooks();
    loadCart();
});
