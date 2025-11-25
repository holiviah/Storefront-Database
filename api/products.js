// Vercel serverless function for /api/products
import { put } from '@vercel/blob';

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

// Helper to parse Vercel's multipart request body
async function parseFormData(req) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return { fields: {}, files: [] };
  }

  // Vercel provides body as buffer, we need to parse it manually
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  
  // Parse multipart boundary
  const boundary = contentType.split('boundary=')[1];
  if (!boundary) return { fields: {}, files: [] };

  const parts = buffer.toString('binary').split(`--${boundary}`);
  const fields = {};
  const files = [];

  for (const part of parts) {
    if (!part || part === '--\r\n' || part === '--') continue;
    
    const [headerSection, ...bodyParts] = part.split('\r\n\r\n');
    if (!headerSection) continue;
    
    const bodyContent = bodyParts.join('\r\n\r\n').replace(/\r\n$/, '');
    
    // Parse headers
    const nameMatch = headerSection.match(/name="([^"]+)"/);
    const filenameMatch = headerSection.match(/filename="([^"]+)"/);
    const contentTypeMatch = headerSection.match(/Content-Type: (.+)/);
    
    if (!nameMatch) continue;
    const fieldName = nameMatch[1];
    
    if (filenameMatch) {
      // It's a file
      const filename = filenameMatch[1];
      const mimeType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
      const fileBuffer = Buffer.from(bodyContent, 'binary');
      
      files.push({
        fieldname: fieldName,
        originalname: filename,
        mimetype: mimeType,
        buffer: fileBuffer
      });
    } else {
      // It's a regular field
      fields[fieldName] = bodyContent;
    }
  }

  return { fields, files };
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
        const { fields, files } = await parseFormData(req);
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
