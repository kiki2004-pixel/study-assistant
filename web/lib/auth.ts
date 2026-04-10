import type { AuthProviderProps } from "react-oidc-context";

export const oidcConfig: AuthProviderProps = {
  authority:
    import.meta.env.VITE_OIDC_AUTHORITY || "http://localhost:8080",
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || "app",
  redirect_uri:
    import.meta.env.VITE_OIDC_REDIRECT_URI ||
    "http://localhost:5173/auth/callback",
  post_logout_redirect_uri:
    import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI ||
    "http://localhost:5173",
  scope: "openid profile email",
};
