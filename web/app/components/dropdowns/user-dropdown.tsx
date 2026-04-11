import { Avatar, Menu, Portal } from "@chakra-ui/react";
import { useNavigate } from "react-router";
import { useAuth } from "react-oidc-context";
import { FiGrid, FiLogOut, FiSettings, FiUser } from "react-icons/fi";

const UserDropdown = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <Menu.Root positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger rounded="full" focusRing="outside">
        <Avatar.Root colorPalette="red">
          <Avatar.Fallback />
          <Avatar.Image src="https://bit.ly/broken-link" />
        </Avatar.Root>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="dashboard" onClick={() => navigate("/dashboard")}>
              <FiGrid /> Dashboard
            </Menu.Item>
            <Menu.Item value="account" onClick={() => navigate("/account")}>
              <FiUser /> Account
            </Menu.Item>
            <Menu.Item value="settings" onClick={() => navigate("/settings")}>
              <FiSettings /> Settings
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item
              value="logout"
              color="red.500"
              onClick={() => auth.signoutRedirect()}
            >
              <FiLogOut /> Sign Out
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};

export default UserDropdown;
