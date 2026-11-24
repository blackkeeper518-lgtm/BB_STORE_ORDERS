-- Theme Studio: typography colors and uploaded background graphics
alter table public.app_themes
  add column if not exists text_primary_color text not null default '#FFFFFF',
  add column if not exists text_secondary_color text not null default '#B8A8BB',
  add column if not exists font_body text not null default 'Noto Sans Thai',
  add column if not exists font_heading text not null default 'Chakra Petch',
  add column if not exists graphic_url text not null default '';

-- Create this bucket as public in Supabase Storage before using the upload control.
-- Bucket name: theme-graphics
-- The app stores only the public URL in app_themes.graphic_url.

update public.app_themes
set
  text_primary_color = coalesce(nullif(text_primary_color, ''), '#FFFFFF'),
  text_secondary_color = coalesce(nullif(text_secondary_color, ''), '#B8A8BB'),
  font_body = coalesce(nullif(font_body, ''), 'Noto Sans Thai'),
  font_heading = coalesce(nullif(font_heading, ''), 'Chakra Petch'),
  graphic_url = coalesce(graphic_url, '');
