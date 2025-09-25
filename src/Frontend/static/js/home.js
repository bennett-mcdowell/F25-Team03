document.addEventListener("DOMContentLoaded", () => {
  // Example: Check login
  //const isLoggedIn = sessionStorage.getItem("loggedIn");
  //if (!isLoggedIn) {
   // window.location.href = "/login.html";
  //}

  // Example points, update to come from DB
  let userPoints = 1200;
  document.getElementById("pointsDisplay").textContent = userPoints;

  // Product catalog data
  const products = [
    { name: "Organic Apples", price: "$5", img: "https://via.placeholder.com/150" },
    { name: "Whole Grain Bread", price: "$3", img: "https://via.placeholder.com/150" },
    { name: "Fresh Milk", price: "$4", img: "https://via.placeholder.com/150" },
    { name: "Free-Range Eggs", price: "$6", img: "https://via.placeholder.com/150" },
    { name: "Local Honey", price: "$8", img: "https://via.placeholder.com/150" }
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

  //About page
  document.getElementById("aboutBtn").addEventListener("click", () => {
    window.location.href = "/about";
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("loggedIn");
    window.location.href = "/";
  });
});
