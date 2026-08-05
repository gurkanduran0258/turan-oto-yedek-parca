-- Mevcut products tablosuna ürün görseli alanını ekler.
alter table public.products add column if not exists image_url text;

-- Ürün görselleri için public storage bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true;

-- Public görsel okuma politikası.
drop policy if exists "product images public read" on storage.objects;
create policy "product images public read"
on storage.objects for select
using (bucket_id = 'product-images');
