export type ReadingOverTimeProps = {
  months: { year: number; label: string; count: number }[];
  year: number | "all";
};
