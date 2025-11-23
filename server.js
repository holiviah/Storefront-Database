const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

// In-memory storage for products
let products = [
    { 
        _id: '1', 
        name: 'Sample Product', 
        description: 'This is a sample product',
        price: 29.99,
        category: 'General',
        image: null,
        createdAt: new Date()
    }
];

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API Routes
    if (pathname === '/api/products') {
        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(products));
            return;
        }
        
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const productData = JSON.parse(body);
                    const product = {
                        _id: Date.now().toString(),
                        name: productData.name || 'Untitled Product',
                        description: productData.description || '',
                        price: parseFloat(productData.price) || 0,
                        category: productData.category || 'General',
                        image: productData.image || null,
                        createdAt: new Date()
                    };
                    products.push(product);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(product));
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON' }));
                }
            });
            return;
        }
    }

    if (pathname.startsWith('/api/products/') && req.method === 'DELETE') {
        const id = pathname.split('/')[3];
        products = products.filter(p => p._id !== id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // Static file serving
    let filePath = '.' + pathname;
    if (filePath === './') filePath = './index.html';

    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('API endpoints available:');
    console.log('  GET /api/products');
    console.log('  POST /api/products');
    console.log('  DELETE /api/products/:id');
});
