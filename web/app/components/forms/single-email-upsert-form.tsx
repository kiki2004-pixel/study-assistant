import { useState } from "react";
import { Button, Field, Flex, Input, Spinner, Text } from "@chakra-ui/react";
import { validateEmail } from "api/validation";
import { ValidationResultCard } from "@app/components/cards/validation/validation-result-card";
import type { ValidationResult } from "types/validation";

const SingleEmailUpsertForm = () => {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await validateEmail(email);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Field.Root required mb={3}>
        <Flex
          gap={3}
          w={{ base: "full", md: "2xl", lg: "3xl" }}
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border"
          borderRadius="xl"
          p={2}
          _focusWithin={{ borderColor: "fg", boxShadow: "sm" }}
          transition="border-color 0.15s, box-shadow 0.15s"
        >
          <Input
            placeholder="Enter an email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            border="none"
            bg="transparent"
            _focus={{ outline: "none", boxShadow: "none" }}
            fontSize={{ base: "sm", md: "md" }}
            px={2}
          />
          <Button
            type="submit"
            bg="accent.solid"
            border="1px solid"
            borderColor="fg"
            borderRadius="lg"
            color="accent.contrast"
            fontWeight="medium"
            px={{ base: 4, md: 6 }}
            _hover={{ bg: "accent.400" }}
            flexShrink={0}
            disabled={loading || !email}
          >
            {loading ? <Spinner size="sm" /> : "Validate"}
          </Button>
        </Flex>
        <Field.HelperText pl={1}>
          I text and email my friends and family a lot, but that's about the
          extent of my high-tech-etude.
        </Field.HelperText>
      </Field.Root>

      {result && <ValidationResultCard result={result} />}

      {error && (
        <Text mt={4} fontSize="sm" color="red.500">
          {error}
        </Text>
      )}
    </form>
  );
};

export default SingleEmailUpsertForm;
