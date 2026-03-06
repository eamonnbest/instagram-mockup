-- Create products table for BEST apparel
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price INTEGER NOT NULL, -- in pence (GBP)
  status TEXT NOT NULL DEFAULT 'threshold' CHECK (status IN ('threshold', 'in_production', 'closed', 'killed')),
  threshold INTEGER NOT NULL DEFAULT 20,
  confirmed_orders INTEGER NOT NULL DEFAULT 0,
  delivery_weeks TEXT NOT NULL DEFAULT '4-6',
  sport TEXT NOT NULL CHECK (sport IN ('tennis', 'golf', 'running')),
  image_url TEXT,
  specs JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public read access for products (no auth required to browse)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON products FOR SELECT USING (true);

-- Index for slug lookups
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sport ON products(sport);
