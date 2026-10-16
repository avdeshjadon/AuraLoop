export function unsplash(id, { w = 800, h, q = 80, crop = 'crop' } = {}) {
  const params = new URLSearchParams({
    auto: 'format',
    fit: crop,
    w: String(w),
    q: String(q),
  });
  if (h) params.set('h', String(h));
  return `https://images.unsplash.com/photo-${id}?${params.toString()}`;
}
