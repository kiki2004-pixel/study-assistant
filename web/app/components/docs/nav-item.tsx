import { Link } from "@chakra-ui/react";

export function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      display="block"
      fontSize="sm"
      color="fg.muted"
      py={1}
      _hover={{ color: "fg", textDecoration: "none" }}
      transition="color 0.1s"
    >
      {label}
    </Link>
  );
}
