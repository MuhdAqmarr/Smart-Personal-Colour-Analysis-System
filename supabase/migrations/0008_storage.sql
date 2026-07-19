-- 0008_storage.sql — private bucket for opt-in analysis images.
--
-- Object paths are ALWAYS `<user_id>/<analysis_id>.<ext>`; policies bind the
-- first path segment to auth.uid(), so an owner can only ever touch their
-- own objects. The bucket is private: the frontend never receives permanent
-- URLs — the backend issues short-lived signed URLs to the owner only.
--
-- Wrapped in a conditional block so the migration also applies cleanly to
-- local/CI PostgreSQL instances that have no Supabase storage schema.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'storage' and table_name = 'buckets'
  ) then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'analysis-images',
      'analysis-images',
      false,
      10485760, -- 10 MB, mirrors MAX_IMAGE_SIZE_MB
      array['image/jpeg', 'image/png', 'image/webp']
    )
    on conflict (id) do nothing;

    execute $pol$
      create policy "analysis_images_owner_select" on storage.objects
        for select using (
          bucket_id = 'analysis-images'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
    $pol$;

    execute $pol$
      create policy "analysis_images_owner_insert" on storage.objects
        for insert with check (
          bucket_id = 'analysis-images'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
    $pol$;

    execute $pol$
      create policy "analysis_images_owner_update" on storage.objects
        for update using (
          bucket_id = 'analysis-images'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
        with check (
          bucket_id = 'analysis-images'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
    $pol$;

    execute $pol$
      create policy "analysis_images_owner_delete" on storage.objects
        for delete using (
          bucket_id = 'analysis-images'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
    $pol$;
  end if;
end;
$$;
