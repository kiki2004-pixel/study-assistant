import { Box, Text } from "@chakra-ui/react";
import { CodeBlock } from "../code-block";
import { Endpoint } from "../endpoint";
import { Param } from "../param";
import { Section } from "../section";

export function ApiKeysSection() {
  return (
    <Section id="api-keys" title="API Keys">
      <Text fontSize="sm" color="fg.muted" mb={5}>
        Manage API keys programmatically. These endpoints require your account
        session (Bearer token) — not an API key.
      </Text>

      <Endpoint
        method="POST"
        path="/api-keys"
        description="Create a new API key. The raw key is returned once and cannot be retrieved again."
      >
        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          overflow="hidden"
          mb={4}
        >
          <Param
            name="name"
            type="string"
            required
            description="Human-readable label. 1–100 characters."
          />
        </Box>
        <CodeBlock
          code={`{
  "id": 1,
  "name": "Zapier integration",
  "key": "sk_abc123...",
  "created_at": "2026-04-15T10:00:00"
}`}
        />
      </Endpoint>

      <Endpoint
        method="GET"
        path="/api-keys"
        description="List all your API keys. The raw key is never returned — only metadata."
      >
        <CodeBlock
          code={`[
  {
    "id": 1,
    "name": "Zapier integration",
    "created_at": "2026-04-15T10:00:00",
    "last_used_at": "2026-04-15T12:30:00",
    "active": true
  }
]`}
        />
      </Endpoint>

      <Endpoint
        method="DELETE"
        path="/api-keys/{key_id}"
        description="Revoke a key immediately. The key stops working as soon as this returns."
      />
    </Section>
  );
}
