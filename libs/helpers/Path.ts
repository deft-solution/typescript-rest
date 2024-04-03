
export function pathResolver(classPath: string, methodPath: string): string {
  const classPathResolve = resolvingPathString(classPath);
  const methodPathResolve = resolvingPathString(methodPath);
  return [classPathResolve, methodPathResolve].join('');
}

function resolvingPathString(path: string) {
  path = path.trim();
  let resolvePath = path.startsWith('/') ? path : ['/', path].join('');
  resolvePath = resolvePath.endsWith('/') ? resolvePath.slice(0, resolvePath.length - 1) : resolvePath;
  return resolvePath;
}