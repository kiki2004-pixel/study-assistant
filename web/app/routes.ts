import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
  layout("routes/_authenticated.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    route("lists", "routes/lists.tsx"),
    route("integrations", "routes/integrations.tsx"),
    route("api/docs", "routes/docs.tsx"),
    route("api/keys", "routes/api.tsx"),
    route("settings", "routes/settings.tsx", [
      index("routes/settings.index.tsx"),
      route("general", "routes/settings.general.tsx"),
      route("account", "routes/settings.account.tsx"),
      route("analytics", "routes/settings.analytics.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
