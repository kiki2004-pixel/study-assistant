import { Box, Heading, Switch } from "@chakra-ui/react";
import { SettingsRow } from "@app/components/settings/settings-row";
import { SettingsSection } from "@app/components/settings/settings-section";
import DefaultValidationModePicker from "@app/components/dropdowns/default-validation-mode-picker";

export default function GeneralSettings() {
  return (
    <Box>
      <Heading
        fontSize={{ base: "xl", md: "2xl" }}
        fontWeight="400"
        letterSpacing="-0.02em"
        mb={8}
      >
        General
      </Heading>

      <SettingsSection title="Preferences">
        <SettingsRow
          label="Default validation mode"
          description="Choose whether single or bulk validation is shown first on login."
        >
          <DefaultValidationModePicker />
        </SettingsRow>
        <SettingsRow
          label="Show validation score"
          description="Display a risk score alongside each validation result."
        >
          <Switch.Root defaultChecked size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingsRow>
        <SettingsRow
          label="Auto-export results"
          description="Automatically download a CSV after each bulk validation job."
        >
          <Switch.Root size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Notifications">
        <SettingsRow
          label="Bulk job completed"
          description="Get notified by email when a bulk validation job finishes."
        >
          <Switch.Root defaultChecked size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingsRow>
        <SettingsRow
          label="Monthly usage summary"
          description="Receive a monthly email with your usage stats and trends."
        >
          <Switch.Root size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingsRow>
        <SettingsRow
          label="Low credit warning"
          description="Alert me when my remaining validation credits drop below 500."
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
