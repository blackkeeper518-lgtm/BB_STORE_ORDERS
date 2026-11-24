-- WARP DRIVE IMAGE STORAGE
-- รันใน Supabase SQL Editor ของโปรเจกต์เดียวกับที่กรอกในหน้า WarpDrive
-- ใช้ publishable/anon key จากเว็บได้ เพราะ policy เปิดเฉพาะ bucket นี้และโฟลเดอร์ warp/

insert into storage.buckets (id, name, public)
values ('warp-images', 'warp-images', true)
on conflict (id) do update set public = true;

do $$
begin
  create policy "warp images public read"
    on storage.objects for select
    to public
    using (bucket_id = 'warp-images');
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "warp images anon upload"
    on storage.objects for insert
    to anon, authenticated
    with check (
      bucket_id = 'warp-images'
      and name like 'warp/%'
    );
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "warp images owner update"
    on storage.objects for update
    to anon, authenticated
    using (bucket_id = 'warp-images' and name like 'warp/%')
    with check (bucket_id = 'warp-images' and name like 'warp/%');
exception when duplicate_object then null;
end $$;
