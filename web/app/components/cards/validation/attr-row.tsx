import { Flex, Text } from "@chakra-ui/react";

export function AttrRow({
  label,
  value,
}: {
  label: string;
  value?: string | boolean | null;
}) {
  const display =
    value === undefined || value === null || value === ""
      ? "—"
      : typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : value;

  return (
    <Flex
      align="center"
      justify="space-between"
      py={2}
      borderBottomWidth="1px"
      borderColor="border"
      _last={{ borderBottom: "none" }}
    >
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      <Text fontSize="sm" fontFamily="mono" color="fg">
        {display}
      </Text>
    </Flex>
  );
}
