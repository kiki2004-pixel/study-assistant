import { Box, Text } from "@chakra-ui/react";
import { CodeBlock } from "../code-block";
import { Endpoint } from "../endpoint";
import { Param } from "../param";
import { Section } from "../section";

export function WebhooksSection() {
  return (
    <Section id="webhooks" title="Webhooks">
      <Text fontSize="sm" color="fg.muted" mb={5}>
        Register a URL to receive real-time results after each validation. Scrub
        signs all payloads with HMAC-SHA256 so you can verify they came from us.
      </Text>

      <Endpoint
        method="POST"
        path="/webhooks/register"
        description="Register a URL to receive validation events."
      >
        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          overflow="hidden"
          mb={4}
        >
          <Param
            name="url"
            type="string"
            required
            description="HTTPS URL to receive POST payloads."
          />
        </Box>
        <CodeBlock
          code={`{
  "url": "https://your-service.com/hook",
  "secret": "hex-signing-secret",
  "message": "Webhook registered. Save the secret — it will not be shown again."
}`}
        />
        <Box
          mt={4}
          bg="bg.subtle"
          border="1px solid"
          borderColor="border"
          borderRadius="md"
          px={4}
          py={3}
        >
          <Text fontSize="xs" fontWeight="600" color="fg" mb={1}>
            Verifying payloads
          </Text>
          <Text fontSize="xs" color="fg.muted" mb={2}>
            Each request includes an{" "}
            <Text as="span" fontFamily="mono">
              X-Scrub-Signature
            </Text>{" "}
            header. Verify it on your endpoint:
          </Text>
          <CodeBlock
            lang="python"
            code={`import hmac, hashlib

def verify(payload_bytes: bytes, header: str, secret: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(), payload_bytes, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, header)`}
          />
        </Box>
      </Endpoint>

      <Endpoint
        method="DELETE"
        path="/webhooks/deregister"
        description="Remove a registered webhook by URL."
      >
        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          overflow="hidden"
        >
          <Param
            name="url"
            type="string"
            required
            description="The registered URL to remove (query param)."
          />
        </Box>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/webhooks/list"
        description="List all registered webhooks."
      >
        <CodeBlock
          code={`[
  { "id": 1, "url": "https://...", "active": true, "failure_count": 0 }
]`}
        />
      </Endpoint>
    </Section>
  );
}
