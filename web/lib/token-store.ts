let _token: string | null = null;

export function setToken(token: string | null): void {
  _token = token;
}

export function getToken(): string {
  if (!_token)
    throw new Error(
      "[token-store] No token set — is _authenticated.tsx mounted?",
    );
  return _token;
}
