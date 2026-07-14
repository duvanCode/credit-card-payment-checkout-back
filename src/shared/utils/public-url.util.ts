type HeaderValue = string | string[] | undefined;

interface RequestLike {
  protocol?: string;
  get?(name: string): string | undefined;
  headers?: Record<string, HeaderValue>;
}

function normalizeHeaderValue(value: HeaderValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getHeader(request: RequestLike, name: string): string | undefined {
  const directValue = request.get?.(name);

  if (directValue) {
    return directValue;
  }

  return normalizeHeaderValue(request.headers?.[name]);
}

export function getPublicBaseUrl(request: RequestLike): string {
  const forwardedProto = getHeader(request, 'x-forwarded-proto')
    ?.split(',')[0]
    ?.trim();
  const forwardedHost = getHeader(request, 'x-forwarded-host')
    ?.split(',')[0]
    ?.trim();
  const host =
    forwardedHost ??
    getHeader(request, 'host') ??
    `localhost:${process.env.PORT ?? '3000'}`;
  const protocol = forwardedProto ?? request.protocol ?? 'http';

  return `${protocol}://${host}`.replace(/\/$/, '');
}

export function getPublicImageUrl(
  imagePath: string,
  request: RequestLike,
): string {
  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  const normalizedPath = imagePath.replace(/^\/+/, '');
  const assetPath = normalizedPath.startsWith('imagenes/')
    ? normalizedPath
    : `imagenes/${normalizedPath}`;

  return `${getPublicBaseUrl(request)}/${assetPath}`;
}
