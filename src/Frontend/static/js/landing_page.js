document.addEventListener("DOMContentLoaded", () => {
    // Example points
    let userPoints = 1200;
    document.getElementById("pointsDisplay").textContent = userPoints;

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
