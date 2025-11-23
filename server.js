import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import multer from 'multer';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

await connectDB(); // ensure DB connection before starting

const app = express();
const PORT = process.env.PORT || 3000;

// JSON middleware
app.use(express.json());

// Serve static site files (admin/public pages)
app.use(express.static(path.join(__dirname)));
// Serve uploaded files from /uploads -> public/uploads
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Setup multer for image uploads (files stored in public/uploads)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const safe = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const ext = path.extname(file.originalname);
    cb(null, `${safe}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

import prisma from './src/prisma.js';

// Simple health/test route
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Server + Prisma working' });
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

// Create product with images upload
app.post('/api/products', upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, price, status } = req.body;
    const images = (req.files || []).map(f => `/uploads/${path.basename(f.path)}`);
    const created = await prisma.product.create({
      data: {
        title: title || 'Untitled',
        description: description || null,
        price: price ? parseFloat(price) : 0,
        images,
        status: status || null
      }
    });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (allow images to be added)
app.put('/api/products/:id', upload.array('images', 10), async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, price, status } = req.body;
    const files = (req.files || []).map(f => `/uploads/${path.basename(f.path)}`);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const images = [ ...(existing.images || []), ...files ];
    const updated = await prisma.product.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        description: description ?? existing.description,
        price: price ? parseFloat(price) : existing.price,
        status: status ?? existing.status,
        images
      }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await prisma.product.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Fallback: serve index.html for unknown routes (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
