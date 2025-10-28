const Cart = {
    get() {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    },
    
    save(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    },
    
    clear() {
        localStorage.setItem('cart', '[]');
        this.render();
    },
    
    remove(id) {
        let cart = this.get();
        cart = cart.filter(item => item.id !== id);
        this.save(cart);
        this.render();
    },
    
    updateQty(id, change) {
        let cart = this.get();
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity = Math.max(1, (item.quantity || 1) + change);
            this.save(cart);
            this.render();
        }
    },
    
    total() {
        return this.get().reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    },
    
    async checkout() {
        const cart = this.get();
        const btn = document.getElementById('checkout-btn');
        const total = this.total();
        
        if (!cart.length) {
            alert('Cart is empty!');
            return;
        }
        
        const token = localStorage.getItem('jwt');
        
        // Check if user is logged in
        if (!token) {
            // Mock mode for demo
            await this.mockCheckout(cart, total);
            return;
        }
        
        // Real purchase with database
        btn.disabled = true;
        btn.textContent = 'Processing...';
        
        try {
            const res = await fetch('/api/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ items: cart })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                alert(`✅ Purchase Successful!\n\n` +
                      `Items purchased: ${data.items_purchased}\n` +
                      `Total spent: ${data.total_spent} points\n` +
                      `Previous balance: ${data.previous_balance} points\n` +
                      `New balance: ${data.new_balance} points`);
                this.clear();
                
                // Reload balance on market page if it exists
                if (window.loadUserBalance) {
                    window.loadUserBalance();
                }
            } else {
                alert(`❌ Purchase Failed\n\n${data.error}`);
            }
        } catch (error) {
            console.error('Purchase error:', error);
            alert('Purchase failed. Please try again.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Checkout';
        }
    },
    
    // Mock checkout for demo mode (no login)
    async mockCheckout(cart, total) {
        const btn = document.getElementById('checkout-btn');
        btn.disabled = true;
        btn.textContent = 'Processing...';
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockBalance = 50000;
        const newBalance = mockBalance - total;
        
        if (total > mockBalance) {
            alert(`Insufficient balance!\n\nRequired: ${total} points\nYou have: ${mockBalance} points\nShortfall: ${total - mockBalance} points`);
        } else {
            alert(`✅ Purchase Successful! (DEMO MODE)\n\n` +
                  `Items purchased: ${cart.length}\n` +
                  `Total spent: ${total} points\n` +
                  `Previous balance: ${mockBalance} points\n` +
                  `New balance: ${newBalance} points\n\n` +
                  `(Login for real purchases)`);
            this.clear();
        }
        
        btn.disabled = false;
        btn.textContent = 'Checkout';
    },
    
    render() {
        const cart = this.get();
        const container = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total');
        const btn = document.getElementById('checkout-btn');
        
        if (!cart.length) {
            container.innerHTML = '<p class="empty-message">Your cart is empty</p>';
            totalEl.textContent = '0';
            btn.disabled = true;
            return;
        }
        
        btn.disabled = false;
        
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.title}" class="item-image">
                <div class="item-details">
                    <h3>${item.title}</h3>
                    <p class="price">${item.price} points each</p>
                    <div class="item-quantity">
                        <button class="quantity-btn" onclick="Cart.updateQty(${item.id}, -1)">−</button>
                        <span class="quantity-display">${item.quantity || 1}</span>
                        <button class="quantity-btn" onclick="Cart.updateQty(${item.id}, 1)">+</button>
                    </div>
                </div>
                <button class="remove-btn" onclick="Cart.remove(${item.id})">Remove</button>
            </div>
        `).join('');
        
        totalEl.textContent = this.total().toLocaleString();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Cart.render();
    document.getElementById('checkout-btn').addEventListener('click', () => Cart.checkout());
});