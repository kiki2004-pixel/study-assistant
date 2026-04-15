import { Button, Menu, Portal } from "@chakra-ui/react";

const DefaultValidationModePicker = () => {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant="ghost" size="sm">
          Single
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content bg="bg.muted">
            <Menu.Item value="single">Single</Menu.Item>
            <Menu.Item value="bulk">Bulk</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
export default DefaultValidationModePicker;
