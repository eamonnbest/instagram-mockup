-- Create editorial-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('editorial-images', 'editorial-images', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to editorial images
CREATE POLICY "Public can view editorial images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'editorial-images');

-- Allow authenticated uploads (via service role)
CREATE POLICY "Service role can upload editorial images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'editorial-images');

-- Allow service role to update/delete
CREATE POLICY "Service role can update editorial images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'editorial-images');
