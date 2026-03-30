import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const customConfig = defineConfig({
  globalCss: {
    body: {
      bg: "bg",
      color: "fg",
    },
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50:  { value: "#FEF9EC" },
          100: { value: "#FAE6B1" },
          200: { value: "#B3DEE5" },
          300: { value: "#7FC4D0" },
          400: { value: "#FFB833" },
          500: { value: "#FFA101" },
          600: { value: "#D98800" },
          700: { value: "#5A8A96" },
          800: { value: "#31525B" },
          900: { value: "#1E3540" },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          value: { base: "#FFFFFF", _dark: "#0F1E22" },
        },
        "bg.subtle": {
          value: { base: "#F9F4E8", _dark: "#1A2F36" },
        },
        "bg.muted": {
          value: { base: "#F0E8D0", _dark: "#243B43" },
        },
        fg: {
          value: { base: "#0A0A0A", _dark: "#FAE6B1" },
        },
        "fg.muted": {
          value: { base: "#31525B", _dark: "#B3DEE5" },
        },
        border: {
          value: { base: "#D9CCB0", _dark: "#2A4550" },
        },
        "brand.solid": {
          value: { base: "#FFA101", _dark: "#FFA101" },
        },
        "brand.contrast": {
          value: { base: "#FFFFFF", _dark: "#FFFFFF" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
