export type StarRatingProps = {
  label: string;
  value: number | null;
  onValueChange: (value: number | null) => void;
  disabled?: boolean;
};
