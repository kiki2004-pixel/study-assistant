import { Button, Link, Menu, Portal } from "@chakra-ui/react";
import { IoIosArrowDown } from "react-icons/io";

const ApiDropdown = () => {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant="outline" size="sm">
          API
          <IoIosArrowDown />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="new-txt-a">
              API Keys <Menu.ItemCommand>⌘E</Menu.ItemCommand>
            </Menu.Item>
            <Menu.Item value="docs">
              <Link href="/docs">
                {" "}
                Docs <Menu.ItemCommand>⌘N</Menu.ItemCommand>
              </Link>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
export default ApiDropdown;
