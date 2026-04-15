import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
  route("settings", "routes/settings.tsx", [
    index("routes/settings.index.tsx"),
    route("general", "routes/settings.general.tsx"),
    route("account", "routes/settings.account.tsx"),
    route("analytics", "routes/settings.analytics.tsx"),
    route("history", "routes/settings.history.tsx"),
  ]),
] satisfies RouteConfig;
