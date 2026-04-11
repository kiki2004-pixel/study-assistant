import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("lists", "routes/lists.tsx"),
  route("integrations", "routes/integrations.tsx"),
  route("docs", "routes/docs.tsx"),
  route("api", "routes/api.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
] satisfies RouteConfig;
