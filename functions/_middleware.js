/* Cloudflare Pages middleware — keep preview deployments out of search
   indexes. Every *.pages.dev hostname (including branch previews) gets an
   X-Robots-Tag header; the production domain is untouched. */
export async function onRequest(context) {
  const response = await context.next();
  const hostname = new URL(context.request.url).hostname;

  if (hostname.endsWith('.pages.dev')) {
    const noindexed = new Response(response.body, response);
    noindexed.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return noindexed;
  }

  return response;
}
