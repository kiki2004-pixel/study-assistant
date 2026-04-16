import { Badge } from "@chakra-ui/react";

const palette = { GET: "green", POST: "blue", DELETE: "red" } as const;

export function MethodBadge({ method }: { method: "GET" | "POST" | "DELETE" }) {
  return (
    <Badge
      colorPalette={palette[method]}
      variant="subtle"
      borderRadius="md"
      px={2}
      py={0.5}
      fontSize="11px"
      fontFamily="mono"
      fontWeight="700"
      flexShrink={0}
    >
      {method}
    </Badge>
  );
}
