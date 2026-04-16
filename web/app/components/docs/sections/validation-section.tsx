import { Box, Text } from "@chakra-ui/react";
import { CodeBlock } from "../code-block";
import { Endpoint } from "../endpoint";
import { Param } from "../param";
import { Section } from "../section";

export function ValidationSection() {
  return (
    <Section id="validation" title="Validation">
      <Endpoint
        method="POST"
        path="/validation/validate-single"
        description="Validate a single email address. Checks syntax and DNS MX records."
      >
        <Text fontSize="xs" fontWeight="600" color="fg" mb={2}>
          Query parameters
        </Text>
        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          overflow="hidden"
          mb={4}
        >
          <Param
            name="email"
            type="string"
            required
            description="Email address to validate."
          />
        </Box>
        <Text fontSize="xs" fontWeight="600" color="fg" mb={1}>
          Example request
        </Text>
        <CodeBlock
          lang="bash"
          code={`curl -X POST "https://api.thescrub.app/validation/validate-single?email=user@example.com" \\
  -H "X-API-Key: sk_your_key_here"`}
        />
        <Text fontSize="xs" fontWeight="600" color="fg" mt={4} mb={1}>
          Response
        </Text>
        <CodeBlock
          code={`{
  "email": "user@example.com",
  "status": "deliverable",
  "reason": null,
  "quality_score": 95,
  "checks": {
    "syntax": true,
    "mx": true,
    "disposable": false,
    "role_based": false
  },
  "attributes": {
    "domain": "example.com",
    "is_free_provider": false
  }
}`}
        />
        <Box
          mt={4}
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          overflow="hidden"
        >
          <Box
            px={4}
            py={2}
            bg="bg.subtle"
            borderBottomWidth="1px"
            borderColor="border"
          >
            <Text fontSize="xs" fontWeight="600" color="fg">
              Status values
            </Text>
          </Box>
          <Box px={4} py={2}>
            <Param
              name="deliverable"
              type=""
              description="Syntax valid, MX record found."
            />
            <Param
              name="undeliverable"
              type=""
              description="Syntax valid but no MX record — email will bounce."
            />
            <Param
              name="risky"
              type=""
              description="Valid but flagged — disposable domain, role-based address, etc."
            />
            <Param
              name="invalid_syntax"
              type=""
              description="Failed RFC syntax check."
            />
          </Box>
        </Box>
      </Endpoint>

      <Endpoint
        method="POST"
        path="/validation/validate-bulk"
        description="Validate up to 30,000 email addresses in a single request."
      >
        <Text fontSize="xs" fontWeight="600" color="fg" mb={2}>
          Request body
        </Text>
        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          overflow="hidden"
          mb={4}
        >
          <Param
            name="emails"
            type="string[]"
            required
            description="Array of email addresses. Max 30,000."
          />
          <Param
            name="response_mode"
            type="enum"
            description={`"all" (default) | "invalid_only" | "summary_only"`}
          />
          <Param
            name="dedupe"
            type="boolean"
            description="Remove duplicates before validating. Default false."
          />
        </Box>
        <Text fontSize="xs" fontWeight="600" color="fg" mb={1}>
          Example request
        </Text>
        <CodeBlock
          lang="bash"
          code={`curl -X POST "https://api.thescrub.app/validation/validate-bulk" \\
  -H "X-API-Key: sk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "emails": ["a@example.com", "b@example.com"],
    "response_mode": "all",
    "dedupe": true
  }'`}
        />
        <Text fontSize="xs" fontWeight="600" color="fg" mt={4} mb={1}>
          Response
        </Text>
        <CodeBlock
          code={`{
  "summary": {
    "total": 2,
    "processed": 2,
    "valid": 1,
    "invalid": 1,
    "errors": 0,
    "duplicates_removed": 0,
    "duration_ms": 280,
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "results": [
    { "email": "a@example.com", "valid": true, "status": "deliverable" },
    { "email": "b@example.com", "valid": false, "status": "undeliverable", "reason": "no_mx" }
  ]
}`}
        />
        <Text fontSize="xs" color="fg.muted" mt={3}>
          The{" "}
          <Text as="span" fontFamily="mono">
            request_id
          </Text>{" "}
          in the summary can be used with{" "}
          <Text as="span" fontFamily="mono">
            GET /validation/history/bulk/{"{request_id}"}
          </Text>{" "}
          to retrieve results later.
        </Text>
      </Endpoint>
    </Section>
  );
}
