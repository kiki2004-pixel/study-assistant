import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { getMe } from "api/context";
import { Box, Container, Grid, Heading, Text, Icon } from "@chakra-ui/react";
import { FiCheckCircle, FiMail, FiZap, FiList } from "react-icons/fi";
import type { UserContext } from "types/context";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Box
      p={6}
      borderRadius="xl"
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border"
    >
      <Box
        w={10}
        h={10}
        borderRadius="lg"
        bg="brand.50"
        display="flex"
        alignItems="center"
        justifyContent="center"
        mb={4}
      >
        <Icon as={icon} boxSize={5} color="brand.solid" />
      </Box>
      <Text fontSize="2xl" fontWeight="bold" lineHeight="1" mb={1}>
        {value}
      </Text>
      <Text color="fg.muted" fontSize="sm">
        {label}
      </Text>
    </Box>
  );
}

export default function Analytics() {
  const auth = useAuth();

  const [apiUser, setApiUser] = useState<UserContext | null>(null);

  useEffect(() => {
    if (!auth.user?.access_token) return;
    getMe().then(setApiUser).catch(console.error);
  }, [auth.user?.access_token]);

  return (
    <Container maxW="6xl" py={10}>
      <Box mb={8}>
        <Heading fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" mb={1}>
          Welcome back
          {auth.user?.profile.given_name
            ? `, ${auth.user.profile.given_name}`
            : ""}
        </Heading>
        <Text color="fg.muted">
          Here's an overview of your email scrubbing activity.
        </Text>
      </Box>

      <Grid
        templateColumns={{
          base: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        }}
        gap={6}
        mb={10}
      >
        <StatCard
          icon={FiMail}
          label="Emails Validated (Total)"
          value={apiUser ? String(apiUser.stats.total_validations) : "—"}
        />
        <StatCard
          icon={FiCheckCircle}
          label="Validated This Month"
          value={apiUser ? String(apiUser.stats.validations_this_month) : "—"}
        />
        <StatCard icon={FiZap} label="API Calls Today" value="—" />
        <StatCard icon={FiList} label="Bulk Jobs" value="—" />
      </Grid>
    </Container>
  );
}
