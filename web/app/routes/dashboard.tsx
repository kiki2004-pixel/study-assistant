import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "react-oidc-context";
import { getMe } from "api/context";
import { Box, Container, Grid, Heading, Text, Icon } from "@chakra-ui/react";
import { FiCheckCircle, FiMail, FiZap, FiList } from "react-icons/fi";
import { AuthenticatedNavbar } from "@app/components/navbar/authenticated-navbar";
import type { UserContext } from "types/context";
import SingleEmailUpsertForm from "@app/components/forms/single-email-upsert-form";

export default function Dashboard() {
  return (
    <Box minH="100vh" bg="bg">
      <AuthenticatedNavbar />

      <Container maxW="6xl" py={10}>
        <SingleEmailUpsertForm />
      </Container>
    </Box>
  );
}
