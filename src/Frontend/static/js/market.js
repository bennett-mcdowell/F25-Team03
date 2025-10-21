// Build category filters from products on page load
document.addEventListener('DOMContentLoaded', () => {
    buildCategoryFilters();
    setupFilterListeners();
});

// Build category filter buttons from existing products
function buildCategoryFilters() {
    const products = document.querySelectorAll('.product-item');
    const categories = new Set();
    const categoryCounts = {};
    
    // Collect unique categories and count products
    products.forEach(product => {
        const category = product.dataset.category;
        if (category) {
            categories.add(category);
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
    });
    
    // Create filter buttons
    const filterContainer = document.getElementById('categoryFilters');
    const sortedCategories = Array.from(categories).sort();
    
    sortedCategories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.dataset.category = category;
        btn.textContent = `${category} (${categoryCounts[category]})`;
        filterContainer.appendChild(btn);
    });
}

// Setup filter button click handlers
function setupFilterListeners() {
    document.getElementById('categoryFilters').addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            const category = e.target.dataset.category;
            filterByCategory(category);
        }
    });
}

// Filter products by category
function filterByCategory(selectedCategory) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === selectedCategory) {
            btn.classList.add('active');
        }
    });
    
    // Filter products
    const products = document.querySelectorAll('.product-item');
    let visibleCount = 0;
    
    products.forEach(product => {
        const productCategory = product.dataset.category;
        
        if (selectedCategory === 'all' || productCategory === selectedCategory) {
            product.classList.remove('hidden');
            visibleCount++;
        } else {
            product.classList.add('hidden');
        }
    });
    
    // Update product count
    const countEl = document.getElementById('productCount');
    if (countEl) {
        const displayCategory = selectedCategory === 'all' ? 'All Products' : selectedCategory;
        countEl.textContent = `${visibleCount} items in ${displayCategory}`;
    }
}

// Add to Cart functionality
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-btn')) {
        const btn = e.target;
        const product = {
            id: parseInt(btn.dataset.id),
            title: btn.dataset.title,
            price: parseInt(btn.dataset.price),
            image: btn.dataset.image,
            quantity: 1
        };
        
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find(item => item.id === product.id);
        
        if (existing) {
            existing.quantity++;
        } else {
            cart.push(product);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        alert('Added to cart!');
    }
});