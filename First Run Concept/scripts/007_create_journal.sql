-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  category TEXT DEFAULT 'editorial',
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_journal_entries_slug ON journal_entries(slug);

-- Create index on published_at for sorting
CREATE INDEX IF NOT EXISTS idx_journal_entries_published_at ON journal_entries(published_at DESC);

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published entries
CREATE POLICY "Public can view published journal entries"
  ON journal_entries
  FOR SELECT
  USING (published = true);

-- Seed some initial journal entries
INSERT INTO journal_entries (title, slug, excerpt, content, cover_image, category, published, published_at)
VALUES 
(
  'The Pursuit of Less',
  'the-pursuit-of-less',
  'Why we removed everything that didn''t serve performance.',
  E'# The Pursuit of Less\n\nIn a market saturated with logos, panels, and decorative stitching, we asked a simple question: what if we removed everything that didn''t directly improve performance?\n\n## Starting from Zero\n\nEvery seam, every panel, every design decision was interrogated. Does this make the garment perform better? Does it make it more comfortable? More durable? If not, it goes.\n\n## The Result\n\nClean lines. Considered construction. Materials that work as hard as you do. No decoration. No distraction. Just apparel engineered for the pursuit.',
  NULL,
  'philosophy',
  true,
  NOW() - INTERVAL '7 days'
),
(
  'Material Study: Performance Knit',
  'material-study-performance-knit',
  'Inside the high-stretch, fast-dry fabric behind our training tops.',
  E'# Material Study: Performance Knit\n\nThe fabric that forms the foundation of our Training Top 01 isn''t an off-the-shelf solution. It''s the result of months of testing, iteration, and refinement.\n\n## Composition\n\nPolyamide/elastane blend. High stretch. Fast dry. Matte finish — no shine, no distraction.\n\n## Construction\n\nHydrophobic yarn construction pulls moisture away from the skin before it has a chance to pool. The result is a top that stays light even when the session runs long.',
  NULL,
  'materials',
  true,
  NOW() - INTERVAL '3 days'
),
(
  'Why Made to Order',
  'why-made-to-order',
  'The threshold model explained — and why it matters.',
  E'# Why Made to Order\n\nThe fashion industry produces billions of garments that never get worn. We refuse to contribute to that waste.\n\n## The Threshold Model\n\nEvery product on BEST operates on a threshold system. Production only begins when a minimum number of orders are confirmed. If the threshold isn''t met, orders are refunded automatically.\n\n## The Benefits\n\n- **Zero waste**: We only make what''s already been ordered\n- **Better pricing**: No need to factor in unsold inventory\n- **Premium quality**: Small batch production allows for higher standards\n\nIt requires patience. But we think it''s worth it.',
  NULL,
  'process',
  true,
  NOW() - INTERVAL '1 day'
);
