export interface ContributionTrendItem {
  date: string;
  total: string;
}

export interface ContributionTrendResponse {
  status: string;
  data: ContributionTrendItem[];
}
