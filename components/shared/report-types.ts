export type ReportCategoryDatum = {
  name: string;
  color: string;
  value: number;
};

export type ReportMonthDatum = {
  month: string;
  value: number;
};

export type ReportPdfData = {
  periodLabel: string;
  currency: string;
  totals: {
    spent: number;
    income: number;
    avgDaily: number;
    largest: { description: string; amount: number };
  };
  categories: ReportCategoryDatum[];
  months: ReportMonthDatum[];
};
