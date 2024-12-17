// Load Books for Admin
function loadBooksForAdmin() {
    fetch("/api/books")
        .then((response) => response.json())
        .then((books) => {
            const booksTable = document.querySelector("#books-table tbody");
            booksTable.innerHTML = books.map(book => `
                <tr>
                    <td>${book.id}</td>
                    <td>${book.title}</td>
                    <td>${book.author}</td>
                    <td>$${book.price.toFixed(2)}</td>
                    <td>${book.stock}</td>
                    <td>${book.category}</td>
                    <td>
                        <button onclick="deleteBook(${book.id})">Delete</button>
                    </td>
                </tr>
            `).join("");
        });
}

// Add a New Book
function addBook() {
    const title = document.getElementById("book-title").value;
    const author = document.getElementById("book-author").value;
    const price = parseFloat(document.getElementById("book-price").value);
    const stock = parseInt(document.getElementById("book-stock").value, 10);
    const category = document.getElementById("book-category").value;

    fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, price, stock, category }),
    })
    .then(() => loadBooksForAdmin());
}

// Delete a Book
function deleteBook(id) {
    fetch(`/api/books/${id}`, { method: "DELETE" })
        .then(() => loadBooksForAdmin());
}

// Load Orders for Admin
function loadOrders() {
    fetch("/api/orders")
        .then((response) => response.json())
        .then((orders) => {
            const ordersTable = document.querySelector("#orders-table tbody");
            ordersTable.innerHTML = orders.map(order => `
                <tr>
                    <td>${order.order_id}</td>
                    <td>${order.customer_name} (${order.customer_email})</td>
                    <td>${order.books}</td>
                    <td>$${order.total.toFixed(2)}</td>
                    <td>${order.order_date}</td>
                </tr>
            `).join("");
        });
}
function fetchLowStock() {
    fetch("/api/books/low-stock")
        .then((response) => response.json())
        .then((books) => {
            const lowStockSection = document.getElementById("low-stock");
            if (books.length === 0) {
                lowStockSection.innerHTML = "<p>All books are well-stocked.</p>";
                return;
            }

            lowStockSection.innerHTML = `
                <h3>Low Stock Alert</h3>
                <ul>
                    ${books
                        .map(
                            (book) =>
                                `<li>${book.title} - Stock: ${book.stock}</li>`
                        )
                        .join("")}
                </ul>
            `;
        })
        .catch((err) => {
            console.error("Error fetching low stock books:", err);
        });
}

// Fetch low stock books on load
document.addEventListener("DOMContentLoaded", fetchLowStock);

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    loadBooksForAdmin();
    loadOrders();
});
