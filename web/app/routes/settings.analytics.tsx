import { Box, Heading, Switch } from "@chakra-ui/react";
import { SettingsRow } from "@app/components/settings/settings-row";
import { SettingsSection } from "@app/components/settings/settings-section";

export default function AnalyticsSettings() {
  return (
    <Box>
      <Heading
        fontSize={{ base: "xl", md: "2xl" }}
        fontWeight="400"
        letterSpacing="-0.02em"
        mb={8}
      >
        Analytics
      </Heading>

      <SettingsSection
        title="Data collection"
        description="Control what usage data Scrub collects to improve your experience."
      >
        <SettingsRow
          label="Usage analytics"
          description="Allow Scrub to collect anonymised usage data to improve the product."
        >
          <Switch.Root defaultChecked size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingsRow>
        <SettingsRow
          label="Error reporting"
          description="Automatically send crash reports and error logs to help us fix bugs faster."
        >
          <Switch.Root defaultChecked size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingsRow>
        <SettingsRow
          label="Feature usage tracking"
          description="Track which features you use so we can prioritise improvements."
        >
          <Switch.Root size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title="Data retention"
        description="Choose how long your validation history is stored."
      >
        <SettingsRow
          label="Keep validation history"
          description="Store individual validation results so you can review them later."
        >
          <Switch.Root defaultChecked size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingsRow>
        <SettingsRow
          label="Keep bulk job logs"
          description="Retain logs and result files from bulk CSV validation jobs."
        >
          <Switch.Root defaultChecked size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingsRow>
      </SettingsSection>
    </Box>
  );
}
