-- supabase/seed.sql — GENERATED FILE, do not edit by hand.
-- Regenerate with: python3 scripts/generate_seed.py
-- CIE Lab values are computed from each hex (sRGB, D65) at generation time.

begin;

-- Colour seasons ----------------------------------------------------
insert into public.colour_seasons (slug, name, tagline, description, characteristics, display_order)
values ('spring', 'Spring', 'Warm, light and fresh', 'Spring colouring pairs a warm undertone with light-to-medium depth and a clear, fresh brightness. Warm corals, peaches, golden yellows and lively aqua tones tend to harmonise well, while very dark or dusty colours can feel heavy.', '{"temperature": "warm", "value": "light to medium", "chroma": "clear and bright", "contrast": "low to medium"}'::jsonb, 1)
on conflict (slug) do update set name = excluded.name, tagline = excluded.tagline, description = excluded.description, characteristics = excluded.characteristics, display_order = excluded.display_order;
insert into public.colour_seasons (slug, name, tagline, description, characteristics, display_order)
values ('summer', 'Summer', 'Cool, soft and gentle', 'Summer colouring pairs a cool undertone with light-to-medium depth and softly muted colours. Powder blues, dusty roses, lavenders and gentle grey-greens tend to harmonise well, while very warm or high-voltage colours can overpower.', '{"temperature": "cool", "value": "light to medium", "chroma": "soft and muted", "contrast": "low to medium"}'::jsonb, 2)
on conflict (slug) do update set name = excluded.name, tagline = excluded.tagline, description = excluded.description, characteristics = excluded.characteristics, display_order = excluded.display_order;
insert into public.colour_seasons (slug, name, tagline, description, characteristics, display_order)
values ('autumn', 'Autumn', 'Warm, rich and earthy', 'Autumn colouring pairs a warm undertone with medium-to-deep depth and muted, earthy richness. Terracotta, rust, olive, mustard and warm teal tend to harmonise well, while icy pastels and stark white can clash with its warmth.', '{"temperature": "warm", "value": "medium to deep", "chroma": "muted and earthy", "contrast": "medium"}'::jsonb, 3)
on conflict (slug) do update set name = excluded.name, tagline = excluded.tagline, description = excluded.description, characteristics = excluded.characteristics, display_order = excluded.display_order;
insert into public.colour_seasons (slug, name, tagline, description, characteristics, display_order)
values ('winter', 'Winter', 'Cool, clear and striking', 'Winter colouring pairs a cool undertone with medium-to-deep depth and clear, high-contrast colour. True red, royal blue, emerald and icy brights tend to harmonise well, while dusty earth tones can dull its natural contrast.', '{"temperature": "cool", "value": "medium to deep", "chroma": "clear and vivid", "contrast": "high"}'::jsonb, 4)
on conflict (slug) do update set name = excluded.name, tagline = excluded.tagline, description = excluded.description, characteristics = excluded.characteristics, display_order = excluded.display_order;

-- Colour sub-seasons ------------------------------------------------
insert into public.colour_subseasons (season_id, slug, name, description, display_order)
select id, 'light-spring', 'Light Spring', 'Lightest and most delicate Spring: warm and luminous with gentle contrast.', 1
from public.colour_seasons where slug = 'spring'
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order;
insert into public.colour_subseasons (season_id, slug, name, description, display_order)
select id, 'warm-spring', 'Warm Spring', 'The most golden Spring: warmth is the dominant quality.', 2
from public.colour_seasons where slug = 'spring'
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order;
insert into public.colour_subseasons (season_id, slug, name, description, display_order)
select id, 'bright-spring', 'Bright Spring', 'The clearest Spring: fresh warmth with vivid, sparkling colour.', 3
from public.colour_seasons where slug = 'spring'
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order;
insert into public.colour_subseasons (season_id, slug, name, description, display_order)
select id, 'light-summer', 'Light Summer', 'Lightest Summer: cool, airy and delicate.', 1
from public.colour_seasons where slug = 'summer'
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order;
insert into public.colour_subseasons (season_id, slug, name, description, display_order)
select id, 'cool-summer', 'Cool Summer', 'The coolest Summer: rose and blue undertones lead.', 2
from public.colour_seasons where slug = 'summer'
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order;
insert into public.colour_subseasons (season_id, slug, name, description, display_order)
select id, 'soft-summer', 'Soft Summer', 'The most muted Summer: gentle, misty blends.', 3
from public.colour_seasons where slug = 'summer'
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order;
insert into public.colour_subseasons (season_id, slug, name, description, display_order)
select id, 'soft-autumn', 'Soft Autumn', 'The gentlest Autumn: warmth softened with haze.', 1
from public.colour_seasons where slug = 'autumn'
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order;
insert into public.colour_subseasons (season_id, slug, name, description, display_order)
select id, 'warm-autumn', 'Warm Autumn', 'The most golden Autumn: fire-lit warmth throughout.', 2
from public.colour_seasons where slug = 'autumn'
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order;
insert into public.colour_subseasons (season_id, slug, name, description, display_order)
select id, 'deep-autumn', 'Deep Autumn', 'The darkest Autumn: rich, smouldering depth.', 3
from public.colour_seasons where slug = 'autumn'
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order;
insert into public.colour_subseasons (season_id, slug, name, description, display_order)
select id, 'deep-winter', 'Deep Winter', 'The darkest Winter: dramatic depth with cool clarity.', 1
from public.colour_seasons where slug = 'winter'
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order;
insert into public.colour_subseasons (season_id, slug, name, description, display_order)
select id, 'cool-winter', 'Cool Winter', 'The coolest Winter: icy blue and crimson clarity.', 2
from public.colour_seasons where slug = 'winter'
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order;
insert into public.colour_subseasons (season_id, slug, name, description, display_order)
select id, 'bright-winter', 'Bright Winter', 'The most vivid Winter: electric, high-contrast brilliance.', 3
from public.colour_seasons where slug = 'winter'
on conflict (slug) do update set name = excluded.name, description = excluded.description, display_order = excluded.display_order;

-- Palette colours (season-wide) --------------------------------------
delete from public.palette_colours;
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Warm Ivory', '#f7f1e1', 95.21, -0.68, 8.44, 'neutrals', 'white', 'Bases, shirts and layering pieces.', 10
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Soft Cream', '#f9e9c8', 92.83, 0.26, 18.02, 'neutrals', 'cream', 'Softer alternative to white near the face.', 20
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Camel', '#c19a6b', 66.15, 8.37, 30.15, 'neutrals', 'brown', 'Coats, trousers and structured pieces.', 30
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Light Warm Beige', '#e3cdaa', 83.39, 2.34, 20.25, 'neutrals', 'beige', 'Everyday neutral for tops and knits.', 40
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Golden Tan', '#d2a56d', 70.68, 9.62, 35.26, 'neutrals', 'brown', 'Warm neutral for skirts and bags.', 50
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Coral', '#ff6f61', 64.56, 53.9, 35.18, 'core', 'coral', 'Statement tops and dresses near the face.', 10
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Peach', '#ffbe98', 82.03, 18.69, 28.32, 'core', 'orange', 'Soft feature colour for blouses and knits.', 20
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Warm Yellow', '#f7c948', 82.92, 3.52, 67.45, 'core', 'yellow', 'Cheerful accent for tops and accessories.', 30
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Leaf Green', '#7bb661', 68.41, -34.93, 37.17, 'core', 'green', 'Fresh green for casual and smart pieces.', 40
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Turquoise', '#45d1c5', 76.61, -39.7, -4.99, 'core', 'blue-green', 'Lively colour for tops and scarves.', 50
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Salmon Pink', '#ff8e7f', 70.97, 41.15, 26.95, 'core', 'pink', 'Warm pink for dresses and knitwear.', 60
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Poppy Red', '#ee4035', 54.14, 65.17, 46.35, 'accents', 'red', 'High-energy accent in small or large doses.', 10
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Bright Aqua', '#17c3b2', 71.16, -43.4, -2.81, 'accents', 'blue-green', 'Vivid accent for accessories and prints.', 20
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Periwinkle Blue', '#7c9ed9', 64.76, 3.52, -33.7, 'accents', 'blue', 'Cooler accent that stays soft and warm-friendly.', 30
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Golden Orange', '#f8a13f', 73.42, 24.43, 61.63, 'accents', 'orange', 'Sunny accent for scarves and jewellery.', 40
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Warm Navy', '#34426b', 28.61, 6.99, -25.66, 'formal', 'blue', 'Suits and formal dresses instead of black.', 10
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Honey Camel', '#b98b52', 61.13, 10.87, 37.0, 'formal', 'brown', 'Blazers and tailored trousers.', 20
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Cream White', '#f5ecd7', 93.59, -0.43, 11.26, 'formal', 'white', 'Formal shirts and occasion wear.', 30
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Denim Wash Blue', '#6f8fbf', 58.77, 1.35, -28.5, 'casual', 'blue', 'Jeans and relaxed shirting.', 10
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Apricot', '#f8b878', 79.38, 15.97, 41.38, 'casual', 'orange', 'Weekend tops and casual layers.', 20
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Fresh Mint', '#98d7c2', 81.38, -24.42, 3.96, 'casual', 'green', 'Light casual knits and tees.', 30
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Warm Gold', '#d4af37', 72.85, 1.38, 62.91, 'accessories', 'metallic', 'Jewellery and hardware finishes.', 10
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Tan Leather', '#a97142', 52.55, 17.22, 34.74, 'accessories', 'brown', 'Shoes, belts and bags.', 20
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Peach Blossom', '#f9b7a6', 80.05, 21.69, 18.06, 'headwear', 'pink', 'Hijabs and scarves framing the face.', 10
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Soft Aqua', '#a5dcd3', 83.91, -19.44, -1.31, 'headwear', 'blue-green', 'Light headwear colour for daywear.', 20
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Buttercream', '#f6dfa4', 89.42, -0.51, 31.84, 'headwear', 'yellow', 'Gentle warm tone for headwear.', 30
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Jet Black', '#1a1a1a', 9.26, -0.0, 0.0, 'cautious', 'black', 'Can look heavy against Spring freshness — consider warm navy or chocolate, or keep black away from the face.', 10
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Cool Charcoal', '#4a4e57', 33.12, 0.5, -5.84, 'cautious', 'grey', 'May dull Spring warmth — camel or warm navy usually flatters more.', 20
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Burgundy', '#722f37', 29.13, 30.36, 9.72, 'cautious', 'red', 'Deep and muted for Spring — a clear poppy red is usually more harmonious.', 30
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Icy Blue', '#c8dcec', 86.76, -3.44, -10.08, 'cautious', 'blue', 'Cool pastel that can wash out warm colouring — try aqua or turquoise instead.', 40
from public.colour_seasons s where s.slug = 'spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Soft White', '#f4f4f2', 96.14, -0.35, 0.96, 'neutrals', 'white', 'Gentler than stark white for shirts and layers.', 10
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Dove Grey', '#c9ced4', 82.55, -0.57, -3.57, 'neutrals', 'grey', 'Light neutral for tops and knits.', 20
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Cool Greige', '#c5beb4', 77.28, 0.7, 5.92, 'neutrals', 'beige', 'Soft beige-grey for trousers and coats.', 30
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Slate Grey', '#8d99a5', 62.64, -1.73, -7.73, 'neutrals', 'grey', 'Mid neutral for tailoring.', 40
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Rose Beige', '#d9c2bd', 80.19, 7.28, 5.47, 'neutrals', 'pink', 'Warm-ish neutral that stays soft and rosy.', 50
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Powder Blue', '#a3c1d9', 76.64, -4.78, -15.33, 'core', 'blue', 'Signature Summer blue for shirts and dresses.', 10
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Rose Pink', '#dfa0af', 72.18, 25.52, 1.58, 'core', 'pink', 'Soft pink for tops near the face.', 20
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Lavender', '#b3a5d3', 70.31, 14.16, -21.51, 'core', 'purple', 'Gentle purple for blouses and knits.', 30
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Sage Green', '#a8b8a0', 72.99, -10.02, 10.33, 'core', 'green', 'Muted green for versatile pieces.', 40
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Dusty Blue', '#7e9cb9', 63.11, -3.41, -18.39, 'core', 'blue', 'Deeper blue that stays soft.', 50
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Muted Raspberry', '#a35d75', 48.14, 31.62, -1.02, 'core', 'pink', 'Berry tone for depth without harshness.', 60
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Periwinkle', '#92a8d1', 68.55, 1.84, -23.33, 'accents', 'blue', 'Softly vivid accent for scarves and prints.', 10
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Orchid', '#b48ab6', 62.73, 23.61, -16.87, 'accents', 'purple', 'Cool floral accent colour.', 20
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Sea Glass', '#9dc3bc', 75.96, -14.07, -0.67, 'accents', 'blue-green', 'Misty green-blue for accessories.', 30
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Watermelon Pink', '#dd7596', 61.91, 44.06, 0.67, 'accents', 'pink', 'Brightest Summer pink — great in small doses.', 40
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Soft Navy', '#46586f', 36.8, -0.66, -15.36, 'formal', 'blue', 'Formal alternative to black.', 10
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'French Grey', '#7f8a99', 57.06, -0.72, -9.33, 'formal', 'grey', 'Suits and tailored dresses.', 20
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Rose Taupe', '#8d6b6e', 48.64, 14.02, 3.58, 'formal', 'brown', 'Soft formal brown with a rosy cast.', 30
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Chambray', '#91a8c0', 67.89, -2.58, -14.93, 'casual', 'blue', 'Casual shirts and light denim.', 10
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Dusty Pink', '#d8a7b1', 73.16, 19.5, 1.82, 'casual', 'pink', 'Relaxed knits and tees.', 20
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Cool Mint', '#aecfc2', 80.47, -13.53, 2.8, 'casual', 'green', 'Fresh casual layer colour.', 30
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Polished Silver', '#c0c0c0', 77.7, -0.0, 0.0, 'accessories', 'metallic', 'Jewellery and hardware finishes.', 10
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Cool Pewter', '#8e939b', 60.77, -0.18, -4.84, 'accessories', 'grey', 'Bags, shoes and belts.', 20
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Misty Lilac', '#c9b6d4', 76.45, 12.26, -12.61, 'headwear', 'purple', 'Hijabs and scarves framing the face.', 10
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Powder Pink', '#e8c4cc', 82.38, 14.02, 0.76, 'headwear', 'pink', 'Soft pink headwear tone.', 20
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Cloud Blue', '#bcd2e8', 83.24, -2.8, -13.3, 'headwear', 'blue', 'Airy blue for headwear.', 30
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Bright Orange', '#f26f22', 61.97, 46.55, 62.19, 'cautious', 'orange', 'Strong warmth can overwhelm Summer softness — watermelon pink gives similar energy more gently.', 10
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Mustard', '#c9962a', 65.28, 9.45, 60.15, 'cautious', 'yellow', 'Warm and earthy for Summer — soft lavender or powder blue usually flatters more.', 20
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Jet Black', '#1a1a1a', 9.26, -0.0, 0.0, 'cautious', 'black', 'Harsh against soft colouring — soft navy or French grey are kinder near the face.', 30
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Vivid Lime', '#a4d425', 79.11, -37.8, 72.78, 'cautious', 'green', 'High-voltage brightness may clash — sage or sea glass keep the palette calm.', 40
from public.colour_seasons s where s.slug = 'summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Warm Cream', '#f1e3c3', 90.59, -0.3, 17.37, 'neutrals', 'cream', 'Softest Autumn base colour.', 10
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Warm Beige', '#d7b98e', 76.74, 4.58, 25.82, 'neutrals', 'beige', 'Everyday neutral for layers.', 20
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Toffee', '#a87b51', 55.16, 12.42, 29.72, 'neutrals', 'brown', 'Mid brown for trousers and knits.', 30
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Chocolate Brown', '#5e4630', 31.75, 7.12, 17.22, 'neutrals', 'brown', 'Deep neutral instead of black.', 40
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Warm Taupe', '#8a7a5e', 51.99, 1.66, 17.61, 'neutrals', 'brown', 'Muted neutral for tailoring.', 50
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Terracotta', '#c66b3d', 54.93, 32.38, 41.12, 'core', 'orange', 'Signature Autumn colour for tops and dresses.', 10
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Rust', '#b7410e', 44.06, 45.76, 51.12, 'core', 'orange', 'Rich statement colour near the face.', 20
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Mustard', '#cc9c33', 67.17, 7.88, 58.68, 'core', 'yellow', 'Golden feature colour for knits.', 30
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Olive Green', '#737c3f', 50.0, -13.24, 31.97, 'core', 'green', 'Core green for jackets and trousers.', 40
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Warm Teal', '#2f6f7e', 43.48, -15.53, -14.42, 'core', 'blue-green', 'Autumn''s best blue-green.', 50
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Burnt Orange', '#cc5500', 51.08, 44.16, 60.77, 'core', 'orange', 'Bold warm orange for statement pieces.', 60
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Golden Amber', '#e0a526', 71.49, 11.29, 67.89, 'accents', 'yellow', 'Glowing accent for scarves and jewellery.', 10
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Forest Green', '#40603f', 37.51, -19.13, 15.24, 'accents', 'green', 'Deep green accent for outerwear.', 20
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Warm Burgundy', '#7c3030', 30.91, 33.08, 16.98, 'accents', 'red', 'Autumn-friendly deep red.', 30
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Copper', '#b66a41', 52.55, 26.59, 35.68, 'accents', 'metallic', 'Metallic-leaning accent tone.', 40
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Espresso', '#4e342e', 24.56, 10.82, 8.51, 'formal', 'brown', 'Formal depth instead of black.', 10
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Deep Olive', '#556036', 38.84, -11.93, 22.57, 'formal', 'green', 'Suits and structured dresses.', 20
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Camel Coat', '#b08d57', 60.75, 6.35, 33.67, 'formal', 'brown', 'Classic formal outer layer.', 30
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Khaki', '#9a8a5c', 57.87, -0.84, 26.83, 'casual', 'green', 'Relaxed trousers and utility pieces.', 10
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Moss', '#8a9a5b', 61.02, -16.28, 31.17, 'casual', 'green', 'Casual knits and tees.', 20
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Pumpkin Spice', '#d0793a', 59.34, 28.87, 47.84, 'casual', 'orange', 'Weekend warmth for layers.', 30
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Antique Gold', '#bd9a45', 65.25, 3.39, 48.4, 'accessories', 'metallic', 'Jewellery and hardware finishes.', 10
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Cognac Leather', '#9a5b33', 45.07, 22.11, 33.59, 'accessories', 'brown', 'Shoes, belts and bags.', 20
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Warm Olive', '#7f7b4d', 50.94, -5.84, 25.71, 'headwear', 'green', 'Hijabs and scarves framing the face.', 10
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Cinnamon Rose', '#b3684f', 51.9, 27.51, 26.97, 'headwear', 'pink', 'Soft warm rose for headwear.', 20
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Golden Cream', '#ead9ac', 87.05, -0.97, 24.33, 'headwear', 'cream', 'Light headwear tone.', 30
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Icy Pink', '#f3d6e4', 88.33, 12.37, -3.17, 'cautious', 'pink', 'Cool pastel that can clash with Autumn warmth — cinnamon rose is a warmer swap.', 10
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Pure White', '#ffffff', 100.0, -0.0, 0.0, 'cautious', 'white', 'Stark against earthy richness — warm cream usually sits more naturally.', 20
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Vivid Fuchsia', '#d1358f', 49.6, 66.96, -13.71, 'cautious', 'pink', 'Cool brightness may fight the palette — warm burgundy carries similar drama.', 30
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Icy Blue-Grey', '#9db2c9', 71.71, -2.22, -14.07, 'cautious', 'blue', 'Cool haze can dull warmth — try warm teal instead.', 40
from public.colour_seasons s where s.slug = 'autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Pure White', '#ffffff', 100.0, -0.0, 0.0, 'neutrals', 'white', 'Crisp base that suits Winter contrast.', 10
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'True Black', '#111111', 5.06, -0.0, 0.0, 'neutrals', 'black', 'Core neutral for tailoring and layers.', 20
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Charcoal', '#3b3f46', 26.53, 0.05, -4.83, 'neutrals', 'grey', 'Deep neutral for suits and coats.', 30
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Cool Navy', '#22304f', 20.12, 4.54, -20.84, 'neutrals', 'blue', 'Alternative deep neutral.', 40
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Silver Grey', '#b9c0c9', 77.42, -0.66, -5.35, 'neutrals', 'grey', 'Light neutral for shirts and knits.', 50
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'True Red', '#c8102e', 42.54, 65.89, 35.71, 'core', 'red', 'Signature clear red for statement pieces.', 10
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Royal Blue', '#4169e1', 47.83, 26.26, -65.26, 'core', 'blue', 'Vivid blue for dresses and tops.', 20
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Emerald Green', '#009b77', 56.85, -43.53, 9.26, 'core', 'green', 'Jewel green near the face.', 30
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Fuchsia', '#ca2c92', 47.54, 68.23, -18.76, 'core', 'pink', 'Cool vivid pink for impact.', 40
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Regal Purple', '#612e9e', 31.72, 45.66, -52.13, 'core', 'purple', 'Deep jewel purple.', 50
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Peacock Teal', '#00707d', 42.87, -21.74, -14.83, 'core', 'blue-green', 'Clear deep teal.', 60
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Icy Blue', '#cfe8f5', 90.58, -5.6, -9.07, 'accents', 'blue', 'Frosted accent for shirts and scarves.', 10
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Icy Pink', '#f3d9e5', 89.08, 10.97, -2.59, 'accents', 'pink', 'Cool pastel accent.', 20
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Icy Lilac', '#ddd4ef', 86.35, 8.07, -12.11, 'accents', 'purple', 'Frosted lilac accent.', 30
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Lemon Ice', '#f6f2c5', 94.79, -5.79, 22.25, 'accents', 'yellow', 'Winter''s icy yellow accent.', 40
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Midnight Navy', '#16213e', 13.27, 5.73, -20.07, 'formal', 'blue', 'Eveningwear and suits.', 10
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Graphite', '#34373c', 22.96, -0.05, -3.56, 'formal', 'grey', 'Sharp formal grey.', 20
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Ruby Red', '#9e1030', 33.68, 54.98, 21.87, 'formal', 'red', 'Occasion red with cool depth.', 30
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Cool Denim', '#48679f', 43.63, 5.65, -33.8, 'casual', 'blue', 'Jeans and casual shirting.', 10
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Bright White', '#f8f9fb', 97.9, 0.02, -1.07, 'casual', 'white', 'Crisp tees and casual shirts.', 20
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Dark Berry', '#802a5b', 31.81, 42.07, -9.67, 'casual', 'purple', 'Weekend depth with Winter clarity.', 30
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Polished Silver', '#c7ccd4', 81.88, -0.19, -4.56, 'accessories', 'metallic', 'Jewellery and hardware finishes.', 10
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Gunmetal', '#52565e', 36.48, 0.24, -5.17, 'accessories', 'grey', 'Bags, shoes and belts.', 20
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Ice Grey', '#dee4ea', 90.3, -0.9, -3.61, 'headwear', 'grey', 'Hijabs and scarves framing the face.', 10
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Deep Plum', '#4e2a5a', 23.72, 25.82, -22.17, 'headwear', 'purple', 'Rich headwear tone.', 20
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Sapphire', '#24549e', 36.33, 10.99, -44.9, 'headwear', 'blue', 'Clear blue for headwear.', 30
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Warm Beige', '#d9b98c', 76.89, 5.12, 27.12, 'cautious', 'beige', 'Earthy warmth can dull Winter contrast — silver grey or icy blue stay crisper.', 10
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Mustard', '#cc9c33', 67.17, 7.88, 58.68, 'cautious', 'yellow', 'Golden and muted for Winter — lemon ice keeps yellow icy instead.', 20
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Rust Orange', '#b7410e', 44.06, 45.76, 51.12, 'cautious', 'orange', 'Warm earth tone that fights cool clarity — true red carries the energy better.', 30
from public.colour_seasons s where s.slug = 'winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select s.id, null, 'Muted Salmon', '#d3826b', 62.41, 28.77, 25.64, 'cautious', 'pink', 'Soft warm pink may look faded — fuchsia or icy pink suit the palette more.', 40
from public.colour_seasons s where s.slug = 'winter';

-- Palette colours (sub-season signatures) ---------------------------
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Light Peach', '#ffd3b6', 87.6, 11.31, 20.16, 'core', 'orange', 'Delicate feature colour for Light Spring.', 5
from public.colour_subseasons ss where ss.slug = 'light-spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Aqua Whisper', '#bfe8e0', 89.0, -14.82, -0.52, 'core', 'blue-green', 'Airy aqua for Light Spring.', 5
from public.colour_subseasons ss where ss.slug = 'light-spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Sunlight Yellow', '#ffe08a', 90.05, -0.29, 45.88, 'core', 'yellow', 'Soft luminous yellow for Light Spring.', 5
from public.colour_subseasons ss where ss.slug = 'light-spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Marigold', '#f0a53c', 73.39, 18.87, 62.52, 'core', 'yellow', 'Golden signature for Warm Spring.', 5
from public.colour_subseasons ss where ss.slug = 'warm-spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Warm Coral', '#ff7a5c', 66.49, 48.44, 40.27, 'core', 'coral', 'Sun-warmed coral for Warm Spring.', 5
from public.colour_subseasons ss where ss.slug = 'warm-spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Grass Green', '#6fae4e', 65.12, -37.79, 42.42, 'core', 'green', 'Living green for Warm Spring.', 5
from public.colour_subseasons ss where ss.slug = 'warm-spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Bright Coral', '#ff5349', 59.83, 64.4, 42.67, 'accents', 'coral', 'Vivid coral for Bright Spring.', 5
from public.colour_subseasons ss where ss.slug = 'bright-spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Vivid Turquoise', '#10c0b5', 70.28, -41.58, -5.76, 'accents', 'blue-green', 'Electric turquoise for Bright Spring.', 5
from public.colour_subseasons ss where ss.slug = 'bright-spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Clear Yellow', '#ffcf26', 85.01, 2.64, 80.41, 'accents', 'yellow', 'High-clarity yellow for Bright Spring.', 5
from public.colour_subseasons ss where ss.slug = 'bright-spring';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Baby Blue', '#b7d3ea', 83.23, -4.42, -14.41, 'core', 'blue', 'Feather-light blue for Light Summer.', 5
from public.colour_subseasons ss where ss.slug = 'light-summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Ballet Pink', '#eac6d3', 83.22, 14.81, -1.72, 'core', 'pink', 'Delicate pink for Light Summer.', 5
from public.colour_subseasons ss where ss.slug = 'light-summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Pale Lavender', '#d3c6e8', 81.87, 10.88, -15.17, 'core', 'purple', 'Misty lavender for Light Summer.', 5
from public.colour_subseasons ss where ss.slug = 'light-summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Cool Rose', '#c97d97', 61.06, 32.93, -1.45, 'core', 'pink', 'Rose signature for Cool Summer.', 5
from public.colour_subseasons ss where ss.slug = 'cool-summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Slate Blue', '#6f83a8', 54.49, 1.94, -21.97, 'core', 'blue', 'Blue-grey depth for Cool Summer.', 5
from public.colour_subseasons ss where ss.slug = 'cool-summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Blue Spruce', '#5e7d7e', 50.16, -10.75, -4.15, 'core', 'blue-green', 'Cool conifer tone for Cool Summer.', 5
from public.colour_subseasons ss where ss.slug = 'cool-summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Dusty Mauve', '#a58a94', 60.17, 11.92, -1.5, 'core', 'purple', 'Hazy mauve for Soft Summer.', 5
from public.colour_subseasons ss where ss.slug = 'soft-summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Grey Sage', '#99a396', 65.88, -6.05, 5.53, 'core', 'green', 'Smoked sage for Soft Summer.', 5
from public.colour_subseasons ss where ss.slug = 'soft-summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Soft Denim', '#7d92ab', 59.76, -1.62, -15.57, 'core', 'blue', 'Washed denim blue for Soft Summer.', 5
from public.colour_subseasons ss where ss.slug = 'soft-summer';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Soft Camel', '#c0a67b', 69.41, 3.26, 25.79, 'core', 'brown', 'Gentle camel for Soft Autumn.', 5
from public.colour_subseasons ss where ss.slug = 'soft-autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Sage Olive', '#8f9779', 61.09, -8.37, 14.87, 'core', 'green', 'Softened olive for Soft Autumn.', 5
from public.colour_subseasons ss where ss.slug = 'soft-autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Dusty Coral', '#cb8e7c', 64.56, 20.89, 18.88, 'core', 'coral', 'Muted coral for Soft Autumn.', 5
from public.colour_subseasons ss where ss.slug = 'soft-autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Pumpkin', '#c9711f', 56.42, 29.21, 56.23, 'core', 'orange', 'Glowing pumpkin for Warm Autumn.', 5
from public.colour_subseasons ss where ss.slug = 'warm-autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Golden Olive', '#90802e', 53.56, -3.87, 45.08, 'core', 'green', 'Sun-baked olive for Warm Autumn.', 5
from public.colour_subseasons ss where ss.slug = 'warm-autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Brick Red', '#9e3b32', 38.95, 40.61, 27.09, 'core', 'red', 'Fired brick for Warm Autumn.', 5
from public.colour_subseasons ss where ss.slug = 'warm-autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Mahogany', '#6c2f22', 27.68, 26.11, 21.25, 'core', 'brown', 'Polished depth for Deep Autumn.', 5
from public.colour_subseasons ss where ss.slug = 'deep-autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Deep Teal', '#175f5e', 36.32, -21.4, -5.73, 'core', 'blue-green', 'Dark teal for Deep Autumn.', 5
from public.colour_subseasons ss where ss.slug = 'deep-autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Dark Chocolate', '#3f2a20', 19.3, 8.27, 10.43, 'core', 'brown', 'Near-black brown for Deep Autumn.', 5
from public.colour_subseasons ss where ss.slug = 'deep-autumn';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Black Cherry', '#521831', 18.67, 29.57, -1.89, 'core', 'red', 'Blackened cherry for Deep Winter.', 5
from public.colour_subseasons ss where ss.slug = 'deep-winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Ink Navy', '#131f40', 12.53, 7.35, -22.65, 'core', 'blue', 'Ink depth for Deep Winter.', 5
from public.colour_subseasons ss where ss.slug = 'deep-winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Deep Pine', '#0a463d', 26.1, -20.75, 0.17, 'core', 'green', 'Darkest pine for Deep Winter.', 5
from public.colour_subseasons ss where ss.slug = 'deep-winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Ice White', '#f4f8fb', 97.36, -0.78, -1.9, 'core', 'white', 'Glacial white for Cool Winter.', 5
from public.colour_subseasons ss where ss.slug = 'cool-winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Cool Crimson', '#af1a3f', 38.22, 58.36, 18.78, 'core', 'red', 'Blue-based crimson for Cool Winter.', 5
from public.colour_subseasons ss where ss.slug = 'cool-winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Cobalt Blue', '#0047ab', 32.8, 22.52, -58.44, 'core', 'blue', 'Pure cobalt for Cool Winter.', 5
from public.colour_subseasons ss where ss.slug = 'cool-winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Electric Blue', '#0892d0', 57.23, -9.78, -40.72, 'accents', 'blue', 'Charged blue for Bright Winter.', 5
from public.colour_subseasons ss where ss.slug = 'bright-winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Shocking Pink', '#e5399e', 54.09, 72.43, -15.5, 'accents', 'pink', 'High-voltage pink for Bright Winter.', 5
from public.colour_subseasons ss where ss.slug = 'bright-winter';
insert into public.palette_colours (season_id, subseason_id, name, hex, lab_l, lab_a, lab_b, palette_group, colour_family, recommended_use, priority)
select ss.season_id, ss.id, 'Vivid Emerald', '#00a878', 61.1, -48.46, 14.66, 'accents', 'green', 'Luminous emerald for Bright Winter.', 5
from public.colour_subseasons ss where ss.slug = 'bright-winter';

-- Cosmetic recommendations ------------------------------------------
delete from public.cosmetic_recommendations;
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'lipstick', 'Warm Coral', '#e96a53', 'medium', 'day', 'Fresh coral that lifts warm, clear colouring.', 10
from public.colour_seasons s where s.slug = 'spring';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'lipstick', 'Peachy Nude', '#d98a6f', 'soft', 'any', 'Everyday nude with a warm peach base.', 20
from public.colour_seasons s where s.slug = 'spring';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'blusher', 'Peach Glow', '#f0a37e', 'soft', 'day', 'Soft peach flush for daytime.', 10
from public.colour_seasons s where s.slug = 'spring';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'blusher', 'Coral Flush', '#ef7e6a', 'medium', 'any', 'Livelier coral cheek colour.', 20
from public.colour_seasons s where s.slug = 'spring';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeshadow', 'Champagne Shimmer', '#e8cfae', 'soft', 'day', 'Luminous wash for the lid.', 10
from public.colour_seasons s where s.slug = 'spring';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeshadow', 'Warm Bronze', '#b07b4f', 'medium', 'any', 'Golden-bronze definition shade.', 20
from public.colour_seasons s where s.slug = 'spring';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeshadow', 'Aqua Pop', '#58c2b8', 'bold', 'evening', 'Playful aqua liner-or-lid accent.', 30
from public.colour_seasons s where s.slug = 'spring';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeliner', 'Warm Brown', '#5f4630', 'medium', 'any', 'Softer than black for warm colouring.', 10
from public.colour_seasons s where s.slug = 'spring';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeliner', 'Teal Accent', '#226f6a', 'bold', 'evening', 'Evening alternative to dark liner.', 20
from public.colour_seasons s where s.slug = 'spring';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'highlighter', 'Golden Glow', '#f2d59a', 'medium', 'any', 'Warm gold sheen on high points.', 10
from public.colour_seasons s where s.slug = 'spring';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'highlighter', 'Pearl Cream', '#f6e7cd', 'soft', 'day', 'Subtle warm pearl finish.', 20
from public.colour_seasons s where s.slug = 'spring';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'foundation', 'Warm / Golden Direction', '#e9b98b', 'soft', 'any', 'Look for bases labelled warm or golden; yellow-leaning rather than pink. Always test on the jawline in daylight.', 10
from public.colour_seasons s where s.slug = 'spring';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'lipstick', 'Rose Pink', '#c76e84', 'soft', 'day', 'Cool rose that stays gentle.', 10
from public.colour_seasons s where s.slug = 'summer';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'lipstick', 'Berry Tint', '#a35d75', 'medium', 'any', 'Muted berry for extra depth.', 20
from public.colour_seasons s where s.slug = 'summer';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'blusher', 'Soft Rose', '#dba4ad', 'soft', 'day', 'Misty rose flush.', 10
from public.colour_seasons s where s.slug = 'summer';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'blusher', 'Cool Pink', '#d590a4', 'medium', 'any', 'Cooler pink cheek colour.', 20
from public.colour_seasons s where s.slug = 'summer';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeshadow', 'Dove Grey', '#aab0b7', 'soft', 'day', 'Soft grey wash for the lid.', 10
from public.colour_seasons s where s.slug = 'summer';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeshadow', 'Mauve Mist', '#b195a2', 'medium', 'any', 'Rosy mauve crease shade.', 20
from public.colour_seasons s where s.slug = 'summer';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeshadow', 'Slate Smoke', '#6e7686', 'bold', 'evening', 'Smoky slate for evening definition.', 30
from public.colour_seasons s where s.slug = 'summer';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeliner', 'Taupe Liner', '#6b5f5c', 'soft', 'day', 'Gentler than black for soft colouring.', 10
from public.colour_seasons s where s.slug = 'summer';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeliner', 'Navy Smoke', '#3c4a63', 'medium', 'evening', 'Cool navy definition.', 20
from public.colour_seasons s where s.slug = 'summer';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'highlighter', 'Icy Pearl', '#e9edf2', 'soft', 'any', 'Cool pearl sheen.', 10
from public.colour_seasons s where s.slug = 'summer';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'highlighter', 'Rose Pearl', '#eccfd4', 'soft', 'day', 'Rose-tinted glow.', 20
from public.colour_seasons s where s.slug = 'summer';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'foundation', 'Cool / Rosy Direction', '#ddb19f', 'soft', 'any', 'Look for bases labelled cool or rosy; pink-leaning rather than yellow. Always test on the jawline in daylight.', 10
from public.colour_seasons s where s.slug = 'summer';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'lipstick', 'Terracotta', '#b35a3c', 'medium', 'any', 'Earthy terracotta that mirrors the palette.', 10
from public.colour_seasons s where s.slug = 'autumn';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'lipstick', 'Warm Nude', '#b97d5e', 'soft', 'day', 'Caramel-leaning everyday nude.', 20
from public.colour_seasons s where s.slug = 'autumn';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'blusher', 'Apricot Warmth', '#d38a5f', 'soft', 'day', 'Sun-warmed apricot flush.', 10
from public.colour_seasons s where s.slug = 'autumn';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'blusher', 'Bronzed Rose', '#b46a52', 'medium', 'any', 'Deeper bronze-rose cheek colour.', 20
from public.colour_seasons s where s.slug = 'autumn';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeshadow', 'Golden Khaki', '#a2874a', 'soft', 'day', 'Golden-green lid wash.', 10
from public.colour_seasons s where s.slug = 'autumn';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeshadow', 'Copper Shimmer', '#b76b3d', 'medium', 'any', 'Molten copper accent.', 20
from public.colour_seasons s where s.slug = 'autumn';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeshadow', 'Deep Olive', '#585c33', 'bold', 'evening', 'Smoky olive for evening.', 30
from public.colour_seasons s where s.slug = 'autumn';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeliner', 'Espresso', '#46332b', 'medium', 'any', 'Rich brown definition.', 10
from public.colour_seasons s where s.slug = 'autumn';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeliner', 'Bronze Liner', '#7f5233', 'bold', 'evening', 'Metallic-leaning warm liner.', 20
from public.colour_seasons s where s.slug = 'autumn';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'highlighter', 'Amber Gold', '#e2b26b', 'medium', 'any', 'Deep golden glow.', 10
from public.colour_seasons s where s.slug = 'autumn';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'highlighter', 'Warm Champagne', '#e6c69a', 'soft', 'day', 'Soft champagne sheen.', 20
from public.colour_seasons s where s.slug = 'autumn';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'foundation', 'Warm / Golden-Olive Direction', '#cf9a68', 'soft', 'any', 'Look for bases labelled warm, golden or olive-friendly. Always test on the jawline in daylight.', 10
from public.colour_seasons s where s.slug = 'autumn';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'lipstick', 'True Red', '#c0143c', 'bold', 'any', 'Classic blue-based red.', 10
from public.colour_seasons s where s.slug = 'winter';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'lipstick', 'Cool Fuchsia', '#b92e80', 'bold', 'evening', 'Vivid cool pink for impact.', 20
from public.colour_seasons s where s.slug = 'winter';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'blusher', 'Cool Berry', '#ab5070', 'medium', 'any', 'Berry flush with cool depth.', 10
from public.colour_seasons s where s.slug = 'winter';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'blusher', 'Icy Rose', '#d9a2b6', 'soft', 'day', 'Frosted rose for daytime.', 20
from public.colour_seasons s where s.slug = 'winter';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeshadow', 'Icy Silver', '#d5dbe4', 'soft', 'day', 'Glacial lid wash.', 10
from public.colour_seasons s where s.slug = 'winter';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeshadow', 'Cool Plum', '#6b4a75', 'medium', 'any', 'Plum crease definition.', 20
from public.colour_seasons s where s.slug = 'winter';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeshadow', 'Charcoal Smoke', '#3b3f47', 'bold', 'evening', 'True smoky eye shade.', 30
from public.colour_seasons s where s.slug = 'winter';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeliner', 'Jet Black', '#17171a', 'bold', 'any', 'Winter carries true black liner well.', 10
from public.colour_seasons s where s.slug = 'winter';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'eyeliner', 'Deep Navy', '#1c2b52', 'medium', 'evening', 'Inky navy alternative.', 20
from public.colour_seasons s where s.slug = 'winter';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'highlighter', 'Icy Pearl', '#e9eef5', 'soft', 'any', 'Cool crystalline sheen.', 10
from public.colour_seasons s where s.slug = 'winter';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'highlighter', 'Silver Sheen', '#cdd5df', 'medium', 'evening', 'Silvered glow for evening.', 20
from public.colour_seasons s where s.slug = 'winter';
insert into public.cosmetic_recommendations (season_id, product_type, name, hex, intensity, occasion, usage_note, priority)
select s.id, 'foundation', 'Cool / Neutral Direction', '#d6a795', 'soft', 'any', 'Look for bases labelled cool or neutral; avoid strongly golden bases. Always test on the jawline in daylight.', 10
from public.colour_seasons s where s.slug = 'winter';

-- Demo stores ---------------------------------------------------------
insert into public.stores (slug, name, website_url, country)
values ('coloursense-demo-boutique', 'ColourSense Demo Boutique', 'https://example.com/demo-boutique', 'MY')
on conflict (slug) do update set name = excluded.name, website_url = excluded.website_url;
insert into public.stores (slug, name, website_url, country)
values ('demo-modest-wear', 'Demo Modest Wear', 'https://example.com/demo-modest-wear', 'MY')
on conflict (slug) do update set name = excluded.name, website_url = excluded.website_url;
insert into public.stores (slug, name, website_url, country)
values ('demo-mens-essentials', 'Demo Men''s Essentials', 'https://example.com/demo-mens', 'MY')
on conflict (slug) do update set name = excluded.name, website_url = excluded.website_url;
insert into public.stores (slug, name, website_url, country)
values ('demo-beauty-counter', 'Demo Beauty Counter', 'https://example.com/demo-beauty', 'MY')
on conflict (slug) do update set name = excluded.name, website_url = excluded.website_url;

-- Demo products (clearly labelled via is_demo = true) ------------------
delete from public.products where is_demo;
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Coral Satin Blouse', 'ColourSense Demo', 'tops', 'women', 'Fluid satin blouse in a fresh warm coral.', 'https://example.com/demo/products/001-coral-satin-blouse', 89.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Coral', '#ff6f61', 64.56, 53.9, 35.18, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'spring' from public.products p
where p.product_url = 'https://example.com/demo/products/001-coral-satin-blouse';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Peach Linen Shirt Dress', 'ColourSense Demo', 'dresses', 'women', 'Breathable linen dress in a soft peach.', 'https://example.com/demo/products/002-peach-linen-shirt-dress', 129.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Peach', '#ffbe98', 82.03, 18.69, 28.32, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'spring' from public.products p
where p.product_url = 'https://example.com/demo/products/002-peach-linen-shirt-dress';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Warm Navy Oxford Shirt', 'ColourSense Demo', 'shirts', 'men', 'Classic oxford in a warm-leaning navy.', 'https://example.com/demo/products/003-warm-navy-oxford-shirt', 79.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'demo-mens-essentials'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Warm Navy', '#34426b', 28.61, 6.99, -25.66, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'spring' from public.products p
where p.product_url = 'https://example.com/demo/products/003-warm-navy-oxford-shirt';
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'autumn' from public.products p
where p.product_url = 'https://example.com/demo/products/003-warm-navy-oxford-shirt';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Turquoise Knit Top', 'ColourSense Demo', 'tops', 'women', 'Lightweight knit in lively turquoise.', 'https://example.com/demo/products/004-turquoise-knit-top', 69.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Turquoise', '#45d1c5', 76.61, -39.7, -4.99, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'spring' from public.products p
where p.product_url = 'https://example.com/demo/products/004-turquoise-knit-top';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Peach Blossom Chiffon Hijab', 'ColourSense Demo', 'hijabs', 'women', 'Airy chiffon hijab in a face-brightening peach.', 'https://example.com/demo/products/005-peach-blossom-chiffon-hijab', 25.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'demo-modest-wear'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Peach Blossom', '#f9b7a6', 80.05, 21.69, 18.06, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'spring' from public.products p
where p.product_url = 'https://example.com/demo/products/005-peach-blossom-chiffon-hijab';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Camel Trench Coat', 'ColourSense Demo', 'outerwear', 'unisex', 'Timeless trench in warm camel.', 'https://example.com/demo/products/006-camel-trench-coat', 199.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Camel', '#c19a6b', 66.15, 8.37, 30.15, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'spring' from public.products p
where p.product_url = 'https://example.com/demo/products/006-camel-trench-coat';
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'autumn' from public.products p
where p.product_url = 'https://example.com/demo/products/006-camel-trench-coat';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Coral Cream Lipstick', 'ColourSense Demo', 'cosmetics', 'unisex', 'Creamy lipstick in a fresh warm coral.', 'https://example.com/demo/products/007-coral-cream-lipstick', 39.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'demo-beauty-counter'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Warm Coral', '#e96a53', 60.12, 47.58, 36.67, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'spring' from public.products p
where p.product_url = 'https://example.com/demo/products/007-coral-cream-lipstick';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Golden Tan Leather Tote', 'ColourSense Demo', 'bags', 'unisex', 'Structured tote in golden tan.', 'https://example.com/demo/products/008-golden-tan-leather-tote', 149.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Golden Tan', '#d2a56d', 70.68, 9.62, 35.26, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'spring' from public.products p
where p.product_url = 'https://example.com/demo/products/008-golden-tan-leather-tote';
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'autumn' from public.products p
where p.product_url = 'https://example.com/demo/products/008-golden-tan-leather-tote';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Powder Blue Poplin Shirt', 'ColourSense Demo', 'shirts', 'women', 'Crisp poplin shirt in powder blue.', 'https://example.com/demo/products/009-powder-blue-poplin-shirt', 75.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Powder Blue', '#a3c1d9', 76.64, -4.78, -15.33, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'summer' from public.products p
where p.product_url = 'https://example.com/demo/products/009-powder-blue-poplin-shirt';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Lavender Knit Cardigan', 'ColourSense Demo', 'tops', 'women', 'Soft cardigan in gentle lavender.', 'https://example.com/demo/products/010-lavender-knit-cardigan', 95.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Lavender', '#b3a5d3', 70.31, 14.16, -21.51, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'summer' from public.products p
where p.product_url = 'https://example.com/demo/products/010-lavender-knit-cardigan';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Slate Grey Polo', 'ColourSense Demo', 'tops', 'men', 'Everyday polo in a cool slate grey.', 'https://example.com/demo/products/011-slate-grey-polo', 59.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'demo-mens-essentials'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Slate Grey', '#8d99a5', 62.64, -1.73, -7.73, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'summer' from public.products p
where p.product_url = 'https://example.com/demo/products/011-slate-grey-polo';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Dusty Rose Midi Skirt', 'ColourSense Demo', 'skirts', 'women', 'Flowing midi skirt in dusty rose.', 'https://example.com/demo/products/012-dusty-rose-midi-skirt', 99.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Dusty Pink', '#d8a7b1', 73.16, 19.5, 1.82, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'summer' from public.products p
where p.product_url = 'https://example.com/demo/products/012-dusty-rose-midi-skirt';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Misty Lilac Satin Hijab', 'ColourSense Demo', 'hijabs', 'women', 'Satin-finish hijab in misty lilac.', 'https://example.com/demo/products/013-misty-lilac-satin-hijab', 29.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'demo-modest-wear'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Misty Lilac', '#c9b6d4', 76.45, 12.26, -12.61, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'summer' from public.products p
where p.product_url = 'https://example.com/demo/products/013-misty-lilac-satin-hijab';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Soft Navy Blazer', 'ColourSense Demo', 'outerwear', 'women', 'Tailored blazer in a softened navy.', 'https://example.com/demo/products/014-soft-navy-blazer', 189.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Soft Navy', '#46586f', 36.8, -0.66, -15.36, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'summer' from public.products p
where p.product_url = 'https://example.com/demo/products/014-soft-navy-blazer';
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'winter' from public.products p
where p.product_url = 'https://example.com/demo/products/014-soft-navy-blazer';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Rose Pink Lipstick', 'ColourSense Demo', 'cosmetics', 'unisex', 'Satin lipstick in a cool rose.', 'https://example.com/demo/products/015-rose-pink-lipstick', 39.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'demo-beauty-counter'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Rose Pink', '#c76e84', 57.04, 37.64, 3.64, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'summer' from public.products p
where p.product_url = 'https://example.com/demo/products/015-rose-pink-lipstick';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Sea Glass Scarf', 'ColourSense Demo', 'scarves', 'unisex', 'Featherweight scarf in misty sea glass.', 'https://example.com/demo/products/016-sea-glass-scarf', 45.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Sea Glass', '#9dc3bc', 75.96, -14.07, -0.67, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'summer' from public.products p
where p.product_url = 'https://example.com/demo/products/016-sea-glass-scarf';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Terracotta Wrap Dress', 'ColourSense Demo', 'dresses', 'women', 'Wrap dress in earthy terracotta.', 'https://example.com/demo/products/017-terracotta-wrap-dress', 139.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Terracotta', '#c66b3d', 54.93, 32.38, 41.12, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'autumn' from public.products p
where p.product_url = 'https://example.com/demo/products/017-terracotta-wrap-dress';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Olive Field Jacket', 'ColourSense Demo', 'outerwear', 'men', 'Utility jacket in core olive.', 'https://example.com/demo/products/018-olive-field-jacket', 179.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'demo-mens-essentials'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Olive Green', '#737c3f', 50.0, -13.24, 31.97, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'autumn' from public.products p
where p.product_url = 'https://example.com/demo/products/018-olive-field-jacket';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Mustard Ribbed Knit', 'ColourSense Demo', 'tops', 'women', 'Ribbed knit in golden mustard.', 'https://example.com/demo/products/019-mustard-ribbed-knit', 79.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Mustard', '#cc9c33', 67.17, 7.88, 58.68, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'autumn' from public.products p
where p.product_url = 'https://example.com/demo/products/019-mustard-ribbed-knit';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Rust Flannel Shirt', 'ColourSense Demo', 'shirts', 'men', 'Brushed flannel in rich rust.', 'https://example.com/demo/products/020-rust-flannel-shirt', 85.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'demo-mens-essentials'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Rust', '#b7410e', 44.06, 45.76, 51.12, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'autumn' from public.products p
where p.product_url = 'https://example.com/demo/products/020-rust-flannel-shirt';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Warm Olive Jersey Hijab', 'ColourSense Demo', 'hijabs', 'women', 'Everyday jersey hijab in warm olive.', 'https://example.com/demo/products/021-warm-olive-jersey-hijab', 25.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'demo-modest-wear'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Warm Olive', '#7f7b4d', 50.94, -5.84, 25.71, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'autumn' from public.products p
where p.product_url = 'https://example.com/demo/products/021-warm-olive-jersey-hijab';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Chocolate Wide-Leg Trousers', 'ColourSense Demo', 'trousers', 'women', 'Wide-leg trousers in deep chocolate.', 'https://example.com/demo/products/022-chocolate-wide-leg-trousers', 119.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Chocolate Brown', '#5e4630', 31.75, 7.12, 17.22, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'autumn' from public.products p
where p.product_url = 'https://example.com/demo/products/022-chocolate-wide-leg-trousers';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Terracotta Lipstick', 'ColourSense Demo', 'cosmetics', 'unisex', 'Matte lipstick in earthy terracotta.', 'https://example.com/demo/products/023-terracotta-lipstick', 39.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'demo-beauty-counter'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Terracotta', '#b35a3c', 48.54, 33.67, 33.58, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'autumn' from public.products p
where p.product_url = 'https://example.com/demo/products/023-terracotta-lipstick';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Cognac Leather Belt', 'ColourSense Demo', 'accessories', 'unisex', 'Full-grain belt in cognac.', 'https://example.com/demo/products/024-cognac-leather-belt', 59.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Cognac Leather', '#9a5b33', 45.07, 22.11, 33.59, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'autumn' from public.products p
where p.product_url = 'https://example.com/demo/products/024-cognac-leather-belt';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'True Red Shift Dress', 'ColourSense Demo', 'dresses', 'women', 'Sharp shift dress in clear true red.', 'https://example.com/demo/products/025-true-red-shift-dress', 149.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'True Red', '#c8102e', 42.54, 65.89, 35.71, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'winter' from public.products p
where p.product_url = 'https://example.com/demo/products/025-true-red-shift-dress';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Royal Blue Merino Jumper', 'ColourSense Demo', 'tops', 'men', 'Fine merino in vivid royal blue.', 'https://example.com/demo/products/026-royal-blue-merino-jumper', 129.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'demo-mens-essentials'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Royal Blue', '#4169e1', 47.83, 26.26, -65.26, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'winter' from public.products p
where p.product_url = 'https://example.com/demo/products/026-royal-blue-merino-jumper';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Emerald Satin Blouse', 'ColourSense Demo', 'tops', 'women', 'Lustrous blouse in jewel emerald.', 'https://example.com/demo/products/027-emerald-satin-blouse', 99.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Emerald Green', '#009b77', 56.85, -43.53, 9.26, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'winter' from public.products p
where p.product_url = 'https://example.com/demo/products/027-emerald-satin-blouse';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Charcoal Wool Overcoat', 'ColourSense Demo', 'outerwear', 'men', 'Structured overcoat in deep charcoal.', 'https://example.com/demo/products/028-charcoal-wool-overcoat', 259.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'demo-mens-essentials'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Charcoal', '#3b3f46', 26.53, 0.05, -4.83, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'winter' from public.products p
where p.product_url = 'https://example.com/demo/products/028-charcoal-wool-overcoat';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Ice Grey Satin Hijab', 'ColourSense Demo', 'hijabs', 'women', 'Cool satin hijab in ice grey.', 'https://example.com/demo/products/029-ice-grey-satin-hijab', 29.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'demo-modest-wear'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Ice Grey', '#dee4ea', 90.3, -0.9, -3.61, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'winter' from public.products p
where p.product_url = 'https://example.com/demo/products/029-ice-grey-satin-hijab';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Fuchsia Evening Skirt', 'ColourSense Demo', 'skirts', 'women', 'Statement skirt in cool fuchsia.', 'https://example.com/demo/products/030-fuchsia-evening-skirt', 109.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Fuchsia', '#ca2c92', 47.54, 68.23, -18.76, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'winter' from public.products p
where p.product_url = 'https://example.com/demo/products/030-fuchsia-evening-skirt';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'True Red Lipstick', 'ColourSense Demo', 'cosmetics', 'unisex', 'Blue-based classic red lipstick.', 'https://example.com/demo/products/031-true-red-lipstick', 39.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'demo-beauty-counter'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'True Red', '#c0143c', 41.27, 63.83, 25.28, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'winter' from public.products p
where p.product_url = 'https://example.com/demo/products/031-true-red-lipstick';
with new_product as (
  insert into public.products (store_id, name, brand, category, gender, description, product_url, price, currency, availability, is_demo)
  select st.id, 'Silver Chain Necklace', 'ColourSense Demo', 'accessories', 'unisex', 'Cool-toned chain necklace.', 'https://example.com/demo/products/032-silver-chain-necklace', 49.0, 'MYR', 'in_stock', true
  from public.stores st where st.slug = 'coloursense-demo-boutique'
  returning id
)
insert into public.product_colours (product_id, colour_name, hex, lab_l, lab_a, lab_b, is_primary)
select id, 'Polished Silver', '#c7ccd4', 81.88, -0.19, -4.56, true from new_product;
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'winter' from public.products p
where p.product_url = 'https://example.com/demo/products/032-silver-chain-necklace';
insert into public.product_season_tags (product_id, season_slug)
select p.id, 'summer' from public.products p
where p.product_url = 'https://example.com/demo/products/032-silver-chain-necklace';

-- Algorithm version (full classifier config snapshot) -----------------
insert into public.algorithm_versions (version, name, config, notes, is_active)
values ('1.0.0', 'coloursense-rule-based-classifier', '{"version":"1.0.0","name":"coloursense-rule-based-classifier","description":"Versioned thresholds and weights for the ColourSense deterministic colour-analysis engine. Every number used by the pipeline lives here. See packages/colour-engine/README.md for field-by-field documentation and rationale.","image":{"maxUploadMb":10,"allowedFormats":["jpeg","png","webp"],"maxAnalysisEdgePixels":1600,"maxDecodedPixels":50000000,"minEdgePixels":320},"quality":{"minOverallScore":55,"allowLowQualityContinuation":false,"componentWeights":{"faceDetection":0.1,"faceSize":0.1,"pose":0.15,"sharpness":0.15,"exposure":0.2,"lightingConsistency":0.1,"colourCast":0.1,"usableSkinArea":0.1},"faceSize":{"minFaceWidthRatio":0.16,"goodFaceWidthRatio":0.32},"pose":{"maxYawDegrees":20,"maxPitchDegrees":20,"maxRollDegrees":15,"warnYawDegrees":12,"warnPitchDegrees":12,"warnRollDegrees":9},"blur":{"faceCropAnalysisWidth":256,"minLaplacianVariance":45,"goodLaplacianVariance":130},"exposure":{"minMeanLuma":70,"maxMeanLuma":205,"idealMeanLumaMin":95,"idealMeanLumaMax":180,"darkPixelThreshold":30,"maxDarkPixelRatio":0.28,"highlightClipThreshold":250,"maxHighlightClipRatio":0.06,"shadowClipThreshold":8,"maxShadowClipRatio":0.12,"minLocalContrast":16},"lighting":{"warnLeftRightLumaDelta":16,"maxLeftRightLumaDelta":30,"warnForeheadCheekLumaDelta":20,"maxForeheadCheekLumaDelta":36},"colourCast":{"grayWorldWeight":0.6,"faceConsistencyWeight":0.4,"warnAbShift":5.0,"maxAbShift":10.0},"skinArea":{"minUsablePixelRatio":0.35,"goodUsablePixelRatio":0.6,"minUsablePixelsPerRoi":400}},"roi":{"forehead":{"centreGlabellaToOvalTopFraction":0.52,"semiAxisWidthFactor":0.34,"semiAxisHeightFactor":0.16,"polygonVertices":36},"cheek":{"eyelidToMouthCornerFraction":0.5,"towardFaceEdgeFraction":0.28,"semiAxisWidthFactor":0.16,"semiAxisHeightFactor":0.13,"polygonVertices":36},"pixelFilter":{"minLStar":18.0,"maxLStar":93.0,"maxChroma":55.0,"highlightLStar":90.0,"highlightChromaMax":8.0,"madK":3.0,"trimmedMeanFraction":0.2}},"undertone":{"hueAngleDegrees":{"coolMax":47.0,"warmMin":53.0},"bStar":{"coolMax":14.0,"warmMin":19.0},"signalWeights":{"hueAngle":0.55,"bStar":0.3,"regionAgreement":0.15},"neutralBandWidth":0.16,"uncertainQualityBelow":60,"questionnaireWeight":0.12},"dimensions":{"value":{"lStarLightMin":65.0,"lStarDeepMax":52.0,"scoreLow":35.0,"scoreHigh":75.0},"chroma":{"mutedMax":20.0,"clearMin":27.0,"scoreLow":14.0,"scoreHigh":34.0},"contrast":{"roiSpreadLow":2.0,"roiSpreadHigh":9.0,"imageProxyWeight":0.35,"questionnaireWeight":0.65,"defaultScore":0.5}},"seasons":{"dimensionWeights":{"temperature":0.4,"value":0.25,"chroma":0.2,"contrast":0.15},"prototypes":{"spring":{"temperature":0.75,"value":0.7,"chroma":0.7,"contrast":0.55},"summer":{"temperature":0.25,"value":0.65,"chroma":0.35,"contrast":0.35},"autumn":{"temperature":0.75,"value":0.35,"chroma":0.4,"contrast":0.5},"winter":{"temperature":0.25,"value":0.35,"chroma":0.75,"contrast":0.75}}},"subSeasons":{"minConfidence":0.6,"axisThresholds":{"lightValueMin":0.62,"deepValueMax":0.38,"brightChromaMin":0.62,"softChromaMax":0.38,"strongTemperatureMin":0.7,"strongTemperatureMaxCool":0.3},"priority":{"spring":["bright-spring","light-spring","warm-spring"],"summer":["soft-summer","light-summer","cool-summer"],"autumn":["deep-autumn","soft-autumn","warm-autumn"],"winter":["bright-winter","deep-winter","cool-winter"]}},"confidence":{"factorWeights":{"imageQuality":0.3,"roiConsistency":0.2,"usableSkinArea":0.15,"classificationMargin":0.2,"colourCastPenalty":0.1,"questionnaireAgreement":0.05},"roiConsistency":{"deltaEGood":4.0,"deltaEPoor":12.0},"classificationMargin":{"marginGood":0.18,"marginPoor":0.04},"labels":{"highMin":0.8,"mediumMin":0.6}},"productMatching":{"weights":{"paletteDistance":0.5,"seasonTag":0.2,"subSeasonTag":0.1,"categoryRelevance":0.1,"availability":0.1},"deltaE00Falloff":25.0,"maxRecommendations":24}}'::jsonb, 'Initial rule-based classifier baseline.', true)
on conflict (version) do update set config = excluded.config, name = excluded.name;

-- Content pages ---------------------------------------------------------
insert into public.content_pages (slug, title, body_markdown, is_published)
values ('about-demo-data', 'About the demonstration data', 'The stores and products shown in this application are **seeded demonstration records** created for the Final Year Project evaluation. They illustrate how colour-matched product recommendations work. External links point to placeholder pages; no live marketplace data is used and no purchases can be made here.', true)
on conflict (slug) do update set title = excluded.title, body_markdown = excluded.body_markdown, is_published = excluded.is_published;

-- System settings --------------------------------------------------------
insert into public.system_settings (key, value, description)
values ('app.product_name', '"ColourSense"'::jsonb, 'Display name of the product; configurable without refactoring.')
on conflict (key) do update set value = excluded.value, description = excluded.description;
insert into public.system_settings (key, value, description)
values ('analysis.allow_low_quality_continuation', 'false'::jsonb, 'Permit analyses below the minimum quality score (results flagged low-confidence).')
on conflict (key) do update set value = excluded.value, description = excluded.description;
insert into public.system_settings (key, value, description)
values ('products.max_recommendations', '24'::jsonb, 'Maximum products returned by the recommendation endpoint.')
on conflict (key) do update set value = excluded.value, description = excluded.description;
insert into public.system_settings (key, value, description)
values ('storage.signed_url_ttl_seconds', '300'::jsonb, 'Lifetime of signed URLs issued for stored analysis images.')
on conflict (key) do update set value = excluded.value, description = excluded.description;

commit;
