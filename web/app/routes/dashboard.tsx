import { Container } from "@chakra-ui/react";
import SingleEmailUpsertForm from "@app/components/forms/single-email-upsert-form";

export default function Dashboard() {
  return (
    <Container maxW="6xl" py={10}>
      <SingleEmailUpsertForm />
    </Container>
  );
}
