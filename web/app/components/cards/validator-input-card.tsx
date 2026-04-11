import { useEffect, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { Box, Button, Flex, Icon, Input, Text } from "@chakra-ui/react";
import { FiArrowRight, FiMail, FiUpload } from "react-icons/fi";
import { PLACEHOLDER_EMAILS } from "@lib/const";

function Chip({ label }: { label: string }) {
  return (
    <Flex
      align="center"
      gap={1}
      bg="green.50"
      _dark={{ bg: "green.950" }}
      border="1px solid"
      borderColor="green.200"
      _dark-borderColor="green.800"
      borderRadius="full"
      px={2}
      py={0.5}
    >
      <Text fontSize="9px" color="green.700" _dark={{ color: "green.300" }} fontWeight="medium">
        {label}
      </Text>
    </Flex>
  );
}

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
      shadow="md"
      p={5}
      display="flex"
      flexDirection="column"
      gap={4}
    >
      {/* Mode toggle */}
      <Flex bg="bg.muted" borderRadius="xl" p={1} gap={1}>
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

      {/* Input area */}
      <Box>
        <Text fontSize="xs" fontWeight="medium" color="fg" mb={1.5}>
          {mode === "email" ? "Email address" : "Upload CSV file"}
        </Text>

        {mode === "email" ? (
          <Box position="relative">
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
              pr={8}
              _placeholder={{ color: "fg.muted", transition: "all 0.4s" }}
              _focus={{ borderColor: "brand.solid", outline: "none" }}
            />
            <Box
              position="absolute"
              right={2.5}
              top="50%"
              transform="translateY(-50%)"
              w={2}
              h={2}
              borderRadius="full"
              bg="green.400"
            />
          </Box>
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
      </Box>

      {/* CTA button */}
      <Button
        w="full"
        size="md"
        bg="fg"
        color="bg"
        borderRadius="lg"
        fontWeight="semibold"
        _hover={{ opacity: 0.85 }}
        loading={auth.isLoading}
        onClick={() => auth.signinRedirect()}
      >
        {mode === "email" ? "Validate Email" : "Upload & Clean"}{" "}
        <FiArrowRight />
      </Button>

      {/* Demo result row */}
      {mode === "email" && (
        <Flex
          align="center"
          gap={2}
          bg="green.50"
          _dark={{ bg: "green.950" }}
          border="1px solid"
          borderColor="green.200"
          borderRadius="lg"
          px={3}
          py={2}
          flexWrap="wrap"
        >
          <Box w={2} h={2} borderRadius="full" bg="green.400" flexShrink={0} />
          <Text
            fontSize="xs"
            fontFamily="mono"
            color="fg"
            flex={1}
            minW={0}
            truncate
          >
            john@company.com
          </Text>
          <Text fontSize="xs" color="green.600" fontWeight="semibold" flexShrink={0}>
            Valid
          </Text>
          <Text fontSize="10px" color="fg.muted" flexShrink={0}>
            142ms
          </Text>
          <Flex gap={1} flexWrap="wrap">
            <Chip label="syntax ✓" />
            <Chip label="MX ✓" />
            <Chip label="not disposable ✓" />
          </Flex>
        </Flex>
      )}

      <Text fontSize="xs" color="fg.muted" textAlign="center">
        Free for up to 10 lookups/day
      </Text>
    </Box>
  );
}
