export function resolveSiteOrigin(environment = process.env) {
  const configured = environment.SITE_URL || environment.VERCEL_PROJECT_PRODUCTION_URL || environment.VERCEL_URL;
  if (!configured) {
    if (environment.VERCEL === '1') {
      throw new Error('Enable Vercel System Environment Variables or set SITE_URL to your public HTTPS domain, then redeploy.');
    }
    return 'http://localhost:5173';
  }
  const value = configured.trim();
  const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('SITE_URL must be a public HTTP(S) website origin without credentials.');
  }
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Use HTTPS for the public SITE_URL so link previews can load securely.');
  }
  return url.origin;
}

export function applySocialMetadata(html, origin) {
  const home = new URL('/', origin).href;
  const image = new URL('/assets/femmora-share-logo.jpg', origin).href;
  const values = new Map([
    ['og:url', home],
    ['og:image', image],
    ['og:image:secure_url', image],
    ['twitter:image', image],
  ]);
  let output = html;
  for (const [name, value] of values) {
    const pattern = new RegExp(`(<meta (?:property|name)="${name}" content=")[^"]*("\\s*\\/?>)`);
    if (!pattern.test(output)) throw new Error(`Missing social metadata field: ${name}`);
    output = output.replace(pattern, (_, start, end) => start + value + end);
  }
  const canonical = /(<link rel="canonical" href=")[^"]*("\s*\/?>)/;
  if (!canonical.test(output)) throw new Error('Missing canonical URL.');
  return output.replace(canonical, (_, start, end) => start + home + end);
}
