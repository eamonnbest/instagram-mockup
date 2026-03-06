-- Seed initial products for BEST
INSERT INTO products (name, slug, price, status, threshold, confirmed_orders, delivery_weeks, sport, specs) VALUES
(
  'TENNIS / TRAINING TOP 01',
  'tennis-training-top-01',
  14500,
  'threshold',
  20,
  7,
  '4-6',
  'tennis',
  '{"fabric": "High-performance knit. Hydrophobic yarn construction.", "cut": "Athletic. Close without compression.", "construction": "Minimal seam layout. No decorative paneling.", "use": "Tennis training and match play.", "care": "Machine wash cold. Do not tumble dry."}'
),
(
  'TENNIS / TRAINING SHORT 01',
  'tennis-training-short-01',
  9500,
  'threshold',
  20,
  12,
  '4-6',
  'tennis',
  '{"fabric": "Lightweight woven. Four-way stretch.", "cut": "7-inch inseam. Relaxed through thigh.", "construction": "Internal brief. Single rear pocket.", "use": "Tennis training and match play.", "care": "Machine wash cold. Do not tumble dry."}'
),
(
  'GOLF / POLO 01',
  'golf-polo-01',
  16500,
  'threshold',
  20,
  3,
  '4-6',
  'golf',
  '{"fabric": "Merino-blend piqué. Temperature regulating.", "cut": "Classic fit. Ribbed collar.", "construction": "Four-button placket. No chest logo.", "use": "Golf. Clubhouse to course.", "care": "Machine wash cold. Lay flat to dry."}'
),
(
  'GOLF / TROUSER 01',
  'golf-trouser-01',
  19500,
  'threshold',
  20,
  5,
  '4-6',
  'golf',
  '{"fabric": "Technical twill. Water-resistant finish.", "cut": "Slim-straight. Mid-rise.", "construction": "Hidden stretch waistband. Minimal hardware.", "use": "Golf. 18 holes in any weather.", "care": "Machine wash cold. Hang dry."}'
),
(
  'RUNNING / HALF TIGHT 01',
  'running-half-tight-01',
  11500,
  'threshold',
  20,
  15,
  '4-6',
  'running',
  '{"fabric": "Compression knit. Moisture-wicking.", "cut": "7-inch inseam. Second-skin fit.", "construction": "Flatlock seams. Reflective details.", "use": "Road and trail running.", "care": "Machine wash cold. Do not tumble dry."}'
);
