const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// Simple in-memory product store (replace with DB in production)
let products = [
    {
        _id: '1',
        name: 'Sample Product',
        description: 'This is a sample product',
        price: 29.99,
        category: 'General',
        images: [],
        variations: [],
        createdAt: new Date()
    }
];

// Multer disk storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
        cb(null, name);
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// GET products
app.get('/api/products', (req, res) => {
    res.json(products);
});

// POST product (multipart/form-data with images)
app.post('/api/products', upload.array('images'), (req, res) => {
    try {
        // fields may come from multipart or JSON fallback
        const body = req.body || {};
        const title = body.title || body.name || body.title || 'Untitled Product';
        const description = body.description || '';
        const price = parseFloat(body.price) || 0;
        const category = body.category || 'General';

        // parse variations if provided as JSON string
        let variations = [];
        if (body.variations) {
            try { variations = JSON.parse(body.variations); } catch (e) { variations = body.variations; }
        }

        const images = (req.files || []).map(f => `/uploads/${f.filename}`);

        const product = {
            _id: Date.now().toString(),
            name: title,
            description,
            price,
            category,
            images,
            variations,
            createdAt: new Date()
        };
        products.push(product);
        res.json(product);
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    products = products.filter(p => p._id !== id);
    res.json({ success: true });
});

// Serve static files from repo root for local testing (admin.html etc.)
app.use(express.static(path.join(__dirname)));

// 404 handler for everything else
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler (returns JSON always)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('API endpoints available:');
    console.log('  GET /api/products');
    console.log('  POST /api/products (multipart/form-data)');
    console.log('  DELETE /api/products/:id');
});
