import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { FiList } from "react-icons/fi";
import { Link } from "react-router";
import { listListmonkIntegrations } from "api/integrations";

interface IntegrationTypeTile {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const INTEGRATION_TYPES: IntegrationTypeTile[] = [
  {
    key: "listmonk",
    label: "Listmonk",
    description: "Self-hosted newsletter & mailing list manager.",
    href: "/integrations/listmonk",
    icon: <FiList size={22} />,
  },
];

export default function Integrations() {
  const [listmonkCount, setListmonkCount] = useState<number | null>(null);

  useEffect(() => {
    listListmonkIntegrations()
      .then((list) => setListmonkCount(list.length))
      .catch(() => setListmonkCount(0));
  }, []);

  const countMap: Record<string, number> = {
    listmonk: listmonkCount ?? 0,
  };

  return (
    <Container maxW="7xl" py={10}>
      <Box mb={10}>
        <Heading
          fontSize={{ base: "2xl", md: "3xl" }}
          fontWeight="400"
          fontFamily="mono"
          letterSpacing="-0.02em"
          mb={1}
        >
          Integrations
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          Connect Scrub to your email tools and platforms.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 6 }} gap={3}>
        {INTEGRATION_TYPES.map((tile) => {
          const count = countMap[tile.key] ?? 0;
          return (
            <Link key={tile.key} to={tile.href}>
              <Flex
                direction="column"
                align="center"
                justify="center"
                gap={3}
                p={5}
                borderWidth="1px"
                borderColor="border"
                borderRadius="xl"
                bg="bg.subtle"
                cursor="pointer"
                position="relative"
                minH="110px"
                _hover={{ borderColor: "fg.muted", bg: "bg.muted" }}
                transition="all 0.15s"
              >
                {count > 0 && (
                  <Badge
                    position="absolute"
                    top={2}
                    right={2}
                    size="xs"
                    colorPalette="green"
                    variant="subtle"
                    borderRadius="full"
                    px={1.5}
                    fontSize="9px"
                  >
                    {count}
                  </Badge>
                )}
                <Box color="fg.muted">{tile.icon}</Box>
                <Text
                  fontSize="xs"
                  fontWeight="500"
                  color="fg"
                  textAlign="center"
                  lineHeight="tight"
                >
                  {tile.label}
                </Text>
              </Flex>
            </Link>
          );
        })}
      </SimpleGrid>
    </Container>
  );
}
