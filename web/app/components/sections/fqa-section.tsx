import {
  Accordion,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Span,
  Text,
} from "@chakra-ui/react";
import { FiArrowRight } from "react-icons/fi";

interface Question {
  title: string;
  text: string;
  value: string;
}
const questions: Question[] = [
  {
    title: "How much does it cost to start cleaning my email list?",
    text: "You can start for free — no credit card required. Scrub operates on a pay-as-you-go model, so you only pay for the emails you validate. There are no monthly fees, no minimum spend, and no commitments. Upload your list, validate what you need, and pay only when you're ready.",
    value: "q1",
  },
  {
    title: "What types of emails does Scrub detect?",
    text: "Scrub checks for a wide range of issues: invalid syntax, non-existent domains, missing or broken MX records, disposable/temporary email addresses, role-based addresses (like info@ or support@), and catch-all domains. Each result is scored so you can make informed decisions about which addresses to keep.",
    value: "q2",
  },
  {
    title: "How do I clean a large list?",
    text: "Upload your list as a CSV file and Scrub will validate every address in bulk. Results are processed quickly and returned as a downloadable CSV with validation status and risk scores for each email. No technical setup required — just upload, validate, and download.",
    value: "q3",
  },
];

export function FqaSection() {
  return (
    <Box py={{ base: 20, md: 32 }} position="relative" overflow="hidden">
      <Container maxW="3xl" position="relative" zIndex={1}>
        <Flex direction="column" align="center" textAlign="center" gap={6}>
          <Heading
            fontFamily="heading"
            fontWeight="400"
            fontSize={{ base: "3xl", md: "5xl" }}
            letterSpacing="-0.03em"
            lineHeight={1.05}
          >
            FQA
          </Heading>
          <Accordion.Root collapsible defaultValue={["q1"]}>
            {questions.map((item, index) => (
              <Accordion.Item key={index} value={item.value}>
                <Accordion.ItemTrigger px="3" _open={{ bg: "gray.subtle" }}>
                  <Span flex="1">{item.title}</Span>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Accordion.ItemBody>{item.text}</Accordion.ItemBody>
                </Accordion.ItemContent>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </Flex>
      </Container>
    </Box>
  );
}
