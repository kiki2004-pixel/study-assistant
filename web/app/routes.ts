import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("lists", "routes/lists.tsx"),
  route("integrations", "routes/integrations.tsx"),
  route("docs", "routes/docs.tsx"),
  route("api", "routes/api.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
  route("settings", "routes/settings.tsx", [
    index("routes/settings.index.tsx"),
    route("general", "routes/settings.general.tsx"),
    route("account", "routes/settings.account.tsx"),
    route("analytics", "routes/settings.analytics.tsx"),
    route("history", "routes/settings.history.tsx"),
  ]),
] satisfies RouteConfig;
