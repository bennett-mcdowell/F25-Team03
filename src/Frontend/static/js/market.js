// Global state
let userBalance = 0;
let hiddenProducts = new Set();

// Load balance, hidden products, and categories on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUserBalance();
    loadHiddenProducts();
    buildCategoryFilters();
    setupFilterListeners();
});

// Load user's point balance
async function loadUserBalance() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        console.log('No token, showing demo balance');
        document.getElementById('user-balance').textContent = '50,000 (Demo)';
        return;
    }

    try {
        const response = await fetch('/api/account', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Balance is in dollars, convert to points (*100)
            const balance = data.role?.balance || 0;
            userBalance = Math.floor(balance * 100);
            document.getElementById('user-balance').textContent = userBalance.toLocaleString();
        } else {
            console.log('Not logged in, showing demo balance');
            document.getElementById('user-balance').textContent = '50,000 (Demo)';
            userBalance = 50000;
        }
    } catch (error) {
        console.error('Error loading balance:', error);
        document.getElementById('user-balance').textContent = '50,000 (Demo)';
        userBalance = 50000;
    }
}

// Load hidden products for current driver
async function loadHiddenProducts() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        console.log('No token, skipping hidden products load');
        return;
    }

    try {
        const response = await fetch('/api/driver/catalog/hidden', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            hiddenProducts = new Set(data.hidden_products);
            
            // Hide products that driver has hidden
            applyHiddenProducts();
        }
    } catch (error) {
        console.error('Error loading hidden products:', error);
    }
}

// Apply hidden products to the catalog
function applyHiddenProducts() {
    document.querySelectorAll('.product-item').forEach(product => {
        const productId = parseInt(product.dataset.productId);
        if (hiddenProducts.has(productId)) {
            product.classList.add('hidden');
        }
    });
    
    // Update product count
    updateProductCount();
}

// Hide a product
async function hideProduct(productId) {
    const token = localStorage.getItem('jwt');
    
    // Demo mode - just hide locally
    if (!token) {
        hiddenProducts.add(productId);
        const productEl = document.querySelector(`[data-product-id="${productId}"]`);
        if (productEl) {
            productEl.classList.add('being-hidden');
            setTimeout(() => {
                productEl.classList.add('hidden');
                productEl.classList.remove('being-hidden');
                updateProductCount();
            }, 300);
        }
        alert('Product hidden (demo mode - not saved to database)');
        return;
    }

    // Real mode - save to database
    const productEl = document.querySelector(`[data-product-id="${productId}"]`);
    if (productEl) {
        productEl.classList.add('being-hidden');
    }

    try {
        const response = await fetch('/api/driver/catalog/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                product_id: productId,
                is_hidden: true
            })
        });

        if (response.ok) {
            hiddenProducts.add(productId);
            setTimeout(() => {
                if (productEl) {
                    productEl.classList.add('hidden');
                    productEl.classList.remove('being-hidden');
                }
                updateProductCount();
            }, 300);
        } else {
            if (productEl) {
                productEl.classList.remove('being-hidden');
            }
            alert('Failed to hide product');
        }
    } catch (error) {
        console.error('Error hiding product:', error);
        if (productEl) {
            productEl.classList.remove('being-hidden');
        }
        alert('Error hiding product');
    }
}

// Update visible product count
function updateProductCount() {
    const visibleProducts = document.querySelectorAll('.product-item:not(.hidden)').length;
    const countEl = document.getElementById('productCount');
    if (countEl) {
        countEl.textContent = `${visibleProducts} items available`;
    }
}

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
        const productId = parseInt(product.dataset.productId);
        const isHidden = hiddenProducts.has(productId);
        
        if (selectedCategory === 'all' || productCategory === selectedCategory) {
            if (!isHidden) {
                product.classList.remove('hidden');
                visibleCount++;
            }
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

// Event delegation for hide buttons and add to cart
document.addEventListener('click', (e) => {
    // Hide product button
    if (e.target.classList.contains('hide-product-btn')) {
        e.stopPropagation();
        const productId = parseInt(e.target.dataset.productId);
        if (confirm('Hide this product from your catalog?')) {
            hideProduct(productId);
        }
    }
    
    // Add to cart button
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

// Expose loadUserBalance globally so cart can refresh it
window.loadUserBalance = loadUserBalance;