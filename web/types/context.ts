export interface UserStats {
  total_validations: number;
  validations_this_month: number;
}

export interface UserContext {
  id: number;
  email?: string;
  name?: string;
  created_at: string;
  stats: UserStats;
}
