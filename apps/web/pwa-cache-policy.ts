type RuntimeRequest = { url: URL; request: Request };

// Workbox serializes each callback into the worker. Keep their runtime dependencies inside the function.
export function isPublicApiRequest({ url, request }: RuntimeRequest): boolean {
  return (
    url.origin === 'https://rickandmortyapi.com' &&
    /^\/api\/(character|location|episode)(\/[1-9]\d*(,[1-9]\d*)*)?\/?$/.test(url.pathname) &&
    [...url.searchParams].every(([name, value]) => name === 'page' && /^[1-9]\d*$/.test(value)) &&
    request.credentials === 'omit' &&
    !request.headers.has('Authorization') &&
    !request.headers.has('Cookie') &&
    !request.headers.has('Range')
  );
}

export async function getCacheablePublicApiResponse({ response }: { response: Response }): Promise<Response | null> {
  const cacheControl = response.headers.get('Cache-Control') ?? '';
  const vary = (response.headers.get('Vary') ?? '')
    .toLowerCase()
    .split(',')
    .map((name) => name.trim());
  return response.status === 200 &&
    /^application\/json\b/i.test(response.headers.get('Content-Type') ?? '') &&
    !/(?:^|,)\s*(private|no-store)\b/i.test(cacheControl) &&
    !vary.some((name) => name === '*' || name === 'authorization' || name === 'cookie')
    ? response
    : null;
}

export async function createOfflineCacheMissResponse(): Promise<Response> {
  return new Response(JSON.stringify({ error: 'Content is not cached for offline use' }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Rick-and-Morty-Offline': '1',
    },
  });
}

export function isCharacterImageRequest({ url, request }: RuntimeRequest): boolean {
  return (
    url.origin === 'https://rickandmortyapi.com' &&
    /^\/api\/character\/avatar\/[1-9]\d*\.jpeg$/.test(url.pathname) &&
    !url.search &&
    request.destination === 'image' &&
    request.credentials !== 'include'
  );
}
