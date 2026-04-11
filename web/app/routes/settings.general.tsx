import { Box, Flex, Heading, Input, Switch, Text } from "@chakra-ui/react";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box mb={10}>
      <Heading
        fontSize="md"
        fontWeight="600"
        letterSpacing="-0.01em"
        mb={5}
        pb={3}
        borderBottomWidth="1px"
        borderColor="border"
      >
        {title}
      </Heading>
      {children}
    </Box>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Flex
      justify="space-between"
      align="center"
      py={4}
      borderBottomWidth="1px"
      borderColor="border"
      gap={8}
      _last={{ borderBottom: "none" }}
    >
      <Box>
        <Text fontSize="sm" fontWeight="500">
          {label}
        </Text>
        {description && (
          <Text fontSize="xs" color="fg.muted" mt={0.5} lineHeight={1.5}>
            {description}
          </Text>
        )}
      </Box>
      <Box flexShrink={0}>{children}</Box>
    </Flex>
  );
}

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

      <Section title="Preferences">
        <SettingRow
          label="Default validation mode"
          description="Choose whether single or bulk validation is shown first on login."
        >
          <Input
            defaultValue="Single"
            size="sm"
            w="140px"
            borderRadius="md"
            borderColor="border"
            fontSize="sm"
          />
        </SettingRow>
        <SettingRow
          label="Show validation score"
          description="Display a risk score alongside each validation result."
        >
          <Switch.Root defaultChecked size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingRow>
        <SettingRow
          label="Auto-export results"
          description="Automatically download a CSV after each bulk validation job."
        >
          <Switch.Root size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingRow>
      </Section>

      <Section title="Notifications">
        <SettingRow
          label="Bulk job completed"
          description="Get notified by email when a bulk validation job finishes."
        >
          <Switch.Root defaultChecked size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingRow>
        <SettingRow
          label="Monthly usage summary"
          description="Receive a monthly email with your usage stats and trends."
        >
          <Switch.Root size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingRow>
        <SettingRow
          label="Low credit warning"
          description="Alert me when my remaining validation credits drop below 500."
        >
          <Switch.Root defaultChecked size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingRow>
      </Section>
    </Box>
  );
}
