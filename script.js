// Simple product dashboard interactions (no backend)
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the public page
    if (window.location.pathname.includes('public.html') || document.getElementById('product-grid')) {
        initializePage();
        return;
    }

	const productsGrid = document.getElementById('productsGrid');
	const productTemplate = document.getElementById('product-template');
	const quickEditBtn = document.getElementById('quickEditBtn');
	const arrangeBtn = document.getElementById('arrangeBtn');
	const searchInput = document.getElementById('search');

	if (!productsGrid) return; // Exit if not on admin page

	let quickEditMode = false;

	// seed some sample products
	let products = [
		{ id: cryptoRandomId(), title: 'Item 1', price: 19.99 },
		{ id: cryptoRandomId(), title: 'Blue Shirt', price: 24.0 },
		{ id: cryptoRandomId(), title: 'Sticker Pack', price: 5.5 }
	];

	function cryptoRandomId(){
		return Math.random().toString(36).slice(2,9)
	}

	function render(){
		productsGrid.innerHTML = '';

		// add product card
		const addCard = document.createElement('div');
		addCard.className = 'add-card';
		addCard.innerHTML = `<div style="text-align:center"><div class="plus">+</div><div>Add Product</div></div>`;
		addCard.addEventListener('click', onAddProduct);
		productsGrid.appendChild(addCard);

		const query = (searchInput.value || '').toLowerCase();

		products.filter(p => p.title.toLowerCase().includes(query)).forEach(p => {
			const node = productTemplate.content.cloneNode(true);
			const card = node.querySelector('.product-card');
			card.dataset.id = p.id;
			
			// Replace placeholder div with actual image
			const thumb = card.querySelector('.thumb');
			thumb.innerHTML = `
				<img src="${p.image || 'img/placeholder.png'}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">
				<input class="select" type="checkbox" />
			`;
			
			card.querySelector('.title').textContent = p.title;
			card.querySelector('.price').textContent = `$${p.price.toFixed(2)}`;
			const checkbox = card.querySelector('.select');
			checkbox.addEventListener('change', () => {
				if(quickEditMode){
					checkbox.parentElement.style.outline = checkbox.checked ? '2px solid #60a5fa' : 'none';
				}
			});
			productsGrid.appendChild(node);
		});
	}

	function onAddProduct(){
		// Navigate to the Edit/Add Product UI page (UI-only)
		window.location.href = 'edit-product.html';
	}

	quickEditBtn.addEventListener('click', () => {
		quickEditMode = !quickEditMode;
		quickEditBtn.textContent = quickEditMode ? 'Done' : 'Quick edit';
		document.querySelectorAll('.product-card .select').forEach(cb => cb.style.display = quickEditMode ? 'block' : 'none');
	});

	arrangeBtn.addEventListener('click', () => {
		alert('Arrange shop — drag & drop would go here (not implemented)');
	});

	searchInput.addEventListener('input', () => render());

	// initial render
	render();

	// save products to localStorage
	saveProducts(products);
});

const STORAGE_KEY = 'revamp_products';

function getProducts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function initializePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        showProductDetail(productId);
    } else {
        showProductGrid();
    }
}

function showProductGrid() {
    const gridView = document.getElementById('grid-view');
    const productView = document.getElementById('product-view');
    
    if (gridView) gridView.style.display = 'block';
    if (productView) productView.style.display = 'none';
    
    renderCategories();
    renderPublicGrid();
}

function showProductDetail(productId) {
    const product = getProducts().find(p => p.id === productId);
    
    if (!product) {
        showProductGrid();
        return;
    }
    
    const gridView = document.getElementById('grid-view');
    const productView = document.getElementById('product-view');
    
    if (gridView) gridView.style.display = 'none';
    if (productView) productView.style.display = 'block';
    
    // Populate product details
    const detailImage = document.getElementById('product-detail-image');
    const detailTitle = document.getElementById('product-detail-title');
    const detailPrice = document.getElementById('product-detail-price');
    const detailDescription = document.getElementById('product-detail-description');
    const backBtn = document.getElementById('back-btn');
    
    if (detailImage) {
        detailImage.src = product.image || 'img/placeholder.png';
        detailImage.alt = product.name || product.title;
    }
    if (detailTitle) detailTitle.textContent = product.name || product.title;
    if (detailPrice) detailPrice.textContent = `$${product.price}`;
    if (detailDescription) detailDescription.textContent = product.description || 'No description available.';
    
    // Back button functionality
    if (backBtn) {
        backBtn.onclick = function() {
            window.history.pushState({}, '', 'public.html');
            showProductGrid();
        };
    }
}

function renderCategories() {
    const categoriesEl = document.getElementById('categories-list');
    if (!categoriesEl) return;
    
    const products = getProducts();
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    
    categoriesEl.innerHTML = `
        <div class="category-item active" data-category="all">All Products</div>
        ${categories.map(cat => `<div class="category-item" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</div>`).join('')}
    `;
    
    categoriesEl.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            categoriesEl.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            renderPublicGrid(item.dataset.category);
        });
    });
}

function renderPublicGrid(filterCategory = 'all') {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    let products = getProducts();
    if (filterCategory !== 'all') {
        products = products.filter(p => p.category === filterCategory);
    }
    
    if (!products.length) {
        grid.innerHTML = '<p class="empty">No products available yet. Check back soon!</p>';
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <a class="product-card" href="javascript:void(0)" onclick="navigateToProduct('${product.id}')">
            <img src="${escapeHtml(product.image || 'img/placeholder.png')}" alt="${escapeHtml(product.name || product.title)}" />
            <div class="title">${escapeHtml(product.name || product.title)}</div>
            <div class="price">$${escapeHtml(product.price)}</div>
        </a>
    `).join('');
}

function navigateToProduct(productId) {
    window.history.pushState({}, '', `public.html?id=${encodeURIComponent(productId)}`);
    showProductDetail(productId);
}

// hide checkboxes by default via CSS fallback
try{
    const style = document.createElement('style');
    style.innerHTML = '.product-card .select{display:none}';
    document.head.appendChild(style);
}catch(e){}

