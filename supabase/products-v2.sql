-- Daha önce products tablosunu oluşturduysanız bu dosya güvenle tekrar çalıştırılabilir.
create table if not exists public.products (
  id bigserial primary key,
  product_code text unique not null,
  product_name text not null,
  product_group text,
  purchase_price numeric(12,2) default 0,
  profit_margin numeric(5,2) default 0,
  vat numeric(5,2) default 20,
  sale_price numeric(12,2) default 0,
  stock integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_products_code on public.products(product_code);
alter table public.products enable row level security;
drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (true);
