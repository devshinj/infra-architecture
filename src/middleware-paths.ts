const PUBLIC = [/^\/login$/, /^\/signup$/, /^\/reset(\/.*)?$/, /^\/api\/auth(\/.*)?$/];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC.some((re) => re.test(pathname));
}
