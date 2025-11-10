// Global state
let userBalance = 0;
let hiddenProducts = new Set();
let currentSponsorId = null;
let userSponsors = [];

// Load everything on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUserSponsors();
    buildCategoryFilters();
    setupFilterListeners();
    setupSponsorChangeListener();
});

// Load user's sponsors and select first one
async function loadUserSponsors() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        console.log('No token, hiding sponsor selector');
        document.getElementById('sponsor-selector-container').style.display = 'none';
        document.getElementById('user-balance').textContent = '0';
        return;
    }

    try {
        const response = await fetch('/api/driver/sponsors', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            userSponsors = data.sponsors || [];
            
            if (userSponsors.length === 0) {
                document.getElementById('sponsor-select').innerHTML = '<option value="">No sponsors available</option>';
                document.getElementById('user-balance').textContent = '0';
                return;
            }

            // Populate sponsor dropdown
            const select = document.getElementById('sponsor-select');
            select.innerHTML = userSponsors.map(sponsor => 
                `<option value="${sponsor.sponsor_id}">${sponsor.sponsor_name} (${Math.floor(sponsor.balance * 100).toLocaleString()} pts)</option>`
            ).join('');

            // Select first sponsor by default
            currentSponsorId = userSponsors[0].sponsor_id;
            select.value = currentSponsorId;
            
            // Load balance and hidden products for this sponsor
            updateBalanceDisplay();
            loadHiddenProducts();
        } else {
            console.error('Failed to load sponsors');
            document.getElementById('sponsor-selector-container').style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading sponsors:', error);
        document.getElementById('sponsor-selector-container').style.display = 'none';
    }
}

// Update balance display based on selected sponsor
function updateBalanceDisplay() {
    if (!currentSponsorId) {
        document.getElementById('user-balance').textContent = '0';
        return;
    }

    const sponsor = userSponsors.find(s => s.sponsor_id === currentSponsorId);
    if (sponsor) {
        userBalance = Math.floor(sponsor.balance * 100);
        document.getElementById('user-balance').textContent = userBalance.toLocaleString();
    }
}

// Handle sponsor selection change
function setupSponsorChangeListener() {
    const select = document.getElementById('sponsor-select');
    select.addEventListener('change', (e) => {
        currentSponsorId = parseInt(e.target.value);
        updateBalanceDisplay();
        loadHiddenProducts();
        
        // Save to localStorage for cart page
        localStorage.setItem('currentSponsorId', currentSponsorId);
    });
}

// Load hidden products for current driver (across all sponsors per Option A)
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
        } else {
            product.classList.remove('hidden');
        }
    });
    
    // Update product count
    updateProductCount();
}

// Hide a product (from ALL sponsors per Option A)
async function hideProduct(productId) {
    const token = localStorage.getItem('jwt');
    
    if (!token) {
        alert('Please log in to hide products');
        return;
    }

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
            const data = await response.json();
            hiddenProducts.add(productId);
            setTimeout(() => {
                if (productEl) {
                    productEl.classList.add('hidden');
                    productEl.classList.remove('being-hidden');
                }
                updateProductCount();
            }, 300);
            
            console.log(`Product hidden from ${data.applied_to_sponsors} sponsors`);
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
        if (confirm('Hide this product from your catalog? (This will hide it from all your sponsors)')) {
            hideProduct(productId);
        }
    }
    
    // Add to cart button
    if (e.target.classList.contains('add-to-cart-btn')) {
        if (!currentSponsorId) {
            alert('Please select a sponsor first');
            return;
        }
        
        const btn = e.target;
        const product = {
            id: parseInt(btn.dataset.id),
            title: btn.dataset.title,
            price: parseInt(btn.dataset.price),
            image: btn.dataset.image,
            quantity: 1,
            sponsor_id: currentSponsorId  // Add sponsor_id to cart item
        };
        
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        // Check if product already in cart with same sponsor
        const existing = cart.find(item => item.id === product.id && item.sponsor_id === currentSponsorId);
        
        if (existing) {
            existing.quantity++;
        } else {
            cart.push(product);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        alert('Added to cart!');
    }
});

// Expose functions globally
window.loadUserBalance = updateBalanceDisplay;
window.getCurrentSponsorId = () => currentSponsorId;