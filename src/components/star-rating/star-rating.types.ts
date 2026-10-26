export type StarRatingProps = {
  label: string;
  value: number | null;
  disabled?: boolean;
} & (
  | {
      readOnly: true;
      onValueChange?: never;
    }
  | {
      readOnly?: false;
      onValueChange: (value: number | null) => void;
    }
);
