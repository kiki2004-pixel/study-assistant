import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const customConfig = defineConfig({
  globalCss: {
    body: {
      bg: "bg",
      color: "fg",
      fontFamily: "body",
    },
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'Instrument Serif', Georgia, serif" },
        body: { value: "'DM Sans', system-ui, sans-serif" },
        mono: { value: "'Geist Mono', 'Courier New', monospace" },
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
          900: { value: "#14532D" },
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
          900: { value: "#E65100" },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          value: { base: "#F5F5F0", _dark: "#0D0D0D" },
        },
        "bg.subtle": {
          value: { base: "#FFFFFF", _dark: "#1A1A1A" },
        },
        "bg.muted": {
          value: { base: "#E8E8E2", _dark: "#2A2A2A" },
        },
        fg: {
          value: { base: "#111111", _dark: "#F5F5F0" },
        },
        "fg.muted": {
          value: { base: "#555555", _dark: "#AAAAAA" },
        },
        border: {
          value: { base: "#D4D4CF", _dark: "#333333" },
        },
        "brand.solid": {
          value: { base: "#22C55E", _dark: "#22C55E" },
        },
        "brand.contrast": {
          value: { base: "#FFFFFF", _dark: "#FFFFFF" },
        },
        "accent.solid": {
          value: { base: "#FFD600", _dark: "#FFD600" },
        },
        "accent.contrast": {
          value: { base: "#111111", _dark: "#111111" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
