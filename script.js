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
});

// hide checkboxes by default via CSS fallback
try{
	const style = document.createElement('style');
	style.innerHTML = '.product-card .select{display:none}';
	document.head.appendChild(style);
}catch(e){}

