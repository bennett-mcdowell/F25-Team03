document.addEventListener('DOMContentLoaded', () => {
  // Load catalog with visibility toggles
  fetch('/api/sponsor/catalog')
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        console.error('Error:', data.error);
        document.getElementById('catalogList').innerHTML = '<p>Error loading catalog.</p>';
        return;
      }

      const products = data.products || [];
      const catalogList = document.getElementById('catalogList');
      catalogList.innerHTML = '';

      if (products.length === 0) {
        catalogList.innerHTML = '<p>No products available.</p>';
        return;
      }

      products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        const isHidden = product.is_hidden || false;
        const visibilityClass = isHidden ? 'hidden-product' : '';
        const buttonText = isHidden ? 'Show Product' : 'Hide Product';
        const buttonColor = isHidden ? '#28a745' : '#dc3545';

        productCard.innerHTML = `
          <div class="product-item ${visibilityClass}" style="${isHidden ? 'opacity: 0.5;' : ''}">
            <img src="${product.image}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p class="price">$${product.price}</p>
            <p class="category">${product.category}</p>
            <button 
              class="flat-button toggle-visibility-btn" 
              data-product-id="${product.id}"
              data-is-hidden="${isHidden}"
              style="background-color: ${buttonColor}; width: 100%;"
            >
              ${buttonText}
            </button>
          </div>
        `;

        catalogList.appendChild(productCard);
      });

      // Add toggle visibility listeners
      document.querySelectorAll('.toggle-visibility-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const productId = parseInt(btn.dataset.productId);
          const currentlyHidden = btn.dataset.isHidden === 'true';
          const newHiddenState = !currentlyHidden;

          try {
            const res = await fetch('/api/sponsor/catalog/toggle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_id: productId,
                is_hidden: newHiddenState
              })
            });

            const result = await res.json();
            if (res.ok) {
              // Update button and product card
              const productCard = btn.closest('.product-item');
              btn.dataset.isHidden = newHiddenState;
              
              if (newHiddenState) {
                btn.textContent = 'Show Product';
                btn.style.backgroundColor = '#28a745';
                productCard.style.opacity = '0.5';
                productCard.classList.add('hidden-product');
              } else {
                btn.textContent = 'Hide Product';
                btn.style.backgroundColor = '#dc3545';
                productCard.style.opacity = '1';
                productCard.classList.remove('hidden-product');
              }
            } else {
              alert(result.error || 'Failed to update product visibility');
            }
          } catch (err) {
            console.error('Error toggling visibility:', err);
            alert('Error updating product visibility');
          }
        });
      });
    })
    .catch(err => {
      console.error('Failed to load catalog:', err);
      document.getElementById('catalogList').innerHTML = '<p>Error loading catalog.</p>';
    });
});
