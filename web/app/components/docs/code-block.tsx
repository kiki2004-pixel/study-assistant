import { useState } from "react";
import { Box, Button } from "@chakra-ui/react";
import { FiCheck, FiCopy } from "react-icons/fi";

export function CodeBlock({
  code,
  lang = "json",
}: {
  code: string;
  lang?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Box position="relative" mt={3}>
      <Box
        as="pre"
        bg="bg.muted"
        border="1px solid"
        borderColor="border"
        borderRadius="md"
        px={4}
        py={3}
        fontSize="xs"
        fontFamily="mono"
        overflowX="auto"
        whiteSpace="pre"
        color="fg"
      >
        {code.trim()}
      </Box>
      <Button
        size="xs"
        variant="ghost"
        position="absolute"
        top={2}
        right={2}
        color="fg.muted"
        _hover={{ color: "fg" }}
        onClick={copy}
      >
        {copied ? <FiCheck /> : <FiCopy />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </Box>
  );
}
