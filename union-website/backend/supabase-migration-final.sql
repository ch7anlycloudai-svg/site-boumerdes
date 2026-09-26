-- ============================================
-- Supabase Migration - Final Production Schema
-- Arabic-Only Architecture
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
--
-- WARNING: This migration DROPS all existing tables and recreates them.
-- All existing data will be lost. Only run on a fresh database
-- or when you are ready to start fresh.
-- ============================================

-- ============================================
-- DROP EXISTING TABLES (clean slate)
-- ============================================
DROP TABLE IF EXISTS page_content CASCADE;
DROP TABLE IF EXISTS hero_slides CASCADE;
DROP TABLE IF EXISTS specialties CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- ============================================
-- STORAGE BUCKET POLICIES
-- ============================================
DROP POLICY IF EXISTS "Public read access on uploads" ON storage.objects;
CREATE POLICY "Public read access on uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Service role insert on uploads" ON storage.objects;
CREATE POLICY "Service role insert on uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Service role update on uploads" ON storage.objects;
CREATE POLICY "Service role update on uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Service role delete on uploads" ON storage.objects;
CREATE POLICY "Service role delete on uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'uploads');

-- ============================================
-- TABLES
-- ============================================

-- Admin users
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News articles
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title_ar VARCHAR(500) NOT NULL,
    content_ar TEXT NOT NULL,
    summary_ar VARCHAR(500) DEFAULT '',
    category VARCHAR(100) NOT NULL DEFAULT 'news',
    image_url TEXT,
    location VARCHAR(500),
    published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page content sections
CREATE TABLE page_content (
    id SERIAL PRIMARY KEY,
    page_name VARCHAR(100) NOT NULL,
    section_id VARCHAR(100) NOT NULL,
    section_title_ar VARCHAR(500),
    content_ar TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',
    display_order INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (page_name, section_id)
);

-- Hero slider
CREATE TABLE hero_slides (
    id SERIAL PRIMARY KEY,
    title_ar VARCHAR(500) DEFAULT '',
    subtitle_ar VARCHAR(500) DEFAULT '',
    button_text_ar VARCHAR(255) DEFAULT '',
    image_url TEXT NOT NULL,
    link_url TEXT DEFAULT '',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Academic specialties
CREATE TABLE specialties (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    icon VARCHAR(50) DEFAULT '',
    description_ar TEXT DEFAULT '',
    image_url TEXT,
    video_url TEXT,
    video_type VARCHAR(50) DEFAULT 'youtube',
    items_ar TEXT DEFAULT '[]',
    duration_ar VARCHAR(100) DEFAULT '',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact messages
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings
CREATE TABLE site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    value_ar TEXT DEFAULT '',
    setting_type VARCHAR(50) DEFAULT 'text',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photo gallery
CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY,
    album_ar VARCHAR(255) DEFAULT 'عام',
    image_url TEXT NOT NULL,
    caption_ar VARCHAR(500) DEFAULT '',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow service_role full access)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admins' AND policyname = 'Service role full access on admins') THEN
        CREATE POLICY "Service role full access on admins" ON admins FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'news' AND policyname = 'Service role full access on news') THEN
        CREATE POLICY "Service role full access on news" ON news FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'page_content' AND policyname = 'Service role full access on page_content') THEN
        CREATE POLICY "Service role full access on page_content" ON page_content FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hero_slides' AND policyname = 'Service role full access on hero_slides') THEN
        CREATE POLICY "Service role full access on hero_slides" ON hero_slides FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'specialties' AND policyname = 'Service role full access on specialties') THEN
        CREATE POLICY "Service role full access on specialties" ON specialties FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Service role full access on messages') THEN
        CREATE POLICY "Service role full access on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'Service role full access on site_settings') THEN
        CREATE POLICY "Service role full access on site_settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gallery' AND policyname = 'Service role full access on gallery') THEN
        CREATE POLICY "Service role full access on gallery" ON gallery FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_news_published ON news (published);
CREATE INDEX idx_news_category ON news (category);
CREATE INDEX idx_news_created_at ON news (created_at DESC);
CREATE INDEX idx_page_content_page ON page_content (page_name);
CREATE INDEX idx_hero_slides_active ON hero_slides (is_active);
CREATE INDEX idx_specialties_active ON specialties (is_active);
CREATE INDEX idx_messages_is_read ON messages (is_read);
CREATE INDEX idx_messages_created_at ON messages (created_at DESC);
CREATE INDEX idx_site_settings_key ON site_settings (setting_key);
CREATE INDEX IF NOT EXISTS idx_gallery_active ON gallery (is_active);

-- ============================================
-- CLEANUP LEGACY
-- ============================================
DROP FUNCTION IF EXISTS public.initialize_schema();
