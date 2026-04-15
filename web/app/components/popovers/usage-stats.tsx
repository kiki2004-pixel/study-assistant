import { Button, Link, Popover, Portal, Text } from "@chakra-ui/react";
import type { UserStats } from "types/context";

export default function UsageStats(stats: UserStats) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button size="sm" variant="outline">
          {stats.total_validations} scrub{stats.total_validations !== 1 && "s"}
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content css={{ "--popover-bg": "accent" }}>
            <Popover.Arrow />
            <Popover.Body>
              <Popover.Title fontWeight="medium">Usage Stats</Popover.Title>
              <Text my="4">
                You have validated {stats.total_validations} times this month.
              </Text>
              <Link
                variant="underline"
                colorPalette="teal"
                href="/settings/analytics"
              >
                View all Analytics
              </Link>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
