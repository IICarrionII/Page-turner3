document.getElementById("admin-login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            // Server responds with success; redirect to admin.html
            window.location.href = "admin.html";
        } else {
            alert("Invalid credentials. Please try again.");
        }
    } catch (error) {
        console.error("Error during admin login:", error);
        alert("An error occurred. Please try again.");
    }
});
