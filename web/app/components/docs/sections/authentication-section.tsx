import { Box, Link, Text } from "@chakra-ui/react";
import { CodeBlock } from "../code-block";
import { Section } from "../section";

export function AuthenticationSection() {
  return (
    <Section id="authentication" title="Authentication">
      <Text fontSize="sm" color="fg.muted" mb={4}>
        All endpoints require authentication. Create an API key from your{" "}
        <Link
          href="/api/keys"
          color="brand.solid"
          _hover={{ textDecoration: "underline" }}
        >
          API Keys
        </Link>{" "}
        page and pass it in the header.
      </Text>
      <CodeBlock lang="bash" code={`X-API-Key: sk_your_key_here`} />
      <Box
        mt={4}
        bg="bg.subtle"
        border="1px solid"
        borderColor="border"
        borderRadius="md"
        px={4}
        py={3}
      >
        <Text fontSize="xs" color="fg.muted">
          API keys are scoped to your account. All data returned — history,
          results — belongs exclusively to the key owner.
        </Text>
      </Box>
    </Section>
  );
}
