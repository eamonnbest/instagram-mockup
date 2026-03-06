-- Add master_style and negative_prompt to all products
UPDATE products SET specs = specs || '{
  "master_style": "Studio product render, matte fabric, clean shadows, soft overhead lighting, laid flat on warm-grey background #D8D5D0, front view, no logos, no branding",
  "negative_prompt": "shiny, glossy, reflective, people, mannequin, hanger, lifestyle, busy background, text, watermark"
}'::jsonb;

-- Add variants for Tennis Training Top 01
UPDATE products SET specs = specs || '{
  "variants": [
    { "name": "CHALK", "hex": "#F4F4F1", "prompt_suffix": "in off-white chalk color, not pure blue-white", "image_url": null },
    { "name": "INK", "hex": "#0F1420", "prompt_suffix": "in near-black navy ink color", "image_url": null }
  ]
}'::jsonb WHERE slug = 'tennis-training-top-01';

-- Add variants for Tennis Match Tee 02
UPDATE products SET specs = specs || '{
  "variants": [
    { "name": "SALT", "hex": "#E7E8EA", "prompt_suffix": "in pale grey salt color", "image_url": null },
    { "name": "GRAPHITE", "hex": "#2A2D32", "prompt_suffix": "in dark charcoal graphite color", "image_url": null }
  ]
}'::jsonb WHERE slug = 'tennis-match-tee-02';

-- Add variants for Tennis Short 03
UPDATE products SET specs = specs || '{
  "variants": [
    { "name": "INK", "hex": "#0F1420", "prompt_suffix": "in near-black navy ink color", "image_url": null },
    { "name": "SLATE", "hex": "#525963", "prompt_suffix": "in mid-grey slate color", "image_url": null }
  ]
}'::jsonb WHERE slug = 'tennis-short-03';

-- Add variants for Run Half-Tight 01
UPDATE products SET specs = specs || '{
  "variants": [
    { "name": "BLACK", "hex": "#0B0B0C", "prompt_suffix": "in true black color", "image_url": null },
    { "name": "GRAPHITE", "hex": "#2A2D32", "prompt_suffix": "in dark charcoal graphite color", "image_url": null }
  ]
}'::jsonb WHERE slug = 'run-half-tight-01';

-- Add variants for Run Shell 02
UPDATE products SET specs = specs || '{
  "variants": [
    { "name": "STONE", "hex": "#D6D6D2", "prompt_suffix": "in warm light grey stone color", "image_url": null },
    { "name": "INK", "hex": "#0F1420", "prompt_suffix": "in near-black navy ink color", "image_url": null }
  ]
}'::jsonb WHERE slug = 'run-shell-02';
