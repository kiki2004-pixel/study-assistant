import { Box, Text } from "@chakra-ui/react";
import { CodeBlock } from "../code-block";
import { Endpoint } from "../endpoint";
import { Param } from "../param";
import { Section } from "../section";

export function HistorySection() {
  return (
    <Section id="history" title="History">
      <Text fontSize="sm" color="fg.muted" mb={5}>
        All history is scoped to your account. You can only access records
        created by your own API key or user session.
      </Text>

      <Endpoint
        method="GET"
        path="/validation/history"
        description="Paginated validation history, newest first."
      >
        <Box
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          overflow="hidden"
        >
          <Param name="page" type="int" description="Page number. Default 1." />
          <Param
            name="page_size"
            type="int"
            description="Results per page. Default 100, max 1000."
          />
          <Param
            name="is_valid"
            type="boolean"
            description="Filter by outcome. Omit to return all."
          />
        </Box>
      </Endpoint>

      <Endpoint
        method="GET"
        path="/validation/history/bulk/{request_id}"
        description="All results for a specific bulk job by its request_id."
      />

      <Endpoint
        method="GET"
        path="/validation/history/{email}"
        description="All validation history for a specific email address."
      />

      <Endpoint
        method="DELETE"
        path="/validation/history/{email}"
        description="Delete all history for an email address (GDPR right-to-erasure). Returns the number of records deleted."
      >
        <CodeBlock code={`{ "email": "user@example.com", "deleted": 3 }`} />
      </Endpoint>
    </Section>
  );
}
