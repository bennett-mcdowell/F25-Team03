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