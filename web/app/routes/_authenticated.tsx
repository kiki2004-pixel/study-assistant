import { useEffect, useLayoutEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useAuth } from "react-oidc-context";
import { Box } from "@chakra-ui/react";
import { AuthenticatedNavbar } from "@app/components/navbar/authenticated-navbar";
import { setToken } from "@lib/token-store";

export default function AuthenticatedLayout() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate("/");
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);

  useLayoutEffect(() => {
    if (auth.user?.access_token) setToken(auth.user.access_token);
    return () => setToken(null);
  }, [auth.user?.access_token]);

  if (auth.isLoading || !auth.isAuthenticated) return null;

  return (
    <Box minH="100vh" bg="bg">
      <AuthenticatedNavbar />
      <Outlet />
    </Box>
  );
}
