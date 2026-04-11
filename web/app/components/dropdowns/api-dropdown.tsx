import { Button, Link, Menu, Portal } from "@chakra-ui/react";
import { IoIosArrowDown } from "react-icons/io";

const navItems = [
  { label: "API Keys", href: "/api/keys" },
  { label: "Docs", href: "/docs" },
];
const ApiDropdown = () => {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant="ghost" size="sm">
          API
          <IoIosArrowDown />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {navItems.map((item) => (
              <Menu.Item value={item.label} key={item.label}>
                <Link href={item.href}>
                  {item.label} <Menu.ItemCommand>⌘E</Menu.ItemCommand>
                </Link>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
export default ApiDropdown;
