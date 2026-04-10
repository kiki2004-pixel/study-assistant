import { useEffect, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Box, Button, Flex, Icon, Input, Text } from "@chakra-ui/react";
import { FiArrowRight, FiMail, FiUpload } from "react-icons/fi";
import { PLACEHOLDER_EMAILS } from "@lib/const";

export function ValidatorInputCard() {
  const auth = useAuth();
  const [idx, setIdx] = useState(0);
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<"email" | "csv">("email");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => (i + 1) % PLACEHOLDER_EMAILS.length),
      2200,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <Box
      bg="bg.subtle"
      border="1px solid"
      borderColor="fg"
      borderRadius="2xl"
      shadow="sm"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minH={72}
      p={6}
      gap={4}
    >
      {/* Mode toggle */}
      <Flex bg="bg.muted" borderRadius="xl" p={1} gap={1} w="full">
        {(["email", "csv"] as const).map((m) => (
          <Button
            key={m}
            flex={1}
            size="xs"
            borderRadius="lg"
            fontWeight="medium"
            bg={mode === m ? "bg.subtle" : "transparent"}
            color={mode === m ? "fg" : "fg.muted"}
            border={mode === m ? "1px solid" : "none"}
            borderColor="border"
            shadow={mode === m ? "sm" : "none"}
            _hover={{ color: "fg" }}
            onClick={() => setMode(m)}
          >
            {m === "email" ? (
              <>
                <FiMail /> Single Email
              </>
            ) : (
              <>
                <FiUpload /> CSV Upload
              </>
            )}
          </Button>
        ))}
      </Flex>

      <Box textAlign="center">
        <Text fontWeight="semibold" fontSize="sm" mb={1}>
          {mode === "email"
            ? "Validate an email instantly"
            : "Clean your email list"}
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {mode === "email"
            ? "Paste any address to check deliverability"
            : "Upload a CSV and get results in seconds"}
        </Text>
      </Box>

      {/* Input area */}
      <Box w="full">
        {mode === "email" ? (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={PLACEHOLDER_EMAILS[idx]}
            size="sm"
            bg="bg"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            fontSize="xs"
            fontFamily="mono"
            _placeholder={{ color: "fg.muted", transition: "all 0.4s" }}
            _focus={{ borderColor: "brand.solid", outline: "none" }}
            mb={2.5}
          />
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={() => auth.signinRedirect()}
            />
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap={2}
              py={5}
              mb={2.5}
              borderRadius="lg"
              border="1px dashed"
              borderColor="border"
              bg="bg"
              cursor="pointer"
              _hover={{ borderColor: "fg.muted" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon as={FiUpload} boxSize={5} color="fg.muted" />
              <Text fontSize="xs" color="fg.muted">
                Click to upload{" "}
                <Text as="span" color="fg" fontWeight="medium">
                  .csv
                </Text>
              </Text>
            </Flex>
          </>
        )}
        <Button
          w="full"
          size="sm"
          bg="accent.solid"
          color="accent.contrast"
          border="1px solid"
          borderColor="fg"
          borderRadius="lg"
          fontWeight="semibold"
          _hover={{ bg: "accent.600" }}
          loading={auth.isLoading}
          onClick={() => auth.signinRedirect()}
        >
          {mode === "email" ? "Validate" : "Upload & Clean"} <FiArrowRight />
        </Button>
      </Box>

      <Text fontSize="xs" color="fg.muted" textAlign="center">
        Free for up to 10 lookups/day
      </Text>
    </Box>
  );
}
