type StorageClient = {
  storage: {
    from: (bucket: string) => {
      list: (
        path?: string,
        options?: { limit?: number; offset?: number; search?: string },
      ) => Promise<{ data: Array<{ name: string }> | null; error: Error | null }>;
    };
  };
};

export async function ensureObjectExists(
  supabase: StorageClient,
  bucket: string,
  objectPath: string,
) {
  const segments = objectPath.split("/");
  const fileName = segments.pop();
  const folder = segments.join("/");

  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    search: fileName,
  });

  if (error) {
    throw error;
  }

  const exists = (data ?? []).some((item) => item.name === fileName);

  if (!exists) {
    throw new Error(`Missing uploaded file: ${bucket}/${objectPath}`);
  }
}
