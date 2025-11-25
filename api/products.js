// Vercel serverless function for /api/products
import { put } from '@vercel/blob';
import multiparty from 'multiparty';

// In-memory product store (replace with Prisma/DB for production)
let products = [
  {
    _id: '1',
    name: 'Sample Product',
    description: 'This is a sample product',
    price: 29.99,
    category: 'General',
    images: [],
    variations: [],
    createdAt: new Date().toISOString()
  }
];

// Helper to parse multipart form data
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    const fields = {};
    const files = [];

    form.on('field', (name, value) => {
      if (fields[name]) {
        if (Array.isArray(fields[name])) {
          fields[name].push(value);
        } else {
          fields[name] = [fields[name], value];
        }
      } else {
        fields[name] = value;
      }
    });

    form.on('part', (part) => {
      if (part.filename) {
        const chunks = [];
        part.on('data', (chunk) => chunks.push(chunk));
        part.on('end', () => {
          files.push({
            fieldname: part.name,
            originalname: part.filename,
            mimetype: part.headers['content-type'],
            buffer: Buffer.concat(chunks)
          });
        });
      } else {
        part.resume();
      }
    });

    form.on('close', () => resolve({ fields, files }));
    form.on('error', reject);
    form.parse(req);
  });
}

// Helper to upload buffer to Vercel Blob
async function uploadToBlob(buffer, filename) {
  const blob = await put(
    `products/${Date.now()}-${filename}`,
    buffer,
    {
      access: 'public',
      token: process.env.STOREFRONT_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN
    }
  );
  return blob.url;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/products
    if (req.method === 'GET') {
      return res.status(200).json(products);
    }

    // POST /api/products
    if (req.method === 'POST') {
      const contentType = req.headers['content-type'] || '';

      let body, imageUrls = [];

      if (contentType.includes('multipart/form-data')) {
        // Parse multipart form data
        const { fields, files } = await parseMultipart(req);
        body = fields;

        // Upload images to Vercel Blob
        if (files.length > 0) {
          const uploadPromises = files.map(file => 
            uploadToBlob(file.buffer, file.originalname)
          );
          imageUrls = await Promise.all(uploadPromises);
        }
      } else if (contentType.includes('application/json')) {
        // Parse JSON body
        body = req.body || {};
      } else {
        return res.status(400).json({ error: 'Unsupported content type' });
      }

      // Extract fields
      const title = body.title || body.name || 'Untitled Product';
      const description = body.description || '';
      const price = parseFloat(body.price) || 0;
      const category = body.category || 'General';
      const currency = body.currency || 'CAD';
      const shipping = body.shipping || '0';
      const shippingType = body.shippingType || 'domestic';
      const status = body.status || 'active';

      // Parse variations if provided as JSON string
      let variations = [];
      if (body.variations) {
        try {
          variations = typeof body.variations === 'string' 
            ? JSON.parse(body.variations) 
            : body.variations;
        } catch (e) {
          variations = [];
        }
      }

      // Parse categories
      let categories = [];
      if (body.categories) {
        categories = Array.isArray(body.categories) 
          ? body.categories 
          : [body.categories];
      }

      // Create product
      const product = {
        _id: Date.now().toString(),
        name: title,
        description,
        price,
        currency,
        shipping,
        shippingType,
        status,
        category,
        categories,
        images: imageUrls,
        variations,
        createdAt: new Date().toISOString()
      };

      products.push(product);
      return res.status(200).json(product);
    }

    // DELETE /api/products/:id
    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) {
        return res.status(400).json({ error: 'Missing product id' });
      }
      products = products.filter(p => p._id !== id);
      return res.status(200).json({ success: true });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
