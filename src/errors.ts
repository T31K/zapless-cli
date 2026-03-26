export function handleApiError(err: any): never {
  const status = err.response?.status;
  const message = err.response?.data?.error ?? err.message;

  if (status === 403 && err.response?.data?.upgrade_url) {
    console.error(`\n✗ ${message}`);
    console.error(`  → ${err.response.data.upgrade_url}\n`);
  } else {
    console.error(`✗ ${message}`);
  }

  process.exit(1);
}
