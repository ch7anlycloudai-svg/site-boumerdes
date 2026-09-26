/**
 * Main Server File
 * Mauritanian Students Union Website - Backend
 */

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const dotenvResult = require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
if (dotenvResult.error) {
    console.error('WARNING: .env file not found at', path.join(__dirname, '.env'));
    console.error('Database connection will use fallback values (may fail if credentials are missing).');
} else {
    console.log('.env loaded successfully from', path.join(__dirname, '.env'));
    console.log('.env parsed keys:', Object.keys(dotenvResult.parsed || {}).join(', '));
    console.log('SUPABASE_URL after dotenv:', process.env.SUPABASE_URL ? 'SET (' + process.env.SUPABASE_URL.substring(0, 20) + '...)' : 'NOT SET');
    console.log('SUPABASE_SERVICE_ROLE_KEY after dotenv:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET (hidden)' : 'NOT SET');
}

// Import database initialization
const { initializeDatabase, getSeedStatus, forceReseed } = require('./models/database');

// Import routes
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const messagesRoutes = require('./routes/messages');
const pagesRoutes = require('./routes/pages');
const mediaRoutes = require('./routes/media');
const galleryRoutes = require('./routes/gallery');
const universitiesRoutes = require('./routes/universities');

// Create Express app
const app = express();

// ======================
// MIDDLEWARE
// ======================

// CORS configuration - in production, same-origin requests don't need CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (same-origin, mobile apps, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'production') {
            callback(null, true);
        } else {
            callback(null, true); // Allow all in development
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy MUST be set BEFORE session middleware (Hostinger uses reverse proxy)
if (isProduction) {
    app.set('trust proxy', 1);
}

app.use(session({
    secret: process.env.SESSION_SECRET || 'mauritania-union-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Hostinger shared hosting may not forward HTTPS properly — keep false
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'lax' // 'strict' can block cookies on cross-origin redirects
    },
    proxy: isProduction // Trust the reverse proxy in production
}));

// ======================
// STATIC FILES
// ======================

// Redirect legacy /assets/uploads/* URLs to Supabase Storage
app.get('/assets/uploads/*', (req, res) => {
    const storagePath = req.path.replace('/assets/uploads/', '');
    const supabaseUrl = process.env.SUPABASE_URL;
    if (supabaseUrl) {
        res.redirect(301, `${supabaseUrl}/storage/v1/object/public/uploads/${storagePath}`);
    } else {
        res.status(404).json({ success: false, message: 'File not found' });
    }
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ======================
// API ROUTES
// ======================

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/universities', universitiesRoutes);

// ======================
// FRONTEND ROUTES
// ======================

// Guide sub-pages
app.get('/guide/registration', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'guide-registration.html'));
});
app.get('/guide/documents', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'guide-documents.html'));
});
app.get('/guide/travel', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'guide-travel.html'));
});
app.get('/guide/living', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'guide-living.html'));
});

const pages = ['about', 'news', 'guide', 'universities', 'institutes', 'services', 'contact'];

pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'frontend', `${page}.html`));
    });
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/admin/*', (req, res) => {
    const adminPage = req.path.replace('/admin/', '').replace('/admin', '');
    const htmlFile = adminPage ? `${adminPage}.html` : 'index.html';
    res.sendFile(path.join(__dirname, 'admin', htmlFile), (err) => {
        if (err) {
            res.sendFile(path.join(__dirname, 'admin', 'index.html'));
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ======================
// DIAGNOSTIC ENDPOINT
// ======================

let dbStatus = { connected: false, error: null, timestamp: null };

app.get('/api/health', async (req, res) => {
    const seedStatus = await getSeedStatus();
    res.json({
        server: 'running',
        timestamp: new Date().toISOString(),
        node_version: process.version,
        env: process.env.NODE_ENV || 'development',
        cwd: process.cwd(),
        dirname: __dirname,
        db: dbStatus,
        seed: seedStatus,
        env_loaded: {
            SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'NOT SET',
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set (hidden)' : 'NOT SET',
            SESSION_SECRET: process.env.SESSION_SECRET ? 'set' : 'NOT SET'
        },
        supabase_installed: (() => {
            try { require.resolve('@supabase/supabase-js'); return true; } catch(e) { return false; }
        })()
    });
});

// Storage diagnostic endpoint
app.get('/api/storage-check', async (req, res) => {
    try {
        const { getClient } = require('./models/database');
        const supabase = getClient();

        // List buckets
        const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
        if (bucketsErr) {
            return res.json({ success: false, error: 'listBuckets failed: ' + bucketsErr.message });
        }

        const uploadsBucket = buckets.find(b => b.name === 'uploads');

        // Try test upload
        let testUpload = { success: false };
        if (uploadsBucket) {
            const testPath = '_test/diag-' + Date.now() + '.txt';
            const { error: upErr } = await supabase.storage
                .from('uploads')
                .upload(testPath, Buffer.from('test'), { contentType: 'text/plain', upsert: true });
            if (upErr) {
                testUpload = { success: false, error: upErr.message, statusCode: upErr.statusCode, details: JSON.stringify(upErr) };
            } else {
                const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(testPath);
                await supabase.storage.from('uploads').remove([testPath]);
                testUpload = { success: true, publicUrl: urlData.publicUrl };
            }
        }

        res.json({
            buckets: buckets.map(b => ({ name: b.name, public: b.public, created_at: b.created_at })),
            uploadsBucket: uploadsBucket ? { exists: true, public: uploadsBucket.public, file_size_limit: uploadsBucket.file_size_limit, allowed_mime_types: uploadsBucket.allowed_mime_types } : { exists: false },
            testUpload
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

// Force bucket to public
app.get('/api/fix-bucket', async (req, res) => {
    try {
        const { getClient } = require('./models/database');
        const supabase = getClient();

        const { error } = await supabase.storage.updateBucket('uploads', {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        });

        if (error) {
            return res.json({ success: false, error: error.message, details: JSON.stringify(error) });
        }

        // Verify
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucket = buckets.find(b => b.name === 'uploads');

        res.json({ success: true, message: 'Bucket updated to public', bucket: { public: bucket.public, file_size_limit: bucket.file_size_limit, allowed_mime_types: bucket.allowed_mime_types } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Force re-seed endpoint (creates admin + default content if missing)
app.get('/api/reseed', async (req, res) => {
    try {
        const result = await forceReseed();
        res.json({ success: true, message: 'Re-seeded successfully', seed: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
});

// ======================
// ERROR HANDLING
// ======================

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack || err);
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error';
    res.status(500).json({ success: false, message });
});

// ======================
// START SERVER
// ======================

const PORT = process.env.PORT || 3000;

// Start server FIRST, then try database
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log('  Mauritanian Students Union Website');
    console.log('='.repeat(50));
    console.log(`  Server running on port: ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Database: Supabase (PostgreSQL)`);
    console.log('='.repeat(50));

    // Now try to connect to database
    initializeDatabase()
        .then(() => {
            dbStatus = { connected: true, error: null, timestamp: new Date().toISOString() };
            console.log('Database initialized successfully');
        })
        .catch((error) => {
            dbStatus = { connected: false, error: error.message, stack: error.stack, timestamp: new Date().toISOString() };
            console.error('Database initialization failed:', error.message);
            console.error('Server is running but database is not connected.');
            console.error('Visit /api/health to see diagnostics.');
        });
});

module.exports = app;
