document.addEventListener("DOMContentLoaded", () => {
    // Fetch user account data to get driver balance
    fetch('/api/account')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error("Error fetching account:", data.error);
                document.getElementById("pointsDisplay").textContent = "0";
                return;
            }

            if (data.role_name === "Driver" && data.role) {
                const balance = data.role.balance ?? 0;
                document.getElementById("pointsDisplay").textContent = balance;
            } else {
                // Fallback if not driver or missing role info
                document.getElementById("pointsDisplay").textContent = "0";
            }
        })
        .catch(err => {
            console.error("Failed to load driver balance:", err);
            document.getElementById("pointsDisplay").textContent = "0";
        });

    // Product catalog data
    const products = [
        { name: "Headphones", price: "15,000 points", img: staticBase + "headphones.jpg" },
        { name: "Ear Pods", price: "7,500 points", img: staticBase + "earpods.jpg" },
        { name: "Portable Charger", price: "3,000 points", img: staticBase + "portable_charger.jpg" },
    ];

    const catalogContainer = document.getElementById("productCatalog");

    products.forEach(product => {
        const card = document.createElement("div");
        card.classList.add("product-card");
        card.innerHTML = `
            <img src="${product.img}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.price}</p>
        `;
        catalogContainer.appendChild(card);
    });
});
