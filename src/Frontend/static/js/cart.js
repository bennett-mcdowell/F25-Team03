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
        
        btn.disabled = true;
        btn.textContent = 'Processing...';
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock success response
        const mockBalance = 50000;
        const newBalance = mockBalance - total;
        
        if (total > mockBalance) {
            alert(`Insufficient balance!\n\nRequired: ${total} points\nYou have: ${mockBalance} points\nShortfall: ${total - mockBalance} points`);
            btn.disabled = false;
            btn.textContent = 'Checkout';
            return;
        }
        
        alert(`✅ Purchase Successful!\n\n` +
              `Items purchased: ${cart.length}\n` +
              `Total spent: ${total} points\n` +
              `Previous balance: ${mockBalance} points\n` +
              `New balance: ${newBalance} points\n\n` +
              `(This is a DEMO - no database connected)`);
        
        this.clear();
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
        
        totalEl.textContent = this.total();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Cart.render();
    document.getElementById('checkout-btn').addEventListener('click', () => Cart.checkout());
});