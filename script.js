// Simple product dashboard interactions (no backend)
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Determine whether this is the public or admin page.
        const isPublic = window.location.pathname.includes('public.html') || document.getElementById('product-grid') !== null;
        const isAdmin = window.location.pathname.includes('admin.html') || document.getElementById('productsGrid') !== null;
        // If it's a public page and NOT the admin UI, initialize public logic and stop.
        if (isPublic && !isAdmin) {
            initializePage();
            return;
        }
    } catch (err) {
        console.error('Initialization error (non-fatal):', err);
    }
    // global error handler to show friendly message instead of blank page
    window.addEventListener('error', (e) => {
        try {
            console.error('Unhandled error:', e.error || e.message || e);
            let banner = document.getElementById('js-error-banner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'js-error-banner';
                banner.style.position = 'fixed';
                banner.style.left = '12px';
                banner.style.right = '12px';
                banner.style.top = '12px';
                banner.style.zIndex = 9999;
                banner.style.background = '#ffe6e6';
                banner.style.color = '#611';
                banner.style.padding = '10px 14px';
                banner.style.border = '1px solid #f5c2c2';
                banner.style.borderRadius = '8px';
                banner.textContent = 'A script error occurred — check the console for details.';
                document.body.appendChild(banner);
            }
        } catch (inner) { console.error(inner); }
    });

	const productsGrid = document.getElementById('productsGrid');
	const productTemplate = document.getElementById('product-template');
	const quickEditBtn = document.getElementById('quickEditBtn');
	const arrangeBtn = document.getElementById('arrangeBtn');
	const searchInput = document.getElementById('search');

	if (!productsGrid) return; // Exit if not on admin page

	let quickEditMode = false;

    // products will be loaded from the server; fallback to local seeds if offline
    let products = [];
    // selectedFiles holds files the user has chosen (supports incremental adds/removes)
    let selectedFiles = [];
    const localSeeds = [
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

        products.filter(p => (p.title || '').toLowerCase().includes(query)).forEach(p => {
			const node = productTemplate.content.cloneNode(true);
			const card = node.querySelector('.product-card');
			card.dataset.id = p.id;
			
			// Replace placeholder div with actual image
			const thumb = card.querySelector('.thumb');
			thumb.innerHTML = `
                <img src="${p.images && p.images.length ? p.images[0] : (p.image || 'img/placeholder.png')}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">
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
        // SPA: Hide dashboard, show edit-product section
        document.querySelector('.products-grid').style.display = 'none';
        document.body.classList.add('hide-dashboard');
        const editSection = document.getElementById('editProductSection');
        if(editSection) editSection.style.display = 'block';
    }

    // SPA: Back to dashboard from edit-product
    document.addEventListener('click', function(e){
        if(e.target && e.target.id === 'backToDashboard'){
            document.querySelector('.products-grid').style.display = '';
            document.body.classList.remove('hide-dashboard');
            const editSection = document.getElementById('editProductSection');
            if(editSection) editSection.style.display = 'none';
        }
    });

    // load products from server
    async function loadProducts(){
        try{
            const res = await fetch('/api/products');
            if(!res.ok) throw new Error('failed');
            products = await res.json();
        }catch(e){
            // fallback to local storage or seeds
            products = getProducts();
            if(!products || !products.length) products = localSeeds;
        }
        render();
    }

    // form elements (declare early to avoid TDZ errors)
    const editForm = document.getElementById('editForm');
    const saveBtn = document.querySelector('.edit-actions .btn-primary');

    // category and variation state
    let categories = [];
    let variations = [];

    // category/variation UI logic
    const categoryInput = document.getElementById('categoryInput');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryChips = document.getElementById('categoryChips');
    const variationInput = document.getElementById('variationInput');
    const addVariationBtn = document.getElementById('addVariationBtn');
    const variationChips = document.getElementById('variationChips');

    function renderChips(list, container, type) {
        container.innerHTML = '';
        list.forEach((item, idx) => {
            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.textContent = item;
            const rm = document.createElement('button');
            rm.type = 'button';
            rm.className = 'chip-remove';
            rm.innerHTML = '×';
            rm.title = 'Remove';
            rm.onclick = () => {
                list.splice(idx, 1);
                renderChips(list, container, type);
            };
            chip.appendChild(rm);
            container.appendChild(chip);
        });
    }

    if (addCategoryBtn && categoryInput && categoryChips) {
        addCategoryBtn.onclick = () => {
            const val = categoryInput.value.trim();
            if (val && !categories.includes(val)) {
                categories.push(val);
                renderChips(categories, categoryChips, 'category');
                categoryInput.value = '';
            }
        };
        categoryInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); addCategoryBtn.click(); }
        });
    }
    if (addVariationBtn && variationInput && variationChips) {
        addVariationBtn.onclick = () => {
            const val = variationInput.value.trim();
            if (val && !variations.includes(val)) {
                variations.push(val);
                renderChips(variations, variationChips, 'variation');
                variationInput.value = '';
            }
        };
        variationInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); addVariationBtn.click(); }
        });
    }

    // reset chips on form reset
    if (editForm) {
        editForm.addEventListener('reset', () => {
            categories = [];
            variations = [];
            renderChips(categories, categoryChips, 'category');
            renderChips(variations, variationChips, 'variation');
        });
    }

    // handle form submit for creating product
    if (editForm && saveBtn) {
        saveBtn.addEventListener('click', async (ev) => {
            ev.preventDefault();
                // build FormData manually so we can append all selectedFiles
                const formData = new FormData();
                // append text fields from form
                const fields = ['title','description','price','currency','shipping','shippingType','status'];
                fields.forEach(name => {
                    const el = editForm.querySelector(`[name="${name}"]`);
                    if (el) formData.append(name, el.value);
                });
                // append images collected in selectedFiles
                if (Array.isArray(selectedFiles) && selectedFiles.length) {
                    selectedFiles.forEach(f => formData.append('images', f));
                }
                // append categories and variations as arrays
                categories.forEach(cat => formData.append('categories[]', cat));
                variations.forEach(vari => formData.append('variations[]', vari));
            try {
                // attempt to POST to the same origin first
                let res;
                try {
                    res = await fetch('/api/products', { method: 'POST', body: formData });
                } catch (networkErr) {
                    // if we're likely running the static Live Server (port 5500), try the backend at localhost:3000
                    console.warn('Primary POST failed, retrying against http://localhost:3000', networkErr);
                    try {
                        res = await fetch('http://localhost:3000/api/products', { method: 'POST', body: formData });
                    } catch (retryErr) {
                        throw retryErr;
                    }
                }

                if (!res || !res.ok) {
                    // try to read server error details
                    let text;
                    try { text = await res.text(); } catch (e) { text = String(e); }
                    throw new Error('Save failed: ' + (res ? `${res.status} ${res.statusText} - ${text}` : 'no response'));
                }
                const created = await res.json();
                // close edit view
                document.querySelector('.products-grid').style.display = '';
                document.body.classList.remove('hide-dashboard');
                const editSection = document.getElementById('editProductSection');
                if(editSection) editSection.style.display = 'none';
                // refresh product list from server so new item appears
                await loadProducts();
                // clear form and previews
                editForm.reset();
                const previews = document.querySelectorAll('.upload-preview');
                previews.forEach(p => p.remove());
                // clear in-memory selected files
                if (Array.isArray(selectedFiles)) selectedFiles.length = 0;
                alert('Product saved');
            } catch (err) {
                console.error(err);
                alert('Save failed');
            }
        });
    }

    // make the visible dropzone open the hidden file input and handle drag/drop and previews
    const dropzone = document.querySelector('.upload-dropzone');
    const fileInput = document.getElementById('images');
    if (dropzone && fileInput) {
        // create a preview container and insert it below the upload box (outside the `.upload-large`)
        const previewContainer = document.createElement('div');
        previewContainer.className = 'upload-previews';
        const uploadLarge = dropzone.closest('.upload-large');
        if (uploadLarge && uploadLarge.parentElement) uploadLarge.insertAdjacentElement('afterend', previewContainer);
        else dropzone.parentElement.appendChild(previewContainer);

        // keep an array of selected files so users can add more files incrementally and remove before upload

        function showPreviews(){
            // remove existing
            previewContainer.innerHTML = '';
            selectedFiles.slice(0, 20).forEach((file, idx) => {
                const url = URL.createObjectURL(file);
                const wrapper = document.createElement('div');
                wrapper.style.position = 'relative';
                const img = document.createElement('img');
                img.src = url;
                img.className = 'upload-preview';
                wrapper.appendChild(img);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'preview-remove';
                btn.title = 'Remove image';
                btn.innerText = '✕';
                btn.style.position = 'absolute';
                btn.style.top = '6px';
                btn.style.right = '6px';
                btn.style.background = 'rgba(0,0,0,0.6)';
                btn.style.color = '#fff';
                btn.style.border = 'none';
                btn.style.borderRadius = '12px';
                btn.style.width = '22px';
                btn.style.height = '22px';
                btn.style.cursor = 'pointer';
                btn.addEventListener('click', () => {
                    selectedFiles.splice(idx, 1);
                    showPreviews();
                });
                wrapper.appendChild(btn);
                previewContainer.appendChild(wrapper);
            });
        }

        function addFilesFromList(fileList){
            const arr = Array.from(fileList || []);
            arr.forEach(f => selectedFiles.push(f));
            showPreviews();
        }

        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            const dt = e.dataTransfer;
            if (dt && dt.files && dt.files.length) {
                addFilesFromList(dt.files);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (fileInput.files && fileInput.files.length) {
                addFilesFromList(fileInput.files);
                // clear native input so user can re-select same files later if needed
                fileInput.value = '';
            }
        });
    }

    quickEditBtn.addEventListener('click', () => {
        quickEditMode = !quickEditMode;
        quickEditBtn.textContent = quickEditMode ? 'Done' : 'Quick edit';
        // Toggle body class; CSS controls checkbox visibility
        document.body.classList.toggle('quick-edit-mode', quickEditMode);
    });

	arrangeBtn.addEventListener('click', () => {
		alert('Arrange shop — drag & drop would go here (not implemented)');
	});

	searchInput.addEventListener('input', () => render());

    // initial load
    loadProducts();

    // save products to localStorage when changed (optional)
    // saveProducts(products);
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

async function renderCategories() {
    const categoriesEl = document.getElementById('categories-list');
    if (!categoriesEl) return;
    
    try {
        const products = await getProducts();
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
    } catch (error) {
        console.error('Error rendering categories:', error);
        categoriesEl.innerHTML = '<div class="category-item active" data-category="all">All Products</div>';
    }
}

async function renderPublicGrid(filterCategory = 'all', searchQuery = '') {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    
    try {
        let products = await getProducts();
        
        // Apply filters
        if (filterCategory !== 'all') {
            products = products.filter(p => p.category === filterCategory);
        }
        
        if (searchQuery) {
            products = products.filter(p => 
                (p.name || p.title || '').toLowerCase().includes(searchQuery) ||
                (p.description || '').toLowerCase().includes(searchQuery)
            );
        }
        
        if (!products.length) {
            grid.innerHTML = '<p class="empty">No products found.</p>';
            return;
        }
        
        grid.innerHTML = products.map(product => `
            <a class="product-card" href="javascript:void(0)" onclick="navigateToProduct('${product._id}')">
                <img src="${product.image || 'img/placeholder.png'}" alt="${product.name || product.title}" />
                <div class="title">${escapeHtml(product.name || product.title)}</div>
                <div class="price">$${parseFloat(product.price).toFixed(2)}</div>
            </a>
        `).join('');
    } catch (error) {
        console.error('Error rendering products:', error);
        grid.innerHTML = '<p class="empty">Error loading products. Please try again.</p>';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// API functions
async function getProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

async function createProduct(productData) {
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
}

// Admin page functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Check if we're on the public page
    if (window.location.pathname.includes('public.html') || document.getElementById('product-grid')) {
        await initializePage();
        return;
    }

    // Admin page code
    const productsGrid = document.getElementById('productsGrid');
    const editSection = document.getElementById('editProductSection');
    const backBtn = document.getElementById('backToDashboard');
    
    if (!productsGrid) return;

    // Save button functionality
    const saveBtn = editSection?.querySelector('.btn-primary');
    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const form = editSection.querySelector('.edit-form');
            const productData = {
                name: form.querySelector('input[placeholder="Title"]').value,
                description: form.querySelector('textarea').value,
                price: form.querySelector('input[placeholder="$0.00"]').value,
                category: 'General'
            };

            try {
                await createProduct(productData);
                await render();
                hideEditSection();
                alert('Product saved successfully!');
            } catch (error) {
                alert('Error saving product: ' + error.message);
            }
        });
    }

    // ...existing code...
});

