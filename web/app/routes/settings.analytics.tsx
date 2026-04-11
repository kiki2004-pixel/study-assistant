import { Box, Flex, Heading, Switch, Text } from "@chakra-ui/react";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Box mb={10}>
      <Box mb={5} pb={3} borderBottomWidth="1px" borderColor="border">
        <Heading fontSize="md" fontWeight="600" letterSpacing="-0.01em">
          {title}
        </Heading>
        {description && (
          <Text fontSize="xs" color="fg.muted" mt={1}>
            {description}
          </Text>
        )}
      </Box>
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

      <Section
        title="Data collection"
        description="Control what usage data Scrub collects to improve your experience."
      >
        <SettingRow
          label="Usage analytics"
          description="Allow Scrub to collect anonymised usage data to improve the product."
        >
          <Switch.Root defaultChecked size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingRow>
        <SettingRow
          label="Error reporting"
          description="Automatically send crash reports and error logs to help us fix bugs faster."
        >
          <Switch.Root defaultChecked size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingRow>
        <SettingRow
          label="Feature usage tracking"
          description="Track which features you use so we can prioritise improvements."
        >
          <Switch.Root size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingRow>
      </Section>

      <Section
        title="Data retention"
        description="Choose how long your validation history is stored."
      >
        <SettingRow
          label="Keep validation history"
          description="Store individual validation results so you can review them later."
        >
          <Switch.Root defaultChecked size="sm">
            <Switch.HiddenInput />
            <Switch.Control />
          </Switch.Root>
        </SettingRow>
        <SettingRow
          label="Keep bulk job logs"
          description="Retain logs and result files from bulk CSV validation jobs."
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
