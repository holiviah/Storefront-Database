// Simple product dashboard interactions (no backend)
document.addEventListener('DOMContentLoaded', () => {
	const productsGrid = document.getElementById('productsGrid');
	const productTemplate = document.getElementById('product-template');
	const quickEditBtn = document.getElementById('quickEditBtn');
	const arrangeBtn = document.getElementById('arrangeBtn');
	const searchInput = document.getElementById('search');

	let quickEditMode = false;

	// seed some sample products
	let products = [
		{ id: cryptoRandomId(), title: 'Item 1', price: 19.99 },
		{ id: cryptoRandomId(), title: 'Item 2', price: 25.99 },
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
		// Show the edit product panel/modal instead of navigating
		const panel = document.getElementById('editProductPanel');
		if(panel) panel.style.display = 'flex';
	}

	// Hide the edit product panel when clicking the back arrow
	document.addEventListener('click', function(e){
		if(e.target && e.target.id === 'closeEditPanel'){
			const panel = document.getElementById('editProductPanel');
			if(panel) panel.style.display = 'none';
		}
	});

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

// hide checkboxes by default via CSS fallback
try{
	const style = document.createElement('style');
	style.innerHTML = '.product-card .select{display:none}';
	document.head.appendChild(style);
}catch(e){}

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
        <a class="product-card" href="product.html?id=${encodeURIComponent(product.id)}">
            <img src="${escapeHtml(product.image || 'img/revamp.png')}" alt="${escapeHtml(product.name)}" />
            <div class="title">${escapeHtml(product.name || product.title)}</div>
            <div class="price">$${escapeHtml(product.price)}</div>
        </a>
    `).join('');
}

