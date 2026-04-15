import { Button, Flex, Input } from "@chakra-ui/react";

interface HistorySearchFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
  isActive: boolean;
  loading: boolean;
}

export function HistorySearchForm({
  value,
  onChange,
  onSubmit,
  onClear,
  isActive,
  loading,
}: HistorySearchFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <Flex gap={2}>
        <Input
          placeholder="Search by email or request ID…"
          size="sm"
          borderRadius="md"
          borderColor="border"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          w="260px"
        />
        <Button
          size="sm"
          type="submit"
          variant="outline"
          borderColor="border"
          borderRadius="md"
          loading={loading}
        >
          Search
        </Button>
        {isActive && (
          <Button
            size="sm"
            variant="ghost"
            borderRadius="md"
            onClick={onClear}
            type="button"
          >
            Clear
          </Button>
        )}
      </Flex>
    </form>
  );
}
