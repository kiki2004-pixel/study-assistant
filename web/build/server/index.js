import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, useNavigate, useLocation, NavLink, Navigate } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { defineConfig, createSystem, defaultConfig, ChakraProvider, Box, Container, Flex, Icon, Text, Button, Grid, Link, Heading, Badge, Input, SimpleGrid, Tabs, Accordion, Span, Popover, Portal, Menu, Avatar, Field, Spinner, VStack, Switch, Table, Pagination } from "@chakra-ui/react";
import { AuthProvider, useAuth } from "react-oidc-context";
import { useState, useRef, useEffect, useCallback } from "react";
import { FiCheckCircle, FiChevronDown, FiX, FiMenu, FiMail, FiCalendar, FiMessageSquare, FiFileText, FiShield, FiArrowRight, FiXCircle, FiAlertTriangle, FiAlertCircle, FiCheck, FiUpload, FiMoreHorizontal, FiInbox } from "react-icons/fi";
import { FaUser } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders
    });
  }
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const customConfig = defineConfig({
  globalCss: {
    body: {
      bg: "bg",
      color: "fg",
      fontFamily: "body"
    }
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'Instrument Serif', Georgia, serif" },
        body: { value: "'DM Sans', system-ui, sans-serif" },
        mono: { value: "'Geist Mono', 'Courier New', monospace" }
      },
      colors: {
        brand: {
          50: { value: "#F0FDF4" },
          100: { value: "#DCFCE7" },
          200: { value: "#BBF7D0" },
          300: { value: "#86EFAC" },
          400: { value: "#4ADE80" },
          500: { value: "#22C55E" },
          600: { value: "#16A34A" },
          700: { value: "#15803D" },
          800: { value: "#166534" },
          900: { value: "#14532D" }
        },
        accent: {
          50: { value: "#FFFDE7" },
          100: { value: "#FFF9C4" },
          200: { value: "#FFF176" },
          300: { value: "#FFE835" },
          400: { value: "#FFD600" },
          500: { value: "#FFC400" },
          600: { value: "#FFB300" },
          700: { value: "#FF8F00" },
          800: { value: "#FF6F00" },
          900: { value: "#E65100" }
        }
      }
    },
    semanticTokens: {
      colors: {
        bg: {
          value: { base: "#F5F5F0", _dark: "#0D0D0D" }
        },
        "bg.subtle": {
          value: { base: "#FFFFFF", _dark: "#1A1A1A" }
        },
        "bg.muted": {
          value: { base: "#E8E8E2", _dark: "#2A2A2A" }
        },
        fg: {
          value: { base: "#111111", _dark: "#F5F5F0" }
        },
        "fg.muted": {
          value: { base: "#555555", _dark: "#AAAAAA" }
        },
        border: {
          value: { base: "#D4D4CF", _dark: "#333333" }
        },
        "brand.solid": {
          value: { base: "#22C55E", _dark: "#22C55E" }
        },
        "brand.contrast": {
          value: { base: "#FFFFFF", _dark: "#FFFFFF" }
        },
        "accent.solid": {
          value: { base: "#FFD600", _dark: "#FFD600" }
        },
        "accent.contrast": {
          value: { base: "#111111", _dark: "#111111" }
        },
        // Validation state colours (from DESIGN.md)
        "valid.bg": { value: { base: "#DCFCE7", _dark: "#14532D" } },
        "valid.fg": { value: { base: "#15803D", _dark: "#86EFAC" } },
        "valid.border": { value: { base: "#BBF7D0", _dark: "#166534" } },
        "invalid.bg": { value: { base: "#FEE2E2", _dark: "#450A0A" } },
        "invalid.fg": { value: { base: "#B91C1C", _dark: "#FCA5A5" } },
        "invalid.border": { value: { base: "#FECACA", _dark: "#7F1D1D" } },
        "risky.bg": { value: { base: "#FEF9C3", _dark: "#422006" } },
        "risky.fg": { value: { base: "#854D0E", _dark: "#FDE68A" } },
        "risky.border": { value: { base: "#FDE68A", _dark: "#713F12" } }
      }
    }
  }
});
const system = createSystem(defaultConfig, customConfig);
const oidcConfig = {
  authority: "http://localhost:8080",
  client_id: "368536380004958212",
  redirect_uri: "http://localhost:5173/auth/callback",
  post_logout_redirect_uri: "http://localhost:5173",
  scope: "openid profile email"
};
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx("link", {
        rel: "preconnect",
        href: "https://fonts.googleapis.com"
      }), /* @__PURE__ */ jsx("link", {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous"
      }), /* @__PURE__ */ jsx("link", {
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Geist+Mono:wght@400;500;600&display=swap",
        rel: "stylesheet"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      suppressHydrationWarning: true,
      children: [/* @__PURE__ */ jsx(ChakraProvider, {
        value: system,
        children: /* @__PURE__ */ jsx(AuthProvider, {
          ...oidcConfig,
          children
        })
      }), /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root
}, Symbol.toStringTag, { value: "Module" }));
const NAV_LINKS$1 = [
  { label: "Products", hasDropdown: true },
  { label: "Pricing", hasDropdown: false, href: "#pricing" },
  { label: "Docs", hasDropdown: true },
  { label: "About", hasDropdown: false }
];
function UnauthenticatedNavbar() {
  const auth = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  return /* @__PURE__ */ jsxs(Box, { position: "sticky", top: 0, zIndex: 100, bg: "bg", children: [
    /* @__PURE__ */ jsx(Box, { py: 4, children: /* @__PURE__ */ jsx(Container, { maxW: "7xl", children: /* @__PURE__ */ jsxs(Flex, { align: "center", justify: "space-between", children: [
      /* @__PURE__ */ jsxs(Flex, { align: "center", gap: 3, children: [
        /* @__PURE__ */ jsx(
          Box,
          {
            bg: "#1a1a1a",
            borderRadius: "lg",
            w: "36px",
            h: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            children: /* @__PURE__ */ jsx(Icon, { as: FiCheckCircle, color: "white", boxSize: 4 })
          }
        ),
        /* @__PURE__ */ jsx(Text, { fontWeight: "bold", fontSize: "lg", letterSpacing: "-0.02em", children: "scrub_" })
      ] }),
      /* @__PURE__ */ jsx(Flex, { align: "center", gap: 7, display: { base: "none", md: "flex" }, children: NAV_LINKS$1.map((link) => /* @__PURE__ */ jsxs(
        Flex,
        {
          align: "center",
          gap: 1,
          cursor: "pointer",
          color: "fg.muted",
          _hover: { color: "fg" },
          transition: "color 0.15s",
          children: [
            /* @__PURE__ */ jsx(Text, { fontSize: "sm", fontWeight: "medium", children: link.label }),
            link.hasDropdown && /* @__PURE__ */ jsx(Icon, { as: FiChevronDown, boxSize: 3.5 })
          ]
        },
        link.label
      )) }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          size: "sm",
          variant: "outline",
          color: "fg",
          border: "1px solid",
          borderColor: "fg",
          borderRadius: "lg",
          px: 5,
          h: "44px",
          fontWeight: "medium",
          _hover: { bg: "bg.muted" },
          display: { base: "none", md: "flex" },
          loading: auth.isLoading,
          onClick: () => auth.signinRedirect(),
          children: [
            /* @__PURE__ */ jsx(FaUser, {}),
            " Sign In"
          ]
        }
      ),
      /* @__PURE__ */ jsx(Box, { display: { base: "flex", md: "none" }, children: /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => setMenuOpen((o) => !o),
          "aria-label": menuOpen ? "Close menu" : "Open menu",
          children: /* @__PURE__ */ jsx(Icon, { as: menuOpen ? FiX : FiMenu, boxSize: 5 })
        }
      ) })
    ] }) }) }),
    menuOpen && /* @__PURE__ */ jsx(
      Box,
      {
        display: { base: "block", md: "none" },
        borderTopWidth: "1px",
        borderColor: "border",
        bg: "bg.subtle",
        children: /* @__PURE__ */ jsx(Container, { maxW: "7xl", py: 4, children: /* @__PURE__ */ jsxs(Flex, { direction: "column", gap: 1, children: [
          NAV_LINKS$1.map((link) => /* @__PURE__ */ jsxs(
            Flex,
            {
              align: "center",
              justify: "space-between",
              px: 3,
              py: 3,
              borderRadius: "md",
              cursor: "pointer",
              _hover: { bg: "bg.muted" },
              transition: "background 0.15s",
              onClick: () => setMenuOpen(false),
              children: [
                /* @__PURE__ */ jsx(Text, { fontSize: "sm", fontWeight: "medium", children: link.label }),
                link.hasDropdown && /* @__PURE__ */ jsx(Icon, { as: FiChevronDown, boxSize: 4, color: "fg.muted" })
              ]
            },
            link.label
          )),
          /* @__PURE__ */ jsx(Box, { pt: 3, borderTopWidth: "1px", borderColor: "border", mt: 2, children: /* @__PURE__ */ jsx(
            Button,
            {
              w: "full",
              variant: "outline",
              borderColor: "border",
              color: "fg",
              borderRadius: "lg",
              fontWeight: "medium",
              _hover: { bg: "bg.muted" },
              loading: auth.isLoading,
              onClick: () => {
                setMenuOpen(false);
                auth.signinRedirect();
              },
              children: "Sign In"
            }
          ) })
        ] }) })
      }
    )
  ] });
}
const QUICK_LINKS = ["Products", "Pricing", "Docs", "About", "Blog"];
const LEGAL_LINKS = ["Privacy Policy", "Terms of Service", "Cookie Settings"];
function Footer() {
  return /* @__PURE__ */ jsxs(Box, { bg: "bg", borderTopWidth: "1px", borderColor: "border", children: [
    /* @__PURE__ */ jsx(Container, { maxW: "6xl", children: /* @__PURE__ */ jsxs(
      Grid,
      {
        templateColumns: { base: "1fr", md: "1fr auto" },
        gap: { base: 10, md: 20 },
        py: { base: 12, md: 16 },
        children: [
          /* @__PURE__ */ jsxs(Flex, { direction: "column", gap: 6, maxW: "sm", children: [
            /* @__PURE__ */ jsxs(Flex, { align: "center", gap: 2.5, children: [
              /* @__PURE__ */ jsx(
                Box,
                {
                  bg: "fg",
                  borderRadius: "lg",
                  w: 8,
                  h: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  children: /* @__PURE__ */ jsx(Icon, { as: FiCheckCircle, color: "bg", boxSize: 4 })
                }
              ),
              /* @__PURE__ */ jsx(Text, { fontWeight: "bold", fontSize: "lg", letterSpacing: "-0.02em", children: "scrub_" })
            ] }),
            /* @__PURE__ */ jsx(Text, { fontSize: "sm", color: "fg.muted", lineHeight: 1.7, children: "Scrub is an email hygiene tool that removes invalid recipients, blocks fake users and bots, and helps you protect your sender reputation." }),
            /* @__PURE__ */ jsxs(Text, { fontSize: "sm", color: "fg.muted", children: [
              "Powered by",
              " ",
              /* @__PURE__ */ jsx(
                Link,
                {
                  href: "https://n0.rocks",
                  target: "_blank",
                  rel: "noopener noreferrer",
                  color: "fg",
                  fontWeight: "medium",
                  _hover: { textDecoration: "underline" },
                  children: "n0."
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs(Flex, { direction: "column", gap: 4, children: [
            /* @__PURE__ */ jsx(Text, { fontWeight: "semibold", fontSize: "sm", letterSpacing: "0.01em", children: "Quick Links" }),
            /* @__PURE__ */ jsx(Flex, { direction: "column", gap: 3, children: QUICK_LINKS.map((link) => /* @__PURE__ */ jsx(
              Link,
              {
                href: "#",
                fontSize: "sm",
                color: "fg.muted",
                _hover: { color: "fg", textDecoration: "none" },
                transition: "color 0.15s",
                children: link
              },
              link
            )) })
          ] })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(Box, { borderTopWidth: "1px", borderColor: "border", children: /* @__PURE__ */ jsx(Container, { maxW: "6xl", children: /* @__PURE__ */ jsxs(
      Flex,
      {
        py: 5,
        align: "center",
        justify: "space-between",
        direction: { base: "column", sm: "row" },
        gap: 3,
        children: [
          /* @__PURE__ */ jsxs(Text, { fontSize: "xs", color: "fg.muted", children: [
            "© ",
            (/* @__PURE__ */ new Date()).getFullYear(),
            " The Scrub App — All rights reserved"
          ] }),
          /* @__PURE__ */ jsx(Flex, { gap: 5, children: LEGAL_LINKS.map((link) => /* @__PURE__ */ jsx(
            Link,
            {
              href: "#",
              fontSize: "xs",
              color: "fg.muted",
              _hover: { color: "fg", textDecoration: "none" },
              transition: "color 0.15s",
              children: link
            },
            link
          )) })
        ]
      }
    ) }) })
  ] });
}
function FloatingCard({
  icon,
  iconBg,
  iconColor,
  top,
  left,
  right,
  transform
}) {
  return /* @__PURE__ */ jsx(
    Box,
    {
      position: "absolute",
      top,
      left,
      right,
      transform,
      display: { base: "none", xl: "block" },
      zIndex: 1,
      children: /* @__PURE__ */ jsx(
        Box,
        {
          bg: "bg.subtle",
          border: "1px solid",
          borderColor: "border",
          borderRadius: "2xl",
          p: 3,
          shadow: "sm",
          children: /* @__PURE__ */ jsx(
            Flex,
            {
              align: "center",
              justify: "center",
              w: 10,
              h: 10,
              borderRadius: "xl",
              bg: iconBg,
              children: /* @__PURE__ */ jsx(Icon, { as: icon, boxSize: 5, color: iconColor })
            }
          )
        }
      )
    }
  );
}
function HeroSection() {
  return /* @__PURE__ */ jsxs(Box, { position: "relative", py: { base: 16, md: 24 }, overflow: "hidden", children: [
    /* @__PURE__ */ jsx(
      Box,
      {
        position: "absolute",
        inset: 0,
        style: {
          backgroundImage: "radial-gradient(circle, #C0C0BA 1.5px, transparent 1.5px)",
          backgroundSize: "40px 40px"
        },
        opacity: 0.55
      }
    ),
    /* @__PURE__ */ jsx(
      FloatingCard,
      {
        icon: FiMail,
        iconBg: "red.100",
        iconColor: "red.400",
        top: "14%",
        left: "7%"
      }
    ),
    /* @__PURE__ */ jsx(
      FloatingCard,
      {
        icon: FiCalendar,
        iconBg: "blue.100",
        iconColor: "blue.500",
        top: "14%",
        right: "7%"
      }
    ),
    /* @__PURE__ */ jsx(
      FloatingCard,
      {
        icon: FiMessageSquare,
        iconBg: "purple.100",
        iconColor: "purple.500",
        top: "50%",
        left: "4%",
        transform: "translateY(-50%)"
      }
    ),
    /* @__PURE__ */ jsx(
      FloatingCard,
      {
        icon: FiFileText,
        iconBg: "brand.100",
        iconColor: "brand.600",
        top: "50%",
        right: "4%",
        transform: "translateY(-50%)"
      }
    ),
    /* @__PURE__ */ jsxs(Container, { maxW: "3xl", textAlign: "center", position: "relative", zIndex: 2, children: [
      /* @__PURE__ */ jsx(Flex, { justify: "center", mb: 6, children: /* @__PURE__ */ jsxs(
        Flex,
        {
          align: "center",
          gap: 2,
          bg: "bg.subtle",
          border: "1px solid",
          borderColor: "border",
          borderRadius: "full",
          px: 4,
          py: 1.5,
          shadow: "sm",
          children: [
            /* @__PURE__ */ jsx(Icon, { as: FiShield, boxSize: 3.5, color: "fg.muted" }),
            /* @__PURE__ */ jsx(
              Text,
              {
                fontSize: "xs",
                fontWeight: "medium",
                color: "fg.muted",
                letterSpacing: "0.01em",
                children: "No credit card required to get started"
              }
            )
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs(
        Heading,
        {
          as: "h1",
          fontFamily: "heading",
          fontWeight: "400",
          fontSize: { base: "3xl", md: "5xl", lg: "6xl" },
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          mb: 6,
          children: [
            "Remove",
            " ",
            /* @__PURE__ */ jsx(Box, { as: "span", fontStyle: "italic", color: "red.400", children: "invalid" }),
            " ",
            "emails, block",
            " ",
            /* @__PURE__ */ jsx(Box, { as: "span", fontStyle: "italic", color: "red.400", children: "fake" }),
            " ",
            "users and bots"
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        Text,
        {
          color: "fg.muted",
          fontSize: { base: "md", md: "lg" },
          mb: 10,
          maxW: "xl",
          mx: "auto",
          children: "Validate email lists, protect your sender reputation, prevent fraud, and save money on every campaign. Scrub keeps your deliverability high."
        }
      ),
      /* @__PURE__ */ jsx(Flex, { justify: "center", children: /* @__PURE__ */ jsxs(
        Button,
        {
          size: "lg",
          bg: "brand.solid",
          color: "brand.contrast",
          border: "1px solid",
          borderColor: "fg",
          borderRadius: "lg",
          px: 8,
          fontWeight: "semibold",
          _hover: { bg: "brand.600" },
          children: [
            "Get Started Free ",
            /* @__PURE__ */ jsx(FiArrowRight, {})
          ]
        }
      ) })
    ] })
  ] });
}
const DIRTY_EMAILS = [
  "john@gmail.com",
  "JOHN@GMAIL.COM",
  "test123@",
  "not-an-email",
  "user@disposable.xyz",
  "spam_bot@ru.com",
  "john@gmail.com",
  "@missinguser.co"
];
const PLACEHOLDER_EMAILS = [
  "john.doe@company.com",
  "marketing@startup.io",
  "newsletter@brand.co",
  "user@example.com",
  "contact@business.org"
];
const VALIDATED_EMAILS = [
  { email: "john@gmail.com", status: "valid" },
  { email: "JOHN@GMAIL.COM", status: "duplicate" },
  { email: "test123@", status: "invalid" },
  { email: "user@disposable.xyz", status: "disposable" },
  { email: "spam_bot@ru.com", status: "spam" },
  { email: "contact@company.io", status: "valid" },
  { email: "@missinguser.co", status: "invalid" },
  { email: "hello@realco.com", status: "valid" }
];
const STATUS_CONFIG = {
  valid: { icon: FiCheck, color: "brand.600", bg: "brand.50", label: "Valid" },
  duplicate: {
    icon: FiAlertCircle,
    color: "accent.700",
    bg: "accent.50",
    label: "Dupe"
  },
  invalid: {
    icon: FiXCircle,
    color: "red.500",
    bg: "red.50",
    label: "Invalid"
  },
  disposable: {
    icon: FiAlertTriangle,
    color: "orange.500",
    bg: "orange.50",
    label: "Disposable"
  },
  spam: { icon: FiXCircle, color: "red.500", bg: "red.50", label: "Spam" }
};
function DirtyListCard() {
  return /* @__PURE__ */ jsxs(
    Box,
    {
      bg: "bg.subtle",
      border: "1px solid",
      borderColor: "fg",
      borderRadius: "2xl",
      overflow: "hidden",
      shadow: "sm",
      children: [
        /* @__PURE__ */ jsxs(Box, { px: 4, pt: 4, pb: 3, borderBottomWidth: "1px", borderColor: "border", children: [
          /* @__PURE__ */ jsx(
            Text,
            {
              fontSize: "9px",
              fontWeight: "semibold",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "fg.muted",
              mb: 2,
              children: "Before Scrub"
            }
          ),
          /* @__PURE__ */ jsxs(Flex, { align: "center", justify: "space-between", children: [
            /* @__PURE__ */ jsx(Text, { fontSize: "xs", fontWeight: "semibold", color: "fg", children: "Email List" }),
            /* @__PURE__ */ jsx(
              Badge,
              {
                colorPalette: "red",
                variant: "subtle",
                fontSize: "10px",
                borderRadius: "full",
                px: 2,
                py: 0.5,
                children: "⚠ Unvalidated"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(Box, { px: 4, py: 3, children: /* @__PURE__ */ jsx(Flex, { direction: "column", gap: 1.5, children: DIRTY_EMAILS.map((email, i) => {
          const isInvalid = !email.includes("@") || email.startsWith("@") || !email.split("@")[1];
          return /* @__PURE__ */ jsxs(Flex, { align: "center", gap: 2.5, children: [
            /* @__PURE__ */ jsx(
              Box,
              {
                w: 1.5,
                h: 1.5,
                borderRadius: "full",
                bg: isInvalid ? "red.400" : "fg.muted",
                flexShrink: 0
              }
            ),
            /* @__PURE__ */ jsx(
              Text,
              {
                fontSize: "xs",
                fontFamily: "mono",
                color: isInvalid ? "red.500" : "fg",
                truncate: true,
                children: email
              }
            )
          ] }, i);
        }) }) })
      ]
    }
  );
}
function Chip({ label }) {
  return /* @__PURE__ */ jsx(
    Flex,
    {
      align: "center",
      gap: 1,
      bg: "green.50",
      _dark: { bg: "green.950" },
      border: "1px solid",
      borderColor: "green.200",
      "_dark-borderColor": "green.800",
      borderRadius: "full",
      px: 2,
      py: 0.5,
      children: /* @__PURE__ */ jsx(
        Text,
        {
          fontSize: "9px",
          color: "green.700",
          _dark: { color: "green.300" },
          fontWeight: "medium",
          children: label
        }
      )
    }
  );
}
function ValidatorInputCard() {
  const auth = useAuth();
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [mode, setMode] = useState("email");
  const fileInputRef = useRef(null);
  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => (i + 1) % PLACEHOLDER_EMAILS.length),
      2200
    );
    return () => clearInterval(id);
  }, []);
  return /* @__PURE__ */ jsxs(
    Box,
    {
      bg: "bg.subtle",
      border: "1px solid",
      borderColor: "fg",
      borderRadius: "2xl",
      shadow: "md",
      p: 5,
      display: "flex",
      flexDirection: "column",
      gap: 4,
      children: [
        /* @__PURE__ */ jsx(Flex, { bg: "bg.muted", borderRadius: "xl", p: 1, gap: 1, children: ["email", "csv"].map((m) => /* @__PURE__ */ jsx(
          Button,
          {
            flex: 1,
            size: "xs",
            borderRadius: "lg",
            fontWeight: "medium",
            bg: mode === m ? "bg.subtle" : "transparent",
            color: mode === m ? "fg" : "fg.muted",
            border: mode === m ? "1px solid" : "none",
            borderColor: "border",
            shadow: mode === m ? "sm" : "none",
            _hover: { color: "fg" },
            onClick: () => setMode(m),
            children: m === "email" ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(FiMail, {}),
              " Single Email"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(FiUpload, {}),
              " CSV Upload"
            ] })
          },
          m
        )) }),
        /* @__PURE__ */ jsxs(Box, { children: [
          /* @__PURE__ */ jsx(Text, { fontSize: "xs", fontWeight: "medium", color: "fg", mb: 1.5, children: mode === "email" ? "Email address" : "Upload CSV file" }),
          mode === "email" ? /* @__PURE__ */ jsxs(Box, { position: "relative", children: [
            /* @__PURE__ */ jsx(
              Input,
              {
                value,
                onChange: (e) => setValue(e.target.value),
                placeholder: PLACEHOLDER_EMAILS[idx],
                size: "sm",
                bg: "bg",
                border: "1px solid",
                borderColor: "border",
                borderRadius: "lg",
                fontSize: "xs",
                fontFamily: "mono",
                pr: 8,
                _placeholder: { color: "fg.muted", transition: "all 0.4s" },
                _focus: { borderColor: "brand.solid", outline: "none" }
              }
            ),
            /* @__PURE__ */ jsx(
              Box,
              {
                position: "absolute",
                right: 2.5,
                top: "50%",
                transform: "translateY(-50%)",
                w: 2,
                h: 2,
                borderRadius: "full",
                bg: "green.400"
              }
            )
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                ref: fileInputRef,
                type: "file",
                accept: ".csv",
                style: { display: "none" },
                onChange: () => auth.signinRedirect()
              }
            ),
            /* @__PURE__ */ jsxs(
              Flex,
              {
                direction: "column",
                align: "center",
                justify: "center",
                gap: 2,
                py: 5,
                borderRadius: "lg",
                border: "1px dashed",
                borderColor: "border",
                bg: "bg",
                cursor: "pointer",
                _hover: { borderColor: "fg.muted" },
                onClick: () => fileInputRef.current?.click(),
                children: [
                  /* @__PURE__ */ jsx(Icon, { as: FiUpload, boxSize: 5, color: "fg.muted" }),
                  /* @__PURE__ */ jsxs(Text, { fontSize: "xs", color: "fg.muted", children: [
                    "Click to upload",
                    " ",
                    /* @__PURE__ */ jsx(Text, { as: "span", color: "fg", fontWeight: "medium", children: ".csv" })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          Button,
          {
            w: "full",
            size: "md",
            bg: "fg",
            color: "bg",
            borderRadius: "lg",
            fontWeight: "semibold",
            _hover: { opacity: 0.85 },
            loading: auth.isLoading,
            onClick: () => auth.signinRedirect(),
            children: [
              mode === "email" ? "Validate Email" : "Upload & Clean",
              " ",
              /* @__PURE__ */ jsx(FiArrowRight, {})
            ]
          }
        ),
        mode === "email" && /* @__PURE__ */ jsxs(
          Flex,
          {
            align: "center",
            gap: 2,
            bg: "green.50",
            _dark: { bg: "green.950" },
            border: "1px solid",
            borderColor: "green.200",
            borderRadius: "lg",
            px: 3,
            py: 2,
            flexWrap: "wrap",
            children: [
              /* @__PURE__ */ jsx(Box, { w: 2, h: 2, borderRadius: "full", bg: "green.400", flexShrink: 0 }),
              /* @__PURE__ */ jsx(
                Text,
                {
                  fontSize: "xs",
                  fontFamily: "mono",
                  color: "fg",
                  flex: 1,
                  minW: 0,
                  truncate: true,
                  children: "john@company.com"
                }
              ),
              /* @__PURE__ */ jsx(
                Text,
                {
                  fontSize: "xs",
                  color: "green.600",
                  fontWeight: "semibold",
                  flexShrink: 0,
                  children: "Valid"
                }
              ),
              /* @__PURE__ */ jsx(Text, { fontSize: "10px", color: "fg.muted", flexShrink: 0, children: "142ms" }),
              /* @__PURE__ */ jsxs(Flex, { gap: 1, flexWrap: "wrap", children: [
                /* @__PURE__ */ jsx(Chip, { label: "syntax ✓" }),
                /* @__PURE__ */ jsx(Chip, { label: "MX ✓" }),
                /* @__PURE__ */ jsx(Chip, { label: "not disposable ✓" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx(Text, { fontSize: "xs", color: "fg.muted", textAlign: "center", children: "Free for up to 10 lookups/day" })
      ]
    }
  );
}
function ValidatedListCard() {
  const valid = VALIDATED_EMAILS.filter((e) => e.status === "valid").length;
  return /* @__PURE__ */ jsxs(
    Box,
    {
      bg: "bg.subtle",
      border: "1px solid",
      borderColor: "fg",
      borderRadius: "2xl",
      overflow: "hidden",
      shadow: "sm",
      children: [
        /* @__PURE__ */ jsxs(Box, { px: 4, pt: 4, pb: 3, borderBottomWidth: "1px", borderColor: "border", children: [
          /* @__PURE__ */ jsx(
            Text,
            {
              fontSize: "9px",
              fontWeight: "semibold",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "fg.muted",
              mb: 2,
              children: "After Scrub"
            }
          ),
          /* @__PURE__ */ jsxs(Flex, { align: "center", justify: "space-between", children: [
            /* @__PURE__ */ jsx(Text, { fontSize: "xs", fontWeight: "semibold", color: "fg", children: "Validated" }),
            /* @__PURE__ */ jsxs(
              Badge,
              {
                colorPalette: "green",
                variant: "subtle",
                fontSize: "10px",
                borderRadius: "full",
                px: 2,
                py: 0.5,
                children: [
                  "✓ Clean · ",
                  valid,
                  "/",
                  VALIDATED_EMAILS.length
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(Box, { px: 4, py: 3, children: /* @__PURE__ */ jsx(Flex, { direction: "column", gap: 1.5, children: VALIDATED_EMAILS.map((row, i) => {
          const cfg = STATUS_CONFIG[row.status];
          return /* @__PURE__ */ jsxs(Flex, { align: "center", justify: "space-between", gap: 2, children: [
            /* @__PURE__ */ jsxs(Flex, { align: "center", gap: 2.5, flex: 1, minW: 0, children: [
              /* @__PURE__ */ jsx(
                Box,
                {
                  w: 1.5,
                  h: 1.5,
                  borderRadius: "full",
                  bg: cfg.color,
                  flexShrink: 0
                }
              ),
              /* @__PURE__ */ jsx(Text, { fontSize: "xs", fontFamily: "mono", color: "fg", truncate: true, children: row.email })
            ] }),
            /* @__PURE__ */ jsx(
              Badge,
              {
                colorPalette: row.status === "valid" ? "green" : row.status === "duplicate" ? "yellow" : "red",
                variant: "subtle",
                fontSize: "10px",
                borderRadius: "full",
                px: 2,
                py: 0.5,
                flexShrink: 0,
                children: cfg.label
              }
            )
          ] }, i);
        }) }) })
      ]
    }
  );
}
function FeatureCardsSection() {
  return /* @__PURE__ */ jsx(Box, { pb: 24, pt: 2, children: /* @__PURE__ */ jsx(Container, { maxW: "6xl", children: /* @__PURE__ */ jsxs(SimpleGrid, { columns: { base: 1, lg: 3 }, gap: 5, alignItems: "center", children: [
    /* @__PURE__ */ jsx(
      Box,
      {
        display: { base: "none", lg: "block" },
        transform: "scale(0.78)",
        transformOrigin: "center",
        opacity: 0.45,
        transition: "opacity 0.2s, transform 0.2s",
        _hover: { opacity: 0.7, transform: "scale(0.82)" },
        children: /* @__PURE__ */ jsx(DirtyListCard, {})
      }
    ),
    /* @__PURE__ */ jsx(ValidatorInputCard, {}),
    /* @__PURE__ */ jsx(
      Box,
      {
        display: { base: "none", lg: "block" },
        transform: "scale(0.78)",
        transformOrigin: "center",
        opacity: 0.45,
        transition: "opacity 0.2s, transform 0.2s",
        _hover: { opacity: 0.7, transform: "scale(0.82)" },
        children: /* @__PURE__ */ jsx(ValidatedListCard, {})
      }
    )
  ] }) }) });
}
const features = [
  {
    title: "Format check",
    text: "Catch typos and malformed addresses before they enter your list."
  },
  {
    title: "Delivery check",
    text: "Verify the domain has working MX records and can receive mail."
  },
  {
    title: "Email profiling",
    text: "Identify role-based, catch-all, and high-risk address patterns."
  },
  {
    title: "Blocklists",
    text: "Flag addresses and domains known for spam, abuse, or fraud."
  },
  {
    title: "No-code APIs",
    text: "Drop validation into any form or workflow with a single endpoint."
  },
  {
    title: "Mailing lists",
    text: "Upload a CSV and clean your entire list in one go."
  }
];
const stats = [
  { value: "2–7%", label: "of signups contain typos or misspelled domains" },
  {
    value: "5–15%",
    label: "enter a made-up or gibberish address to bypass a gate"
  },
  { value: "10–40%", label: "are bot or spam signups without CAPTCHA or DOI" },
  { value: "3–10%", label: "use disposable or catch-all addresses" }
];
function HowItWorksSection() {
  return /* @__PURE__ */ jsx(
    Box,
    {
      py: { base: 20, md: 32 },
      mx: { base: 6, md: 20 },
      borderTopWidth: "1px",
      borderColor: "border",
      children: /* @__PURE__ */ jsxs(Container, { maxW: "5xl", px: 0, children: [
        /* @__PURE__ */ jsx(
          Flex,
          {
            direction: "column",
            align: "center",
            textAlign: "center",
            gap: 6,
            mb: 16,
            children: /* @__PURE__ */ jsx(
              Heading,
              {
                fontFamily: "heading",
                fontWeight: "400",
                fontSize: { base: "3xl", md: "5xl" },
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                children: "How it works"
              }
            )
          }
        ),
        /* @__PURE__ */ jsx(
          Grid,
          {
            templateColumns: { base: "1fr", md: "repeat(2, 1fr)" },
            gap: 0,
            border: "1px solid",
            borderColor: "border",
            borderRadius: "lg",
            overflow: "hidden",
            mb: 16,
            children: features.map((feature) => /* @__PURE__ */ jsxs(
              Flex,
              {
                direction: "row",
                align: "baseline",
                gap: 4,
                px: 8,
                py: 5,
                bg: "bg.subtle",
                borderBottomWidth: "1px",
                borderRightWidth: "1px",
                borderColor: "border",
                children: [
                  /* @__PURE__ */ jsx(Text, { fontWeight: "600", fontSize: "sm", flexShrink: 0, w: "120px", children: feature.title }),
                  /* @__PURE__ */ jsx(Text, { fontSize: "sm", color: "fg.muted", lineHeight: 1.6, children: feature.text })
                ]
              },
              feature.title
            ))
          }
        ),
        /* @__PURE__ */ jsx(
          Box,
          {
            bg: "bg.muted",
            border: "1px solid",
            borderColor: "border",
            borderRadius: "lg",
            px: 10,
            py: 8,
            mb: 16,
            children: /* @__PURE__ */ jsxs(
              Flex,
              {
                direction: { base: "column", md: "row" },
                align: { md: "center" },
                justify: "space-between",
                gap: 4,
                children: [
                  /* @__PURE__ */ jsxs(Box, { children: [
                    /* @__PURE__ */ jsx(
                      Text,
                      {
                        fontFamily: "heading",
                        fontSize: { base: "xl", md: "2xl" },
                        fontWeight: "400",
                        letterSpacing: "-0.02em",
                        mb: 1,
                        children: "Place us after your sign up forms and landing pages."
                      }
                    ),
                    /* @__PURE__ */ jsx(Text, { fontSize: "sm", color: "fg.muted", children: "We'll make sure you only get real users." })
                  ] }),
                  /* @__PURE__ */ jsx(
                    Box,
                    {
                      flexShrink: 0,
                      bg: "brand.solid",
                      color: "white",
                      border: "1px solid",
                      borderColor: "fg",
                      borderRadius: "lg",
                      px: 6,
                      py: 3,
                      fontSize: "sm",
                      fontWeight: "500",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      children: "See the API docs"
                    }
                  )
                ]
              }
            )
          }
        ),
        /* @__PURE__ */ jsx(
          Grid,
          {
            templateColumns: { base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 8,
            children: stats.map((stat) => /* @__PURE__ */ jsxs(Flex, { direction: "column", gap: 1, children: [
              /* @__PURE__ */ jsx(
                Text,
                {
                  fontFamily: "mono",
                  fontSize: { base: "2xl", md: "3xl" },
                  fontWeight: "600",
                  color: "fg",
                  letterSpacing: "-0.02em",
                  children: stat.value
                }
              ),
              /* @__PURE__ */ jsx(Text, { fontSize: "sm", color: "fg.muted", lineHeight: 1.5, children: stat.label })
            ] }, stat.value))
          }
        )
      ] })
    }
  );
}
function CtaSection() {
  return /* @__PURE__ */ jsxs(
    Box,
    {
      bg: "brand.solid",
      py: { base: 20, md: 32 },
      position: "relative",
      overflow: "hidden",
      children: [
        /* @__PURE__ */ jsx(
          Box,
          {
            position: "absolute",
            inset: 0,
            style: {
              background: "radial-gradient(ellipse 60% 70% at 50% 100%, rgba(0,0,0,0.25) 0%, transparent 70%)",
              opacity: 0.15
            },
            pointerEvents: "none"
          }
        ),
        /* @__PURE__ */ jsx(Container, { maxW: "3xl", position: "relative", zIndex: 1, children: /* @__PURE__ */ jsxs(Flex, { direction: "column", align: "center", textAlign: "center", gap: 6, children: [
          /* @__PURE__ */ jsx(
            Heading,
            {
              fontFamily: "heading",
              fontWeight: "400",
              fontSize: { base: "3xl", md: "5xl" },
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "brand.contrast",
              children: "Ready to clean your list?"
            }
          ),
          /* @__PURE__ */ jsx(
            Text,
            {
              color: "brand.contrast",
              opacity: 0.8,
              fontSize: { base: "sm", md: "md" },
              maxW: "md",
              lineHeight: 1.7,
              children: "Start validating emails in seconds — no credit card required. Keep your sender reputation high and your bounce rate low."
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              size: "lg",
              bg: "accent.solid",
              color: "accent.contrast",
              border: "1px solid",
              borderColor: "fg",
              borderRadius: "lg",
              px: 8,
              fontWeight: "semibold",
              _hover: { bg: "accent.600" },
              children: [
                "Get Started Free ",
                /* @__PURE__ */ jsx(FiArrowRight, {})
              ]
            }
          )
        ] }) })
      ]
    }
  );
}
function PricingCard({ tier }) {
  return /* @__PURE__ */ jsxs(
    Flex,
    {
      direction: "column",
      bg: tier.highlight ? "fg" : "bg.subtle",
      border: "1px solid",
      borderColor: tier.highlight ? "fg" : "border",
      borderRadius: "2xl",
      p: 6,
      gap: 4,
      position: "relative",
      children: [
        /* @__PURE__ */ jsxs(Flex, { justify: "space-between", align: "flex-start", children: [
          /* @__PURE__ */ jsx(
            Heading,
            {
              fontSize: "xl",
              fontWeight: "semibold",
              color: tier.highlight ? "bg" : "fg",
              children: tier.name
            }
          ),
          /* @__PURE__ */ jsx(
            Box,
            {
              bg: tier.badgeBg,
              color: tier.badgeColor,
              fontSize: "xs",
              fontWeight: "bold",
              letterSpacing: "0.05em",
              px: 2.5,
              py: 1,
              borderRadius: "full",
              border: tier.highlight ? "none" : "1px solid",
              borderColor: "border",
              children: tier.badge
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          Text,
          {
            fontSize: "sm",
            color: tier.highlight ? "bg" : "fg.muted",
            opacity: tier.highlight ? 0.7 : 1,
            children: tier.volume
          }
        ),
        /* @__PURE__ */ jsxs(Box, { mt: 2, children: [
          /* @__PURE__ */ jsx(
            Text,
            {
              fontSize: "4xl",
              fontWeight: "bold",
              color: tier.highlight ? "bg" : "fg",
              lineHeight: 1,
              children: tier.price
            }
          ),
          /* @__PURE__ */ jsx(
            Text,
            {
              fontSize: "sm",
              color: tier.highlight ? "bg" : "fg.muted",
              opacity: tier.highlight ? 0.6 : 1,
              mt: 1,
              children: tier.perEmail
            }
          )
        ] }),
        /* @__PURE__ */ jsx(Box, { flex: 1 }),
        /* @__PURE__ */ jsxs(Flex, { direction: "column", gap: 2, mt: 4, children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              size: "md",
              bg: tier.highlight ? "brand.solid" : "fg",
              color: tier.highlight ? "brand.contrast" : "bg",
              borderRadius: "lg",
              fontWeight: "semibold",
              _hover: { opacity: 0.9 },
              w: "full",
              children: [
                "Get Started ",
                /* @__PURE__ */ jsx(FiArrowRight, {})
              ]
            }
          ),
          tier.contactUs && /* @__PURE__ */ jsx(
            Text,
            {
              fontSize: "xs",
              color: "fg.muted",
              textAlign: "center",
              cursor: "pointer",
              _hover: { color: "fg" },
              children: "Need more? Contact us"
            }
          )
        ] })
      ]
    }
  );
}
function PricingComingSoonCard({ highlight }) {
  return /* @__PURE__ */ jsxs(
    Flex,
    {
      direction: "column",
      align: "center",
      justify: "center",
      bg: highlight ? "fg" : "bg.subtle",
      border: "1px solid",
      borderColor: highlight ? "fg" : "border",
      borderRadius: "2xl",
      p: 6,
      minH: "280px",
      gap: 3,
      children: [
        /* @__PURE__ */ jsx(
          Text,
          {
            fontSize: "lg",
            fontWeight: "semibold",
            color: highlight ? "bg" : "fg",
            opacity: highlight ? 0.5 : 0.4,
            children: "Coming soon"
          }
        ),
        /* @__PURE__ */ jsx(
          Text,
          {
            fontSize: "sm",
            color: highlight ? "bg" : "fg.muted",
            opacity: highlight ? 0.4 : 1,
            textAlign: "center",
            children: "Monthly plans are on the way"
          }
        )
      ]
    }
  );
}
const paygTiers = [
  {
    name: "Starter",
    badge: "BASIC",
    badgeBg: "bg.muted",
    badgeColor: "fg.muted",
    volume: "Up to 1,000 emails",
    price: "$4",
    perEmail: "$0.004 per email",
    highlight: false
  },
  {
    name: "Pro",
    badge: "MOST POPULAR",
    badgeBg: "brand.solid",
    badgeColor: "brand.contrast",
    volume: "Up to 10,000 emails",
    price: "$40",
    perEmail: "$0.004 per email",
    highlight: true
  },
  {
    name: "Enterprise",
    badge: "BEST VALUE",
    badgeBg: "accent.solid",
    badgeColor: "accent.contrast",
    volume: "Up to 100,000 emails",
    price: "$400",
    perEmail: "$0.004 per email",
    highlight: false,
    contactUs: true
  }
];
function PricingSection() {
  return /* @__PURE__ */ jsx(Box, { py: { base: 20, md: 32 }, bg: "bg", id: "pricing", children: /* @__PURE__ */ jsxs(Container, { maxW: "5xl", children: [
    /* @__PURE__ */ jsxs(
      Flex,
      {
        direction: "column",
        align: "center",
        textAlign: "center",
        gap: 4,
        mb: 12,
        children: [
          /* @__PURE__ */ jsx(
            Heading,
            {
              fontFamily: "heading",
              fontWeight: "400",
              fontSize: { base: "3xl", md: "5xl" },
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              children: "Simple, transparent pricing"
            }
          ),
          /* @__PURE__ */ jsx(Text, { color: "fg.muted", fontSize: { base: "sm", md: "md" }, maxW: "md", children: "Pay only for what you use. No subscriptions. No hidden fees. Credits never expire." })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(Tabs.Root, { defaultValue: "payg", variant: "plain", children: [
      /* @__PURE__ */ jsx(Flex, { justify: "center", mb: 10, children: /* @__PURE__ */ jsxs(
        Tabs.List,
        {
          bg: "bg.muted",
          rounded: "full",
          p: "1",
          border: "1px solid",
          borderColor: "border",
          children: [
            /* @__PURE__ */ jsx(Tabs.Trigger, { value: "payg", children: "Pay-As-You-Go" }),
            /* @__PURE__ */ jsx(Tabs.Trigger, { value: "monthly", children: "Monthly" }),
            /* @__PURE__ */ jsx(Tabs.Indicator, { rounded: "full" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsx(Tabs.Content, { value: "payg", children: /* @__PURE__ */ jsx(
        Grid,
        {
          templateColumns: { base: "1fr", md: "repeat(3, 1fr)" },
          gap: 5,
          alignItems: "stretch",
          children: paygTiers.map((tier) => /* @__PURE__ */ jsx(PricingCard, { tier }, tier.name))
        }
      ) }),
      /* @__PURE__ */ jsx(Tabs.Content, { value: "monthly", children: /* @__PURE__ */ jsx(
        Grid,
        {
          templateColumns: { base: "1fr", md: "repeat(3, 1fr)" },
          gap: 5,
          alignItems: "stretch",
          children: [false, true, false].map((highlight, i) => /* @__PURE__ */ jsx(PricingComingSoonCard, { highlight }, i))
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx(
      Text,
      {
        textAlign: "center",
        fontSize: "xs",
        color: "fg.muted",
        mt: 8,
        opacity: 0.7,
        children: "All prices are pay-as-you-go. No subscription. No expiry. $0.004 per email validation."
      }
    )
  ] }) });
}
const questions = [
  {
    title: "How much does it cost to start cleaning my email list?",
    text: "You can start for free — no credit card required. Scrub operates on a pay-as-you-go model, so you only pay for the emails you validate. There are no monthly fees, no minimum spend, and no commitments. Upload your list, validate what you need, and pay only when you're ready.",
    value: "q1"
  },
  {
    title: "What types of emails does Scrub detect?",
    text: "Scrub checks for a wide range of issues: invalid syntax, non-existent domains, missing or broken MX records, disposable/temporary email addresses, role-based addresses (like info@ or support@), and catch-all domains. Each result is scored so you can make informed decisions about which addresses to keep.",
    value: "q2"
  },
  {
    title: "How do I clean a large list?",
    text: "Upload your list as a CSV file and Scrub will validate every address in bulk. Results are processed quickly and returned as a downloadable CSV with validation status and risk scores for each email. No technical setup required — just upload, validate, and download.",
    value: "q3"
  }
];
function FqaSection() {
  return /* @__PURE__ */ jsx(Box, { py: { base: 20, md: 32 }, position: "relative", overflow: "hidden", children: /* @__PURE__ */ jsx(Container, { maxW: "3xl", position: "relative", zIndex: 1, children: /* @__PURE__ */ jsxs(Flex, { direction: "column", align: "center", textAlign: "center", gap: 6, children: [
    /* @__PURE__ */ jsx(
      Heading,
      {
        fontFamily: "heading",
        fontWeight: "400",
        fontSize: { base: "3xl", md: "5xl" },
        letterSpacing: "-0.03em",
        lineHeight: 1.05,
        children: "FAQ"
      }
    ),
    /* @__PURE__ */ jsx(Accordion.Root, { collapsible: true, defaultValue: ["q1"], children: questions.map((item, index) => /* @__PURE__ */ jsxs(Accordion.Item, { value: item.value, children: [
      /* @__PURE__ */ jsxs(Accordion.ItemTrigger, { px: "3", _open: { bg: "gray.subtle" }, children: [
        /* @__PURE__ */ jsx(Span, { flex: "1", children: item.title }),
        /* @__PURE__ */ jsx(Accordion.ItemIndicator, {})
      ] }),
      /* @__PURE__ */ jsx(Accordion.ItemContent, { children: /* @__PURE__ */ jsx(Accordion.ItemBody, { children: item.text }) })
    ] }, index)) })
  ] }) }) });
}
const home = UNSAFE_withComponentProps(function Home() {
  return /* @__PURE__ */ jsxs(Box, {
    minH: "100vh",
    bg: "bg",
    display: "flex",
    flexDirection: "column",
    children: [/* @__PURE__ */ jsx(UnauthenticatedNavbar, {}), /* @__PURE__ */ jsx(HeroSection, {}), /* @__PURE__ */ jsx(FeatureCardsSection, {}), /* @__PURE__ */ jsx(HowItWorksSection, {}), /* @__PURE__ */ jsx(PricingSection, {}), /* @__PURE__ */ jsx(CtaSection, {}), /* @__PURE__ */ jsx(FqaSection, {}), /* @__PURE__ */ jsx(Footer, {})]
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home
}, Symbol.toStringTag, { value: "Module" }));
const API_BASE = "http://localhost:3000";
async function apiPost(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers ?? {}
    }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API error ${response.status}: ${detail}`);
  }
  return response.json();
}
async function apiFetch(path, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers ?? {}
    }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API error ${response.status}: ${detail}`);
  }
  return response.json();
}
function getMe(token) {
  return apiFetch("/context", token);
}
const UsageStats = (stats2) => {
  return /* @__PURE__ */ jsxs(Popover.Root, { children: [
    /* @__PURE__ */ jsx(Popover.Trigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", children: [
      stats2.total_validations,
      " scrub",
      stats2.total_validations !== 1 && "s"
    ] }) }),
    /* @__PURE__ */ jsx(Portal, { children: /* @__PURE__ */ jsx(Popover.Positioner, { children: /* @__PURE__ */ jsxs(Popover.Content, { css: { "--popover-bg": "accent" }, children: [
      /* @__PURE__ */ jsx(Popover.Arrow, {}),
      /* @__PURE__ */ jsxs(Popover.Body, { children: [
        /* @__PURE__ */ jsx(Popover.Title, { fontWeight: "medium", children: "Usage Stats" }),
        /* @__PURE__ */ jsxs(Text, { my: "4", children: [
          "You have validated ",
          stats2.total_validations,
          " times this month."
        ] }),
        /* @__PURE__ */ jsx(Link, { variant: "underline", colorPalette: "teal", href: "/dashboard", children: "View all Analytics" })
      ] })
    ] }) }) })
  ] });
};
const navItems = [
  { label: "API Keys", href: "/api/keys" },
  { label: "Docs", href: "/docs" }
];
const ApiDropdown = () => {
  return /* @__PURE__ */ jsxs(Menu.Root, { children: [
    /* @__PURE__ */ jsx(Menu.Trigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", children: [
      "API",
      /* @__PURE__ */ jsx(IoIosArrowDown, {})
    ] }) }),
    /* @__PURE__ */ jsx(Portal, { children: /* @__PURE__ */ jsx(Menu.Positioner, { children: /* @__PURE__ */ jsx(Menu.Content, { children: navItems.map((item) => /* @__PURE__ */ jsx(Menu.Item, { value: item.label, children: /* @__PURE__ */ jsxs(Link, { href: item.href, children: [
      item.label,
      " ",
      /* @__PURE__ */ jsx(Menu.ItemCommand, { children: "⌘E" })
    ] }) }, item.label)) }) }) })
  ] });
};
const NAV_LINKS = [
  { label: "Single", href: "/dashboard" },
  { label: "Lists", href: "/lists" },
  { label: "Integrations", href: "/integrations" },
  { label: "API", href: "/api", dropdown: true }
];
function AuthenticatedNavbar() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [context, setContext] = useState(null);
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user?.access_token) return;
    getMe(auth.user.access_token).then(setContext).catch(console.error);
  }, [auth.isAuthenticated, auth.user?.access_token]);
  return /* @__PURE__ */ jsx(Box, { position: "sticky", top: 0, zIndex: 100, bg: "bg", children: /* @__PURE__ */ jsx(Box, { py: 4, children: /* @__PURE__ */ jsx(Container, { maxW: "7xl", children: /* @__PURE__ */ jsxs(Flex, { align: "center", justify: "space-between", children: [
    /* @__PURE__ */ jsxs(Flex, { align: "center", gap: 3, children: [
      /* @__PURE__ */ jsx(
        Box,
        {
          bg: "#1a1a1a",
          borderRadius: "lg",
          w: "36px",
          h: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          children: /* @__PURE__ */ jsx(Icon, { as: FiCheckCircle, color: "white", boxSize: 4 })
        }
      ),
      /* @__PURE__ */ jsx(Text, { fontWeight: "bold", fontSize: "lg", letterSpacing: "-0.02em", children: "scrub_" })
    ] }),
    /* @__PURE__ */ jsx(Flex, { align: "center", gap: 7, display: { base: "none", md: "flex" }, children: NAV_LINKS.map(
      (link) => link.dropdown ? /* @__PURE__ */ jsx(ApiDropdown, {}, link.label) : /* @__PURE__ */ jsx(
        Text,
        {
          fontSize: "sm",
          fontWeight: "medium",
          color: location.pathname === link.href ? "fg" : "fg.muted",
          bg: location.pathname === link.href ? "brand.200" : void 0,
          cursor: "pointer",
          _hover: { color: "fg" },
          transition: "color 0.15s",
          onClick: () => navigate(link.href),
          children: link.label
        },
        link.label
      )
    ) }),
    /* @__PURE__ */ jsxs(Flex, { align: "center", gap: 3, children: [
      context?.stats && /* @__PURE__ */ jsx(
        Flex,
        {
          align: "center",
          gap: 2,
          display: { base: "none", md: "flex" },
          children: /* @__PURE__ */ jsx(UsageStats, { ...context.stats })
        }
      ),
      /* @__PURE__ */ jsxs(
        Avatar.Root,
        {
          colorPalette: "red",
          onClick: () => navigate("/settings/general"),
          children: [
            /* @__PURE__ */ jsx(Avatar.Fallback, {}),
            /* @__PURE__ */ jsx(Avatar.Image, { src: "https://bit.ly/broken-link" })
          ]
        }
      )
    ] })
  ] }) }) }) });
}
function validateEmail(email) {
  return apiPost(
    `/validation/validate-single?email=${encodeURIComponent(email)}`
  );
}
const STATUS_COLOR = {
  deliverable: "green",
  undeliverable: "red",
  risky: "yellow",
  unknown: "gray"
};
const STATUS_TITLE = {
  deliverable: "Deliverable email",
  undeliverable: "Undeliverable email",
  risky: "Risky email",
  unknown: "Unknown"
};
const STATUS_DESC = {
  deliverable: "This email address appears valid and can receive mail.",
  undeliverable: "This email address cannot receive mail.",
  risky: "This email exists but is flagged as risky (disposable or catch-all).",
  unknown: "We could not determine the deliverability of this address."
};
const REASON_LABEL = {
  MAIL_SERVER_FOUND: "MX record confirmed — domain accepts mail",
  MAIL_SERVER_FOUND_FALLBACK: "No MX record, A record used as fallback",
  NO_MAIL_SERVER_CONFIGURED: "Domain has no mail server configured",
  DNS_ERROR_FAIL_SAFE: "DNS timed out — allowed through as fail-safe"
};
function CheckRow({
  label,
  value,
  warn
}) {
  const isWarning = warn && !value;
  return /* @__PURE__ */ jsxs(
    Flex,
    {
      align: "center",
      justify: "space-between",
      py: 2,
      borderBottomWidth: "1px",
      borderColor: "border",
      _last: { borderBottom: "none" },
      children: [
        /* @__PURE__ */ jsx(Text, { fontSize: "sm", color: "fg.muted", children: label }),
        /* @__PURE__ */ jsxs(Flex, { align: "center", gap: 1, children: [
          isWarning && /* @__PURE__ */ jsx(Icon, { as: FiAlertTriangle, color: "red.400", boxSize: 3.5 }),
          /* @__PURE__ */ jsx(
            Text,
            {
              fontSize: "sm",
              fontWeight: "medium",
              color: value ? "fg" : isWarning ? "red.500" : "fg.muted",
              children: value ? "Yes" : "No"
            }
          )
        ] })
      ]
    }
  );
}
function AttrRow({
  label,
  value
}) {
  const display = value === void 0 || value === null || value === "" ? "—" : typeof value === "boolean" ? value ? "Yes" : "No" : value;
  return /* @__PURE__ */ jsxs(
    Flex,
    {
      align: "center",
      justify: "space-between",
      py: 2,
      borderBottomWidth: "1px",
      borderColor: "border",
      _last: { borderBottom: "none" },
      children: [
        /* @__PURE__ */ jsx(Text, { fontSize: "sm", color: "fg.muted", children: label }),
        /* @__PURE__ */ jsx(Text, { fontSize: "sm", fontFamily: "mono", color: "fg", children: display })
      ]
    }
  );
}
function QualityBar({ score }) {
  return /* @__PURE__ */ jsxs(Box, { children: [
    /* @__PURE__ */ jsxs(Flex, { justify: "space-between", mb: 1, children: [
      /* @__PURE__ */ jsx(Text, { fontSize: "sm", color: "fg.muted", children: "Email quality score" }),
      /* @__PURE__ */ jsxs(Text, { fontSize: "sm", fontWeight: "semibold", fontFamily: "mono", children: [
        score,
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsx(Flex, { justify: "space-between", mb: 1, children: [0, 25, 50, 75, 100].map((n) => /* @__PURE__ */ jsx(Text, { fontSize: "xs", color: "fg.muted", fontFamily: "mono", children: n }, n)) }),
    /* @__PURE__ */ jsxs(Box, { position: "relative", h: "8px", borderRadius: "full", overflow: "hidden", children: [
      /* @__PURE__ */ jsx(
        Box,
        {
          position: "absolute",
          inset: 0,
          bgGradient: "to-r",
          gradientFrom: "red.500",
          gradientVia: "yellow.400",
          gradientTo: "green.500"
        }
      ),
      /* @__PURE__ */ jsx(
        Box,
        {
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          w: `${100 - score}%`,
          bg: "bg.muted",
          opacity: 0.85
        }
      ),
      /* @__PURE__ */ jsx(
        Box,
        {
          position: "absolute",
          top: "50%",
          left: `${score}%`,
          transform: "translate(-50%, -50%)",
          w: "3px",
          h: "12px",
          bg: "fg",
          borderRadius: "full"
        }
      )
    ] })
  ] });
}
function ValidationResultCard({ result }) {
  const { status, checks, attributes, quality_score, reason } = result;
  const colorScheme = STATUS_COLOR[status] ?? "gray";
  return /* @__PURE__ */ jsxs(
    Box,
    {
      mt: 4,
      borderRadius: "xl",
      borderWidth: "1px",
      borderColor: "border",
      overflow: "hidden",
      children: [
        /* @__PURE__ */ jsxs(
          Box,
          {
            px: 5,
            py: 4,
            bg: status === "deliverable" ? "green.50" : status === "risky" ? "yellow.50" : "red.50",
            _dark: {
              bg: status === "deliverable" ? "green.950" : status === "risky" ? "yellow.950" : "red.950"
            },
            children: [
              /* @__PURE__ */ jsx(Badge, { colorPalette: colorScheme, mb: 2, children: STATUS_TITLE[status] ?? status }),
              /* @__PURE__ */ jsx(Text, { fontSize: "sm", color: "fg.muted", children: reason ? REASON_LABEL[reason] ?? reason : STATUS_DESC[status] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(Box, { px: 5, py: 4, borderBottomWidth: "1px", borderColor: "border", children: [
          /* @__PURE__ */ jsx(
            Text,
            {
              fontSize: "xs",
              fontWeight: "semibold",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "fg.muted",
              mb: 2,
              children: "Quality check"
            }
          ),
          /* @__PURE__ */ jsx(CheckRow, { label: "Valid format", value: checks.valid_format, warn: true }),
          /* @__PURE__ */ jsx(CheckRow, { label: "Valid domain", value: checks.valid_domain, warn: true }),
          /* @__PURE__ */ jsx(
            CheckRow,
            {
              label: "Can receive email",
              value: checks.can_receive_email,
              warn: true
            }
          ),
          /* @__PURE__ */ jsx(
            CheckRow,
            {
              label: "Not a disposable address",
              value: !checks.is_disposable,
              warn: true
            }
          ),
          /* @__PURE__ */ jsx(CheckRow, { label: "Not a generic address", value: !checks.is_generic }),
          /* @__PURE__ */ jsx(Box, { mt: 4, children: /* @__PURE__ */ jsx(QualityBar, { score: quality_score }) })
        ] }),
        /* @__PURE__ */ jsxs(Box, { px: 5, py: 4, children: [
          /* @__PURE__ */ jsx(
            Text,
            {
              fontSize: "xs",
              fontWeight: "semibold",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "fg.muted",
              mb: 2,
              children: "Attributes"
            }
          ),
          /* @__PURE__ */ jsx(AttrRow, { label: "Username", value: attributes.username }),
          /* @__PURE__ */ jsx(AttrRow, { label: "Domain", value: attributes.domain }),
          /* @__PURE__ */ jsx(AttrRow, { label: "Is free", value: attributes.is_free }),
          /* @__PURE__ */ jsx(AttrRow, { label: "Provider", value: attributes.provider }),
          /* @__PURE__ */ jsx(AttrRow, { label: "MX record", value: attributes.mx_record })
        ] })
      ]
    }
  );
}
const SingleEmailUpsertForm = () => {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await validateEmail(email);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed.");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, children: [
    /* @__PURE__ */ jsxs(Field.Root, { required: true, mb: 3, children: [
      /* @__PURE__ */ jsxs(
        Flex,
        {
          gap: 3,
          w: { base: "full", md: "2xl", lg: "3xl" },
          bg: "bg.subtle",
          borderWidth: "1px",
          borderColor: "border",
          borderRadius: "xl",
          p: 2,
          _focusWithin: { borderColor: "fg", boxShadow: "sm" },
          transition: "border-color 0.15s, box-shadow 0.15s",
          children: [
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: "Enter an email address",
                type: "email",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                border: "none",
                bg: "transparent",
                _focus: { outline: "none", boxShadow: "none" },
                fontSize: { base: "sm", md: "md" },
                px: 2
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "submit",
                bg: "accent.solid",
                border: "1px solid",
                borderColor: "fg",
                borderRadius: "lg",
                color: "accent.contrast",
                fontWeight: "medium",
                px: { base: 4, md: 6 },
                _hover: { bg: "accent.400" },
                flexShrink: 0,
                disabled: loading || !email,
                children: loading ? /* @__PURE__ */ jsx(Spinner, { size: "sm" }) : "Validate"
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsx(Field.HelperText, { pl: 1, children: "I text and email my friends and family a lot, but that's about the extent of my high-tech-etude." })
    ] }),
    result && /* @__PURE__ */ jsx(ValidationResultCard, { result }),
    error && /* @__PURE__ */ jsx(Text, { mt: 4, fontSize: "sm", color: "red.500", children: error })
  ] });
};
const dashboard = UNSAFE_withComponentProps(function Dashboard() {
  return /* @__PURE__ */ jsxs(Box, {
    minH: "100vh",
    bg: "bg",
    children: [/* @__PURE__ */ jsx(AuthenticatedNavbar, {}), /* @__PURE__ */ jsx(Container, {
      maxW: "6xl",
      py: 10,
      children: /* @__PURE__ */ jsx(SingleEmailUpsertForm, {})
    })]
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: dashboard
}, Symbol.toStringTag, { value: "Module" }));
const lists = UNSAFE_withComponentProps(function Lists() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate("/");
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);
  if (auth.isLoading || !auth.isAuthenticated) {
    return null;
  }
  return /* @__PURE__ */ jsxs(Box, {
    minH: "100vh",
    bg: "bg",
    children: [/* @__PURE__ */ jsx(AuthenticatedNavbar, {}), /* @__PURE__ */ jsx(Container, {
      maxW: "7xl",
      py: 10,
      children: /* @__PURE__ */ jsxs(Box, {
        mb: 8,
        children: [/* @__PURE__ */ jsx(Heading, {
          fontSize: {
            base: "2xl",
            md: "3xl"
          },
          fontWeight: "bold",
          mb: 1,
          children: "Lists"
        }), /* @__PURE__ */ jsx(Text, {
          color: "fg.muted",
          children: "Manage your email lists and scrubbing jobs."
        })]
      })
    })]
  });
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: lists
}, Symbol.toStringTag, { value: "Module" }));
const integrations = UNSAFE_withComponentProps(function Integrations() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate("/");
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);
  if (auth.isLoading || !auth.isAuthenticated) {
    return null;
  }
  return /* @__PURE__ */ jsxs(Box, {
    minH: "100vh",
    bg: "bg",
    children: [/* @__PURE__ */ jsx(AuthenticatedNavbar, {}), /* @__PURE__ */ jsx(Container, {
      maxW: "7xl",
      py: 10,
      children: /* @__PURE__ */ jsxs(Box, {
        mb: 8,
        children: [/* @__PURE__ */ jsx(Heading, {
          fontSize: {
            base: "2xl",
            md: "3xl"
          },
          fontWeight: "bold",
          mb: 1,
          children: "Integrations"
        }), /* @__PURE__ */ jsx(Text, {
          color: "fg.muted",
          children: "Connect Scrub to your favourite tools and platforms."
        })]
      })
    })]
  });
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: integrations
}, Symbol.toStringTag, { value: "Module" }));
const docs = UNSAFE_withComponentProps(function Docs() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate("/");
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);
  if (auth.isLoading || !auth.isAuthenticated) {
    return null;
  }
  return /* @__PURE__ */ jsxs(Box, {
    minH: "100vh",
    bg: "bg",
    children: [/* @__PURE__ */ jsx(AuthenticatedNavbar, {}), /* @__PURE__ */ jsx(Container, {
      maxW: "7xl",
      py: 10,
      children: /* @__PURE__ */ jsxs(Box, {
        mb: 8,
        children: [/* @__PURE__ */ jsx(Heading, {
          fontSize: {
            base: "2xl",
            md: "3xl"
          },
          fontWeight: "bold",
          mb: 1,
          children: "Docs"
        }), /* @__PURE__ */ jsx(Text, {
          color: "fg.muted",
          children: "Guides and references for using Scrub."
        })]
      })
    })]
  });
});
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: docs
}, Symbol.toStringTag, { value: "Module" }));
const api = UNSAFE_withComponentProps(function Api() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate("/");
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);
  if (auth.isLoading || !auth.isAuthenticated) {
    return null;
  }
  return /* @__PURE__ */ jsxs(Box, {
    minH: "100vh",
    bg: "bg",
    children: [/* @__PURE__ */ jsx(AuthenticatedNavbar, {}), /* @__PURE__ */ jsx(Container, {
      maxW: "7xl",
      py: 10,
      children: /* @__PURE__ */ jsxs(Box, {
        mb: 8,
        children: [/* @__PURE__ */ jsx(Heading, {
          fontSize: {
            base: "2xl",
            md: "3xl"
          },
          fontWeight: "bold",
          mb: 1,
          children: "API"
        }), /* @__PURE__ */ jsx(Text, {
          color: "fg.muted",
          children: "Your API keys and usage metrics."
        })]
      })
    })]
  });
});
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: api
}, Symbol.toStringTag, { value: "Module" }));
const auth_callback = UNSAFE_withComponentProps(function AuthCallback() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    let isMounted = true;
    const completeSignin = async () => {
      try {
        if (auth.isAuthenticated) {
          navigate("/dashboard");
          return;
        }
        if (auth.userManager) {
          await auth.userManager.signinRedirectCallback();
          if (!isMounted) {
            return;
          }
          navigate("/dashboard");
        }
      } catch (e) {
        console.error("Error handling sign-in callback", e);
      }
    };
    completeSignin();
    return () => {
      isMounted = false;
    };
  }, [auth.isAuthenticated, auth.userManager, navigate]);
  if (auth.error) {
    return /* @__PURE__ */ jsx(Container, {
      maxW: "md",
      centerContent: true,
      py: "20",
      children: /* @__PURE__ */ jsx(VStack, {
        gap: "4",
        children: /* @__PURE__ */ jsxs(Text, {
          color: "red.500",
          children: ["Authentication error: ", auth.error.message]
        })
      })
    });
  }
  return /* @__PURE__ */ jsx(Container, {
    maxW: "md",
    centerContent: true,
    py: "20",
    children: /* @__PURE__ */ jsxs(VStack, {
      gap: "4",
      children: [/* @__PURE__ */ jsx(Spinner, {
        size: "lg"
      }), /* @__PURE__ */ jsx(Text, {
        color: "fg.muted",
        children: "Signing in…"
      })]
    })
  });
});
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: auth_callback
}, Symbol.toStringTag, { value: "Module" }));
const NAV_ITEMS = [{
  label: "General",
  href: "/settings/general"
}, {
  label: "Account",
  href: "/settings/account"
}, {
  label: "Analytics",
  href: "/settings/analytics"
}, {
  label: "History",
  href: "/settings/history"
}];
const settings = UNSAFE_withComponentProps(function Settings() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      navigate("/");
    }
  }, [auth.isLoading, auth.isAuthenticated, navigate]);
  if (auth.isLoading || !auth.isAuthenticated) return null;
  return /* @__PURE__ */ jsxs(Box, {
    minH: "100vh",
    bg: "bg",
    children: [/* @__PURE__ */ jsx(AuthenticatedNavbar, {}), /* @__PURE__ */ jsx(Container, {
      maxW: "6xl",
      py: 10,
      children: /* @__PURE__ */ jsxs(Flex, {
        gap: 12,
        align: "flex-start",
        children: [/* @__PURE__ */ jsxs(Box, {
          flexShrink: 0,
          w: "180px",
          children: [/* @__PURE__ */ jsx(Heading, {
            fontSize: "lg",
            fontWeight: "600",
            letterSpacing: "-0.01em",
            mb: 5,
            children: "Settings"
          }), /* @__PURE__ */ jsx(Flex, {
            direction: "column",
            gap: 1,
            children: NAV_ITEMS.map((item) => /* @__PURE__ */ jsx(NavLink, {
              to: item.href,
              end: true,
              children: ({
                isActive
              }) => /* @__PURE__ */ jsx(Text, {
                px: 3,
                py: 2,
                fontSize: "sm",
                fontWeight: isActive ? "500" : "400",
                color: isActive ? "fg" : "fg.muted",
                bg: isActive ? "bg.muted" : "transparent",
                borderRadius: "md",
                cursor: "pointer",
                _hover: {
                  color: "fg",
                  bg: "bg.muted"
                },
                transition: "all 0.1s",
                children: item.label
              })
            }, item.href))
          })]
        }), /* @__PURE__ */ jsx(Box, {
          flex: 1,
          minW: 0,
          children: /* @__PURE__ */ jsx(Outlet, {})
        })]
      })
    })]
  });
});
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: settings
}, Symbol.toStringTag, { value: "Module" }));
const settings_index = UNSAFE_withComponentProps(function SettingsIndex() {
  return /* @__PURE__ */ jsx(Navigate, {
    to: "/settings/general",
    replace: true
  });
});
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: settings_index
}, Symbol.toStringTag, { value: "Module" }));
function Section$1({
  title,
  children
}) {
  return /* @__PURE__ */ jsxs(Box, {
    mb: 10,
    children: [/* @__PURE__ */ jsx(Heading, {
      fontSize: "md",
      fontWeight: "600",
      letterSpacing: "-0.01em",
      mb: 5,
      pb: 3,
      borderBottomWidth: "1px",
      borderColor: "border",
      children: title
    }), children]
  });
}
function SettingRow$1({
  label,
  description,
  children
}) {
  return /* @__PURE__ */ jsxs(Flex, {
    justify: "space-between",
    align: "center",
    py: 4,
    borderBottomWidth: "1px",
    borderColor: "border",
    gap: 8,
    _last: {
      borderBottom: "none"
    },
    children: [/* @__PURE__ */ jsxs(Box, {
      children: [/* @__PURE__ */ jsx(Text, {
        fontSize: "sm",
        fontWeight: "500",
        children: label
      }), description && /* @__PURE__ */ jsx(Text, {
        fontSize: "xs",
        color: "fg.muted",
        mt: 0.5,
        lineHeight: 1.5,
        children: description
      })]
    }), /* @__PURE__ */ jsx(Box, {
      flexShrink: 0,
      children
    })]
  });
}
const settings_general = UNSAFE_withComponentProps(function GeneralSettings() {
  return /* @__PURE__ */ jsxs(Box, {
    children: [/* @__PURE__ */ jsx(Heading, {
      fontSize: {
        base: "xl",
        md: "2xl"
      },
      fontWeight: "400",
      letterSpacing: "-0.02em",
      mb: 8,
      children: "General"
    }), /* @__PURE__ */ jsxs(Section$1, {
      title: "Preferences",
      children: [/* @__PURE__ */ jsx(SettingRow$1, {
        label: "Default validation mode",
        description: "Choose whether single or bulk validation is shown first on login.",
        children: /* @__PURE__ */ jsx(Input, {
          defaultValue: "Single",
          size: "sm",
          w: "140px",
          borderRadius: "md",
          borderColor: "border",
          fontSize: "sm"
        })
      }), /* @__PURE__ */ jsx(SettingRow$1, {
        label: "Show validation score",
        description: "Display a risk score alongside each validation result.",
        children: /* @__PURE__ */ jsxs(Switch.Root, {
          defaultChecked: true,
          size: "sm",
          children: [/* @__PURE__ */ jsx(Switch.HiddenInput, {}), /* @__PURE__ */ jsx(Switch.Control, {})]
        })
      }), /* @__PURE__ */ jsx(SettingRow$1, {
        label: "Auto-export results",
        description: "Automatically download a CSV after each bulk validation job.",
        children: /* @__PURE__ */ jsxs(Switch.Root, {
          size: "sm",
          children: [/* @__PURE__ */ jsx(Switch.HiddenInput, {}), /* @__PURE__ */ jsx(Switch.Control, {})]
        })
      })]
    }), /* @__PURE__ */ jsxs(Section$1, {
      title: "Notifications",
      children: [/* @__PURE__ */ jsx(SettingRow$1, {
        label: "Bulk job completed",
        description: "Get notified by email when a bulk validation job finishes.",
        children: /* @__PURE__ */ jsxs(Switch.Root, {
          defaultChecked: true,
          size: "sm",
          children: [/* @__PURE__ */ jsx(Switch.HiddenInput, {}), /* @__PURE__ */ jsx(Switch.Control, {})]
        })
      }), /* @__PURE__ */ jsx(SettingRow$1, {
        label: "Monthly usage summary",
        description: "Receive a monthly email with your usage stats and trends.",
        children: /* @__PURE__ */ jsxs(Switch.Root, {
          size: "sm",
          children: [/* @__PURE__ */ jsx(Switch.HiddenInput, {}), /* @__PURE__ */ jsx(Switch.Control, {})]
        })
      }), /* @__PURE__ */ jsx(SettingRow$1, {
        label: "Low credit warning",
        description: "Alert me when my remaining validation credits drop below 500.",
        children: /* @__PURE__ */ jsxs(Switch.Root, {
          defaultChecked: true,
          size: "sm",
          children: [/* @__PURE__ */ jsx(Switch.HiddenInput, {}), /* @__PURE__ */ jsx(Switch.Control, {})]
        })
      })]
    })]
  });
});
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: settings_general
}, Symbol.toStringTag, { value: "Module" }));
function Row({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs(Flex, {
    justify: "space-between",
    align: "center",
    py: 4,
    borderBottomWidth: "1px",
    borderColor: "border",
    gap: 8,
    children: [/* @__PURE__ */ jsx(Text, {
      fontSize: "sm",
      children: label
    }), /* @__PURE__ */ jsx(Box, {
      children
    })]
  });
}
function formatDate(epoch) {
  if (!epoch) return "—";
  return new Date(epoch * 1e3).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}
function getDevice() {
  const ua = navigator.userAgent;
  let browser = "Browser";
  let os = "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";
  if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  return `${browser} (${os})`;
}
const settings_account = UNSAFE_withComponentProps(function AccountSettings() {
  const auth = useAuth();
  const profile = auth.user?.profile;
  const issuedAt = profile?.iat;
  const expiresAt = auth.user?.expires_at;
  function handleLogout() {
    auth.signoutRedirect();
  }
  return /* @__PURE__ */ jsxs(Box, {
    children: [/* @__PURE__ */ jsx(Heading, {
      fontSize: {
        base: "xl",
        md: "2xl"
      },
      fontWeight: "400",
      letterSpacing: "-0.02em",
      mb: 8,
      children: "Account"
    }), /* @__PURE__ */ jsxs(Box, {
      mb: 10,
      children: [/* @__PURE__ */ jsx(Row, {
        label: "Log out of all devices",
        children: /* @__PURE__ */ jsx(Button, {
          size: "sm",
          variant: "outline",
          borderColor: "border",
          borderRadius: "md",
          fontSize: "sm",
          fontWeight: "500",
          onClick: handleLogout,
          children: "Log out"
        })
      }), /* @__PURE__ */ jsx(Row, {
        label: "Delete account",
        children: /* @__PURE__ */ jsx(Text, {
          fontSize: "xs",
          color: "fg.muted",
          textAlign: "right",
          maxW: "220px",
          children: "Contact support to permanently delete your account and all data."
        })
      }), /* @__PURE__ */ jsx(Row, {
        label: "Your role",
        children: /* @__PURE__ */ jsx(Text, {
          fontSize: "sm",
          color: "fg.muted",
          children: "User"
        })
      })]
    }), /* @__PURE__ */ jsxs(Box, {
      children: [/* @__PURE__ */ jsx(Heading, {
        fontSize: "md",
        fontWeight: "600",
        letterSpacing: "-0.01em",
        mb: 5,
        children: "Active sessions"
      }), /* @__PURE__ */ jsxs(Table.Root, {
        size: "sm",
        variant: "outline",
        borderRadius: "md",
        children: [/* @__PURE__ */ jsx(Table.Header, {
          children: /* @__PURE__ */ jsxs(Table.Row, {
            bg: "bg.subtle",
            children: [/* @__PURE__ */ jsx(Table.ColumnHeader, {
              fontSize: "xs",
              fontWeight: "500",
              color: "fg.muted",
              py: 3,
              children: "Device"
            }), /* @__PURE__ */ jsx(Table.ColumnHeader, {
              fontSize: "xs",
              fontWeight: "500",
              color: "fg.muted",
              py: 3,
              children: "Created"
            }), /* @__PURE__ */ jsx(Table.ColumnHeader, {
              fontSize: "xs",
              fontWeight: "500",
              color: "fg.muted",
              py: 3,
              children: "Expires"
            }), /* @__PURE__ */ jsx(Table.ColumnHeader, {
              py: 3
            })]
          })
        }), /* @__PURE__ */ jsx(Table.Body, {
          children: /* @__PURE__ */ jsxs(Table.Row, {
            children: [/* @__PURE__ */ jsx(Table.Cell, {
              py: 4,
              fontSize: "sm",
              children: /* @__PURE__ */ jsxs(Flex, {
                align: "center",
                gap: 2,
                children: [getDevice(), /* @__PURE__ */ jsx(Badge, {
                  size: "sm",
                  variant: "subtle",
                  colorPalette: "green",
                  borderRadius: "full",
                  px: 2,
                  fontSize: "10px",
                  children: "Current"
                })]
              })
            }), /* @__PURE__ */ jsx(Table.Cell, {
              py: 4,
              fontSize: "sm",
              color: "fg.muted",
              children: formatDate(issuedAt)
            }), /* @__PURE__ */ jsx(Table.Cell, {
              py: 4,
              fontSize: "sm",
              color: "fg.muted",
              children: formatDate(expiresAt)
            }), /* @__PURE__ */ jsx(Table.Cell, {
              py: 4,
              textAlign: "right",
              children: /* @__PURE__ */ jsx(Box, {
                as: "button",
                color: "fg.muted",
                _hover: {
                  color: "fg"
                },
                transition: "color 0.1s",
                children: /* @__PURE__ */ jsx(FiMoreHorizontal, {})
              })
            })]
          })
        })]
      })]
    })]
  });
});
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: settings_account
}, Symbol.toStringTag, { value: "Module" }));
function Section({
  title,
  description,
  children
}) {
  return /* @__PURE__ */ jsxs(Box, {
    mb: 10,
    children: [/* @__PURE__ */ jsxs(Box, {
      mb: 5,
      pb: 3,
      borderBottomWidth: "1px",
      borderColor: "border",
      children: [/* @__PURE__ */ jsx(Heading, {
        fontSize: "md",
        fontWeight: "600",
        letterSpacing: "-0.01em",
        children: title
      }), description && /* @__PURE__ */ jsx(Text, {
        fontSize: "xs",
        color: "fg.muted",
        mt: 1,
        children: description
      })]
    }), children]
  });
}
function SettingRow({
  label,
  description,
  children
}) {
  return /* @__PURE__ */ jsxs(Flex, {
    justify: "space-between",
    align: "center",
    py: 4,
    borderBottomWidth: "1px",
    borderColor: "border",
    gap: 8,
    _last: {
      borderBottom: "none"
    },
    children: [/* @__PURE__ */ jsxs(Box, {
      children: [/* @__PURE__ */ jsx(Text, {
        fontSize: "sm",
        fontWeight: "500",
        children: label
      }), description && /* @__PURE__ */ jsx(Text, {
        fontSize: "xs",
        color: "fg.muted",
        mt: 0.5,
        lineHeight: 1.5,
        children: description
      })]
    }), /* @__PURE__ */ jsx(Box, {
      flexShrink: 0,
      children
    })]
  });
}
const settings_analytics = UNSAFE_withComponentProps(function AnalyticsSettings() {
  return /* @__PURE__ */ jsxs(Box, {
    children: [/* @__PURE__ */ jsx(Heading, {
      fontSize: {
        base: "xl",
        md: "2xl"
      },
      fontWeight: "400",
      letterSpacing: "-0.02em",
      mb: 8,
      children: "Analytics"
    }), /* @__PURE__ */ jsxs(Section, {
      title: "Data collection",
      description: "Control what usage data Scrub collects to improve your experience.",
      children: [/* @__PURE__ */ jsx(SettingRow, {
        label: "Usage analytics",
        description: "Allow Scrub to collect anonymised usage data to improve the product.",
        children: /* @__PURE__ */ jsxs(Switch.Root, {
          defaultChecked: true,
          size: "sm",
          children: [/* @__PURE__ */ jsx(Switch.HiddenInput, {}), /* @__PURE__ */ jsx(Switch.Control, {})]
        })
      }), /* @__PURE__ */ jsx(SettingRow, {
        label: "Error reporting",
        description: "Automatically send crash reports and error logs to help us fix bugs faster.",
        children: /* @__PURE__ */ jsxs(Switch.Root, {
          defaultChecked: true,
          size: "sm",
          children: [/* @__PURE__ */ jsx(Switch.HiddenInput, {}), /* @__PURE__ */ jsx(Switch.Control, {})]
        })
      }), /* @__PURE__ */ jsx(SettingRow, {
        label: "Feature usage tracking",
        description: "Track which features you use so we can prioritise improvements.",
        children: /* @__PURE__ */ jsxs(Switch.Root, {
          size: "sm",
          children: [/* @__PURE__ */ jsx(Switch.HiddenInput, {}), /* @__PURE__ */ jsx(Switch.Control, {})]
        })
      })]
    }), /* @__PURE__ */ jsxs(Section, {
      title: "Data retention",
      description: "Choose how long your validation history is stored.",
      children: [/* @__PURE__ */ jsx(SettingRow, {
        label: "Keep validation history",
        description: "Store individual validation results so you can review them later.",
        children: /* @__PURE__ */ jsxs(Switch.Root, {
          defaultChecked: true,
          size: "sm",
          children: [/* @__PURE__ */ jsx(Switch.HiddenInput, {}), /* @__PURE__ */ jsx(Switch.Control, {})]
        })
      }), /* @__PURE__ */ jsx(SettingRow, {
        label: "Keep bulk job logs",
        description: "Retain logs and result files from bulk CSV validation jobs.",
        children: /* @__PURE__ */ jsxs(Switch.Root, {
          defaultChecked: true,
          size: "sm",
          children: [/* @__PURE__ */ jsx(Switch.HiddenInput, {}), /* @__PURE__ */ jsx(Switch.Control, {})]
        })
      })]
    })]
  });
});
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: settings_analytics
}, Symbol.toStringTag, { value: "Module" }));
function getHistory(token, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  if (params.is_valid !== void 0)
    query.set("is_valid", String(params.is_valid));
  if (params.email) query.set("email", params.email);
  if (params.request_id) query.set("request_id", params.request_id);
  return apiFetch(`/validation/history?${query}`, token);
}
function StatusBadge({ isValid }) {
  return /* @__PURE__ */ jsx(
    Badge,
    {
      px: 2,
      py: 0.5,
      borderRadius: "full",
      fontSize: "xs",
      fontWeight: 500,
      bg: isValid ? "valid.bg" : "invalid.bg",
      color: isValid ? "valid.fg" : "invalid.fg",
      border: "1px solid",
      borderColor: isValid ? "valid.border" : "invalid.border",
      children: isValid ? "Valid" : "Invalid"
    }
  );
}
function EmptyStateCard({ filtered }) {
  return /* @__PURE__ */ jsxs(Flex, { direction: "column", align: "center", justify: "center", py: 16, gap: 2, children: [
    /* @__PURE__ */ jsx(FiInbox, { size: 28, color: "var(--chakra-colors-fg-muted)" }),
    /* @__PURE__ */ jsx(Text, { fontSize: "sm", fontWeight: 500, color: "fg", children: "No history found" }),
    /* @__PURE__ */ jsx(Text, { fontSize: "xs", color: "fg.muted", children: filtered ? "Try adjusting your filters." : "Validated emails will appear here." })
  ] });
}
function BulkDrawerCard({
  requestId,
  token,
  onClose
}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    getHistory(token, { request_id: requestId }).then((page) => setEntries(page.results)).catch(console.error).finally(() => setLoading(false));
  }, [requestId, token]);
  const valid = entries.filter((e) => e.is_valid).length;
  const invalid = entries.length - valid;
  return /* @__PURE__ */ jsx(
    Box,
    {
      position: "fixed",
      inset: 0,
      zIndex: 200,
      bg: "blackAlpha.600",
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        Box,
        {
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          w: { base: "100%", md: "520px" },
          bg: "bg.subtle",
          boxShadow: "xl",
          overflowY: "auto",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxs(
              Box,
              {
                px: 6,
                py: 5,
                borderBottomWidth: "1px",
                borderColor: "border",
                position: "sticky",
                top: 0,
                bg: "bg.subtle",
                zIndex: 1,
                children: [
                  /* @__PURE__ */ jsxs(Flex, { justify: "space-between", align: "flex-start", children: [
                    /* @__PURE__ */ jsxs(Box, { children: [
                      /* @__PURE__ */ jsx(
                        Text,
                        {
                          fontSize: "xs",
                          color: "fg.muted",
                          mb: 1,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          fontWeight: 500,
                          children: "Bulk Job"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        Text,
                        {
                          fontFamily: "Geist Mono, monospace",
                          fontSize: "xs",
                          color: "fg",
                          wordBreak: "break-all",
                          children: requestId
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: onClose, mt: -1, children: /* @__PURE__ */ jsx(FiX, {}) })
                  ] }),
                  !loading && entries.length > 0 && /* @__PURE__ */ jsxs(Flex, { gap: 3, mt: 4, children: [
                    /* @__PURE__ */ jsxs(
                      Box,
                      {
                        bg: "valid.bg",
                        border: "1px solid",
                        borderColor: "valid.border",
                        borderRadius: "md",
                        px: 3,
                        py: 2,
                        flex: 1,
                        children: [
                          /* @__PURE__ */ jsx(Text, { fontSize: "xs", color: "valid.fg", fontWeight: 500, children: "Valid" }),
                          /* @__PURE__ */ jsx(
                            Text,
                            {
                              fontSize: "xl",
                              fontWeight: 700,
                              color: "valid.fg",
                              fontFamily: "Geist Mono, monospace",
                              children: valid
                            }
                          )
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      Box,
                      {
                        bg: "invalid.bg",
                        border: "1px solid",
                        borderColor: "invalid.border",
                        borderRadius: "md",
                        px: 3,
                        py: 2,
                        flex: 1,
                        children: [
                          /* @__PURE__ */ jsx(Text, { fontSize: "xs", color: "invalid.fg", fontWeight: 500, children: "Invalid" }),
                          /* @__PURE__ */ jsx(
                            Text,
                            {
                              fontSize: "xl",
                              fontWeight: 700,
                              color: "invalid.fg",
                              fontFamily: "Geist Mono, monospace",
                              children: invalid
                            }
                          )
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      Box,
                      {
                        bg: "bg.muted",
                        border: "1px solid",
                        borderColor: "border",
                        borderRadius: "md",
                        px: 3,
                        py: 2,
                        flex: 1,
                        children: [
                          /* @__PURE__ */ jsx(Text, { fontSize: "xs", color: "fg.muted", fontWeight: 500, children: "Total" }),
                          /* @__PURE__ */ jsx(
                            Text,
                            {
                              fontSize: "xl",
                              fontWeight: 700,
                              color: "fg",
                              fontFamily: "Geist Mono, monospace",
                              children: entries.length
                            }
                          )
                        ]
                      }
                    )
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsx(Box, { px: 6, py: 4, children: loading ? /* @__PURE__ */ jsx(Flex, { justify: "center", py: 10, children: /* @__PURE__ */ jsx(Spinner, { color: "brand.solid" }) }) : entries.length === 0 ? /* @__PURE__ */ jsx(Text, { color: "fg.muted", fontSize: "sm", children: "No results found." }) : /* @__PURE__ */ jsx(Flex, { direction: "column", gap: 1, children: entries.map((e) => /* @__PURE__ */ jsxs(
              Flex,
              {
                align: "center",
                justify: "space-between",
                gap: 3,
                py: 2,
                borderBottomWidth: "1px",
                borderColor: "border",
                _last: { borderBottomWidth: 0 },
                children: [
                  /* @__PURE__ */ jsxs(Flex, { align: "center", gap: 2.5, flex: 1, minW: 0, children: [
                    /* @__PURE__ */ jsx(
                      Box,
                      {
                        w: 1.5,
                        h: 1.5,
                        borderRadius: "full",
                        bg: e.is_valid ? "valid.fg" : "invalid.fg",
                        flexShrink: 0
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Text,
                      {
                        fontSize: "xs",
                        fontFamily: "Geist Mono, monospace",
                        color: "fg",
                        truncate: true,
                        children: e.email
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs(Flex, { align: "center", gap: 3, flexShrink: 0, children: [
                    /* @__PURE__ */ jsx(StatusBadge, { isValid: e.is_valid }),
                    e.quality_score != null && /* @__PURE__ */ jsx(
                      Text,
                      {
                        fontSize: "xs",
                        fontFamily: "Geist Mono, monospace",
                        color: "fg.muted",
                        w: "32px",
                        textAlign: "right",
                        children: e.quality_score
                      }
                    )
                  ] })
                ]
              },
              e.id
            )) }) })
          ]
        }
      )
    }
  );
}
function HistorySearchForm({
  value,
  onChange,
  onSubmit,
  onClear,
  isActive,
  loading
}) {
  return /* @__PURE__ */ jsx("form", { onSubmit, children: /* @__PURE__ */ jsxs(Flex, { gap: 2, children: [
    /* @__PURE__ */ jsx(
      Input,
      {
        placeholder: "Search by email or request ID…",
        size: "sm",
        borderRadius: "md",
        borderColor: "border",
        value,
        onChange: (e) => onChange(e.target.value),
        w: "260px"
      }
    ),
    /* @__PURE__ */ jsx(
      Button,
      {
        size: "sm",
        type: "submit",
        variant: "outline",
        borderColor: "border",
        borderRadius: "md",
        loading,
        children: "Search"
      }
    ),
    isActive && /* @__PURE__ */ jsx(
      Button,
      {
        size: "sm",
        variant: "ghost",
        borderRadius: "md",
        onClick: onClear,
        type: "button",
        children: "Clear"
      }
    )
  ] }) });
}
const PAGE_SIZE = 20;
const FILTERS = [{
  label: "All",
  value: void 0
}, {
  label: "Valid",
  value: true
}, {
  label: "Invalid",
  value: false
}];
const settings_history = UNSAFE_withComponentProps(function HistorySettings() {
  const auth = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterValid, setFilterValid] = useState(void 0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState(null);
  const [activeBulkId, setActiveBulkId] = useState(null);
  const token = auth.user?.access_token ?? "";
  const fetchHistory = useCallback((params) => {
    if (!auth.user?.access_token) return;
    setLoading(true);
    getHistory(auth.user.access_token, params).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [auth.user?.access_token]);
  useEffect(() => {
    if (searchQuery) {
      fetchHistory({
        page_size: PAGE_SIZE,
        ...searchQuery
      });
    } else {
      fetchHistory({
        page,
        page_size: PAGE_SIZE,
        is_valid: filterValid
      });
    }
  }, [page, filterValid, searchQuery, fetchHistory]);
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;
  const isSearchActive = searchQuery !== null;
  const isFiltered = filterValid !== void 0 || isSearchActive;
  const displayedEntries = data?.results ?? [];
  function handleFilterToggle(value) {
    setFilterValid(value);
    setPage(1);
  }
  function handleSearchSubmit(e) {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;
    const params = query.includes("@") ? {
      email: query
    } : {
      request_id: query
    };
    setSearchQuery(params);
  }
  function handleSearchClear() {
    setSearchInput("");
    setSearchQuery(null);
    setPage(1);
  }
  return /* @__PURE__ */ jsxs(Box, {
    children: [activeBulkId && /* @__PURE__ */ jsx(BulkDrawerCard, {
      requestId: activeBulkId,
      token,
      onClose: () => setActiveBulkId(null)
    }), /* @__PURE__ */ jsx(Heading, {
      fontSize: {
        base: "xl",
        md: "2xl"
      },
      fontWeight: "400",
      letterSpacing: "-0.02em",
      mb: 2,
      children: "History"
    }), /* @__PURE__ */ jsx(Text, {
      fontSize: "sm",
      color: "fg.muted",
      mb: 6,
      children: "All email validations, newest first."
    }), data && data.total > 0 && !isSearchActive && /* @__PURE__ */ jsxs(Flex, {
      gap: 3,
      mb: 6,
      children: [/* @__PURE__ */ jsxs(Box, {
        bg: "bg.muted",
        border: "1px solid",
        borderColor: "border",
        borderRadius: "lg",
        px: 4,
        py: 3,
        flex: 1,
        children: [/* @__PURE__ */ jsx(Text, {
          fontSize: "xs",
          color: "fg.muted",
          fontWeight: 500,
          mb: 1,
          children: "Total"
        }), /* @__PURE__ */ jsx(Text, {
          fontSize: "2xl",
          fontWeight: 700,
          fontFamily: "Geist Mono, monospace",
          color: "fg",
          children: data.total
        })]
      }), /* @__PURE__ */ jsxs(Box, {
        bg: "valid.bg",
        border: "1px solid",
        borderColor: "valid.border",
        borderRadius: "lg",
        px: 4,
        py: 3,
        flex: 1,
        children: [/* @__PURE__ */ jsx(Text, {
          fontSize: "xs",
          color: "valid.fg",
          fontWeight: 500,
          mb: 1,
          children: "Valid"
        }), /* @__PURE__ */ jsx(Text, {
          fontSize: "2xl",
          fontWeight: 700,
          fontFamily: "Geist Mono, monospace",
          color: "valid.fg",
          children: data.results.filter((r) => r.is_valid).length
        })]
      }), /* @__PURE__ */ jsxs(Box, {
        bg: "invalid.bg",
        border: "1px solid",
        borderColor: "invalid.border",
        borderRadius: "lg",
        px: 4,
        py: 3,
        flex: 1,
        children: [/* @__PURE__ */ jsx(Text, {
          fontSize: "xs",
          color: "invalid.fg",
          fontWeight: 500,
          mb: 1,
          children: "Invalid"
        }), /* @__PURE__ */ jsx(Text, {
          fontSize: "2xl",
          fontWeight: 700,
          fontFamily: "Geist Mono, monospace",
          color: "invalid.fg",
          children: data.results.filter((r) => !r.is_valid).length
        })]
      })]
    }), /* @__PURE__ */ jsxs(Flex, {
      gap: 3,
      mb: 4,
      align: "center",
      justify: "space-between",
      wrap: "wrap",
      children: [!isSearchActive && /* @__PURE__ */ jsx(Flex, {
        gap: 2,
        children: FILTERS.map(({
          label,
          value
        }) => /* @__PURE__ */ jsx(Button, {
          size: "sm",
          borderRadius: "full",
          variant: filterValid === value ? "solid" : "outline",
          bg: filterValid === value ? "brand.solid" : void 0,
          color: filterValid === value ? "brand.contrast" : "fg.muted",
          borderColor: "border",
          _hover: {
            bg: filterValid === value ? "brand.600" : "bg.muted"
          },
          onClick: () => handleFilterToggle(value),
          children: label
        }, label))
      }), /* @__PURE__ */ jsx(Box, {
        ml: "auto",
        children: /* @__PURE__ */ jsx(HistorySearchForm, {
          value: searchInput,
          onChange: setSearchInput,
          onSubmit: handleSearchSubmit,
          onClear: handleSearchClear,
          isActive: isSearchActive,
          loading: loading && isSearchActive
        })
      })]
    }), isSearchActive && data && /* @__PURE__ */ jsxs(Text, {
      fontSize: "xs",
      color: "fg.muted",
      mb: 3,
      children: [searchQuery?.email ? `All validations for ${searchQuery.email}` : `All results for bulk job ${searchQuery?.request_id?.slice(0, 8)}…`, " ", "— ", data.total, " found"]
    }), /* @__PURE__ */ jsx(Box, {
      bg: "bg.subtle",
      border: "1px solid",
      borderColor: "border",
      borderRadius: "lg",
      overflow: "hidden",
      children: loading ? /* @__PURE__ */ jsx(Flex, {
        justify: "center",
        py: 16,
        children: /* @__PURE__ */ jsx(Spinner, {
          color: "brand.solid"
        })
      }) : displayedEntries.length === 0 ? /* @__PURE__ */ jsx(EmptyStateCard, {
        filtered: isFiltered
      }) : /* @__PURE__ */ jsxs(Flex, {
        direction: "column",
        children: [/* @__PURE__ */ jsxs(Flex, {
          px: 4,
          py: 2,
          bg: "bg.muted",
          borderBottomWidth: "1px",
          borderColor: "border",
          gap: 3,
          children: [/* @__PURE__ */ jsx(Text, {
            fontSize: "xs",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "fg.muted",
            flex: 1,
            children: "Email"
          }), /* @__PURE__ */ jsx(Text, {
            fontSize: "xs",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "fg.muted",
            w: "72px",
            children: "Status"
          }), /* @__PURE__ */ jsx(Text, {
            fontSize: "xs",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "fg.muted",
            w: "48px",
            textAlign: "right",
            children: "Score"
          }), /* @__PURE__ */ jsx(Text, {
            fontSize: "xs",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "fg.muted",
            w: "140px",
            children: "Validated At"
          }), /* @__PURE__ */ jsx(Text, {
            fontSize: "xs",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "fg.muted",
            w: "80px",
            children: "Bulk Job"
          })]
        }), displayedEntries.map((entry2) => /* @__PURE__ */ jsxs(Flex, {
          px: 4,
          py: 3,
          gap: 3,
          align: "center",
          borderBottomWidth: "1px",
          borderColor: "border",
          _last: {
            borderBottomWidth: 0
          },
          _hover: {
            bg: "bg.muted"
          },
          transition: "background 0.1s",
          children: [/* @__PURE__ */ jsxs(Flex, {
            align: "center",
            gap: 2.5,
            flex: 1,
            minW: 0,
            children: [/* @__PURE__ */ jsx(Box, {
              w: 1.5,
              h: 1.5,
              borderRadius: "full",
              bg: entry2.is_valid ? "valid.fg" : "invalid.fg",
              flexShrink: 0
            }), /* @__PURE__ */ jsx(Text, {
              fontSize: "sm",
              fontFamily: "Geist Mono, monospace",
              fontWeight: 500,
              color: "fg",
              truncate: true,
              children: entry2.email
            })]
          }), /* @__PURE__ */ jsx(Box, {
            w: "72px",
            children: /* @__PURE__ */ jsx(StatusBadge, {
              isValid: entry2.is_valid
            })
          }), /* @__PURE__ */ jsx(Text, {
            fontSize: "sm",
            fontFamily: "Geist Mono, monospace",
            color: "fg.muted",
            w: "48px",
            textAlign: "right",
            children: entry2.quality_score ?? "—"
          }), /* @__PURE__ */ jsx(Text, {
            fontSize: "xs",
            color: "fg.muted",
            w: "140px",
            children: new Date(entry2.validated_at).toLocaleString(void 0, {
              dateStyle: "medium",
              timeStyle: "short"
            })
          }), /* @__PURE__ */ jsx(Box, {
            w: "80px",
            children: entry2.request_id ? /* @__PURE__ */ jsxs(Button, {
              size: "xs",
              variant: "ghost",
              borderRadius: "md",
              fontFamily: "Geist Mono, monospace",
              fontSize: "xs",
              color: "fg.muted",
              _hover: {
                color: "fg",
                bg: "bg.muted"
              },
              onClick: () => setActiveBulkId(entry2.request_id),
              children: [entry2.request_id.slice(0, 8), "…"]
            }) : /* @__PURE__ */ jsx(Text, {
              fontSize: "sm",
              color: "fg.muted",
              children: "—"
            })
          })]
        }, entry2.id))]
      })
    }), !loading && !isSearchActive && totalPages > 1 && /* @__PURE__ */ jsxs(Flex, {
      justify: "space-between",
      align: "center",
      mt: 4,
      children: [/* @__PURE__ */ jsxs(Text, {
        fontSize: "sm",
        color: "fg.muted",
        children: ["Page ", page, " of ", totalPages, " — ", data?.total ?? 0, " total"]
      }), /* @__PURE__ */ jsx(Pagination.Root, {
        count: data?.total ?? 0,
        pageSize: PAGE_SIZE,
        page,
        onPageChange: (details) => setPage(details.page),
        children: /* @__PURE__ */ jsxs(Flex, {
          gap: 1,
          children: [/* @__PURE__ */ jsx(Pagination.PrevTrigger, {
            asChild: true,
            children: /* @__PURE__ */ jsx(Button, {
              size: "sm",
              variant: "outline",
              borderRadius: "md",
              borderColor: "border",
              children: "Previous"
            })
          }), /* @__PURE__ */ jsx(Pagination.NextTrigger, {
            asChild: true,
            children: /* @__PURE__ */ jsx(Button, {
              size: "sm",
              variant: "outline",
              borderRadius: "md",
              borderColor: "border",
              children: "Next"
            })
          })]
        })
      })]
    })]
  });
});
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: settings_history
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-VQ36fe5k.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js", "/assets/index-B-l7eBGz.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-BWBayEQM.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js", "/assets/index-B-l7eBGz.js", "/assets/react-oidc-context-D_E8vvIz.js", "/assets/split-props-DibKY-94.js", "/assets/walk-object-yxyoLY_G.js", "/assets/create-anatomy-BgxHbLYw.js", "/assets/switch.anatomy-CEiFFQaB.js", "/assets/popover.anatomy-D3HauKcz.js", "/assets/field.anatomy-O3OlSKiN.js", "/assets/accordion.anatomy-CAyPn3Xk.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-CvLAqFI6.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js", "/assets/react-oidc-context-D_E8vvIz.js", "/assets/index-CkB4eebM.js", "/assets/flex-DR3XNPiz.js", "/assets/container-CfVBVhja.js", "/assets/link-B_GQFa4s.js", "/assets/index-bHsfQaa6.js", "/assets/index-D0tbSgDA.js", "/assets/badge-8qr3NK_9.js", "/assets/input-frsaMGm3.js", "/assets/split-props-DibKY-94.js", "/assets/walk-object-yxyoLY_G.js", "/assets/normalize-props-CUirt2IH.js", "/assets/event-DvPidmzT.js", "/assets/create-anatomy-BgxHbLYw.js", "/assets/equal-DfFTejAs.js", "/assets/accordion.anatomy-CAyPn3Xk.js", "/assets/spinner-D-tX8Mh1.js", "/assets/use-field-context-V2-5yF4w.js", "/assets/index-B-l7eBGz.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/dashboard": { "id": "routes/dashboard", "parentId": "root", "path": "dashboard", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/dashboard-Cm-_wjao.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js", "/assets/react-oidc-context-D_E8vvIz.js", "/assets/authenticated-navbar-q37_0p4i.js", "/assets/client-Drh0rYrD.js", "/assets/index-CkB4eebM.js", "/assets/flex-DR3XNPiz.js", "/assets/badge-8qr3NK_9.js", "/assets/index-bHsfQaa6.js", "/assets/link-B_GQFa4s.js", "/assets/input-frsaMGm3.js", "/assets/spinner-D-tX8Mh1.js", "/assets/split-props-DibKY-94.js", "/assets/use-field-context-V2-5yF4w.js", "/assets/normalize-props-CUirt2IH.js", "/assets/field.anatomy-O3OlSKiN.js", "/assets/container-CfVBVhja.js", "/assets/index-B-l7eBGz.js", "/assets/event-DvPidmzT.js", "/assets/popover.anatomy-D3HauKcz.js", "/assets/create-anatomy-BgxHbLYw.js", "/assets/index-CX63LmfT.js", "/assets/equal-DfFTejAs.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/lists": { "id": "routes/lists", "parentId": "root", "path": "lists", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/lists-7qZ8iaec.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js", "/assets/react-oidc-context-D_E8vvIz.js", "/assets/authenticated-navbar-q37_0p4i.js", "/assets/flex-DR3XNPiz.js", "/assets/container-CfVBVhja.js", "/assets/index-D0tbSgDA.js", "/assets/index-bHsfQaa6.js", "/assets/index-CkB4eebM.js", "/assets/split-props-DibKY-94.js", "/assets/spinner-D-tX8Mh1.js", "/assets/client-Drh0rYrD.js", "/assets/index-B-l7eBGz.js", "/assets/normalize-props-CUirt2IH.js", "/assets/link-B_GQFa4s.js", "/assets/event-DvPidmzT.js", "/assets/popover.anatomy-D3HauKcz.js", "/assets/create-anatomy-BgxHbLYw.js", "/assets/index-CX63LmfT.js", "/assets/equal-DfFTejAs.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/integrations": { "id": "routes/integrations", "parentId": "root", "path": "integrations", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/integrations-DuVVdmBF.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js", "/assets/react-oidc-context-D_E8vvIz.js", "/assets/authenticated-navbar-q37_0p4i.js", "/assets/flex-DR3XNPiz.js", "/assets/container-CfVBVhja.js", "/assets/index-D0tbSgDA.js", "/assets/index-bHsfQaa6.js", "/assets/index-CkB4eebM.js", "/assets/split-props-DibKY-94.js", "/assets/spinner-D-tX8Mh1.js", "/assets/client-Drh0rYrD.js", "/assets/index-B-l7eBGz.js", "/assets/normalize-props-CUirt2IH.js", "/assets/link-B_GQFa4s.js", "/assets/event-DvPidmzT.js", "/assets/popover.anatomy-D3HauKcz.js", "/assets/create-anatomy-BgxHbLYw.js", "/assets/index-CX63LmfT.js", "/assets/equal-DfFTejAs.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/docs": { "id": "routes/docs", "parentId": "root", "path": "docs", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/docs-B2mRF9QG.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js", "/assets/react-oidc-context-D_E8vvIz.js", "/assets/authenticated-navbar-q37_0p4i.js", "/assets/flex-DR3XNPiz.js", "/assets/container-CfVBVhja.js", "/assets/index-D0tbSgDA.js", "/assets/index-bHsfQaa6.js", "/assets/index-CkB4eebM.js", "/assets/split-props-DibKY-94.js", "/assets/spinner-D-tX8Mh1.js", "/assets/client-Drh0rYrD.js", "/assets/index-B-l7eBGz.js", "/assets/normalize-props-CUirt2IH.js", "/assets/link-B_GQFa4s.js", "/assets/event-DvPidmzT.js", "/assets/popover.anatomy-D3HauKcz.js", "/assets/create-anatomy-BgxHbLYw.js", "/assets/index-CX63LmfT.js", "/assets/equal-DfFTejAs.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api": { "id": "routes/api", "parentId": "root", "path": "api", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/api-CsBSlQXG.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js", "/assets/react-oidc-context-D_E8vvIz.js", "/assets/authenticated-navbar-q37_0p4i.js", "/assets/flex-DR3XNPiz.js", "/assets/container-CfVBVhja.js", "/assets/index-D0tbSgDA.js", "/assets/index-bHsfQaa6.js", "/assets/index-CkB4eebM.js", "/assets/split-props-DibKY-94.js", "/assets/spinner-D-tX8Mh1.js", "/assets/client-Drh0rYrD.js", "/assets/index-B-l7eBGz.js", "/assets/normalize-props-CUirt2IH.js", "/assets/link-B_GQFa4s.js", "/assets/event-DvPidmzT.js", "/assets/popover.anatomy-D3HauKcz.js", "/assets/create-anatomy-BgxHbLYw.js", "/assets/index-CX63LmfT.js", "/assets/equal-DfFTejAs.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth.callback": { "id": "routes/auth.callback", "parentId": "root", "path": "auth/callback", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/auth.callback-t2Jy71HF.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js", "/assets/react-oidc-context-D_E8vvIz.js", "/assets/container-CfVBVhja.js", "/assets/index-bHsfQaa6.js", "/assets/split-props-DibKY-94.js", "/assets/walk-object-yxyoLY_G.js", "/assets/spinner-D-tX8Mh1.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/settings": { "id": "routes/settings", "parentId": "root", "path": "settings", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/settings-oSacIzip.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js", "/assets/react-oidc-context-D_E8vvIz.js", "/assets/authenticated-navbar-q37_0p4i.js", "/assets/flex-DR3XNPiz.js", "/assets/container-CfVBVhja.js", "/assets/index-D0tbSgDA.js", "/assets/index-bHsfQaa6.js", "/assets/index-CkB4eebM.js", "/assets/split-props-DibKY-94.js", "/assets/spinner-D-tX8Mh1.js", "/assets/client-Drh0rYrD.js", "/assets/index-B-l7eBGz.js", "/assets/normalize-props-CUirt2IH.js", "/assets/link-B_GQFa4s.js", "/assets/event-DvPidmzT.js", "/assets/popover.anatomy-D3HauKcz.js", "/assets/create-anatomy-BgxHbLYw.js", "/assets/index-CX63LmfT.js", "/assets/equal-DfFTejAs.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/settings.index": { "id": "routes/settings.index", "parentId": "routes/settings", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/settings.index-DNLDudNZ.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/settings.general": { "id": "routes/settings.general", "parentId": "routes/settings", "path": "general", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/settings.general-CSoBK7ZD.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js", "/assets/flex-DR3XNPiz.js", "/assets/index-D0tbSgDA.js", "/assets/input-frsaMGm3.js", "/assets/index-bHsfQaa6.js", "/assets/switch-DMe3qAmo.js", "/assets/split-props-DibKY-94.js", "/assets/normalize-props-CUirt2IH.js", "/assets/index-B-l7eBGz.js", "/assets/use-field-context-V2-5yF4w.js", "/assets/event-DvPidmzT.js", "/assets/index-CX63LmfT.js", "/assets/switch.anatomy-CEiFFQaB.js", "/assets/create-anatomy-BgxHbLYw.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/settings.account": { "id": "routes/settings.account", "parentId": "routes/settings", "path": "account", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/settings.account-C45H7e-l.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js", "/assets/react-oidc-context-D_E8vvIz.js", "/assets/index-CkB4eebM.js", "/assets/flex-DR3XNPiz.js", "/assets/index-D0tbSgDA.js", "/assets/index-bHsfQaa6.js", "/assets/badge-8qr3NK_9.js", "/assets/split-props-DibKY-94.js", "/assets/spinner-D-tX8Mh1.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/settings.analytics": { "id": "routes/settings.analytics", "parentId": "routes/settings", "path": "analytics", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/settings.analytics-DB5Vbr9k.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js", "/assets/flex-DR3XNPiz.js", "/assets/index-D0tbSgDA.js", "/assets/index-bHsfQaa6.js", "/assets/switch-DMe3qAmo.js", "/assets/split-props-DibKY-94.js", "/assets/normalize-props-CUirt2IH.js", "/assets/index-B-l7eBGz.js", "/assets/use-field-context-V2-5yF4w.js", "/assets/event-DvPidmzT.js", "/assets/index-CX63LmfT.js", "/assets/switch.anatomy-CEiFFQaB.js", "/assets/create-anatomy-BgxHbLYw.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/settings.history": { "id": "routes/settings.history", "parentId": "routes/settings", "path": "history", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/settings.history-oz1WNRt3.js", "imports": ["/assets/chunk-EPOLDU6W-zLqfafiG.js", "/assets/react-oidc-context-D_E8vvIz.js", "/assets/client-Drh0rYrD.js", "/assets/badge-8qr3NK_9.js", "/assets/index-CkB4eebM.js", "/assets/flex-DR3XNPiz.js", "/assets/index-bHsfQaa6.js", "/assets/spinner-D-tX8Mh1.js", "/assets/input-frsaMGm3.js", "/assets/index-D0tbSgDA.js", "/assets/normalize-props-CUirt2IH.js", "/assets/create-anatomy-BgxHbLYw.js", "/assets/equal-DfFTejAs.js", "/assets/split-props-DibKY-94.js", "/assets/use-field-context-V2-5yF4w.js", "/assets/index-B-l7eBGz.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-eb4114ae.js", "version": "eb4114ae", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "unstable_subResourceIntegrity": false, "unstable_trailingSlashAwareDataRequests": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/dashboard": {
    id: "routes/dashboard",
    parentId: "root",
    path: "dashboard",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/lists": {
    id: "routes/lists",
    parentId: "root",
    path: "lists",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/integrations": {
    id: "routes/integrations",
    parentId: "root",
    path: "integrations",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/docs": {
    id: "routes/docs",
    parentId: "root",
    path: "docs",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/api": {
    id: "routes/api",
    parentId: "root",
    path: "api",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/auth.callback": {
    id: "routes/auth.callback",
    parentId: "root",
    path: "auth/callback",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/settings": {
    id: "routes/settings",
    parentId: "root",
    path: "settings",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/settings.index": {
    id: "routes/settings.index",
    parentId: "routes/settings",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route9
  },
  "routes/settings.general": {
    id: "routes/settings.general",
    parentId: "routes/settings",
    path: "general",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/settings.account": {
    id: "routes/settings.account",
    parentId: "routes/settings",
    path: "account",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/settings.analytics": {
    id: "routes/settings.analytics",
    parentId: "routes/settings",
    path: "analytics",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  },
  "routes/settings.history": {
    id: "routes/settings.history",
    parentId: "routes/settings",
    path: "history",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
