import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { ChakraProvider } from "@chakra-ui/react";
import { AuthProvider } from "react-oidc-context";
import { system } from "./theme";

import type { Route } from "./+types/root";

const oidcConfig = {
  authority:
    import.meta.env.VITE_OIDC_AUTHORITY || "http://localhost:8080/realms/master",
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || "app",
  redirect_uri:
    import.meta.env.VITE_OIDC_REDIRECT_URI ||
    "http://localhost:5173/auth/callback",
  post_logout_redirect_uri:
    import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI ||
    "http://localhost:5173",
  scope: "openid profile email",
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        <ChakraProvider value={system}>
          <AuthProvider {...oidcConfig}>{children}</AuthProvider>
        </ChakraProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
