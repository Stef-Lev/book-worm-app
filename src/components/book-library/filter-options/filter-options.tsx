"use client";

import { RadioGroup } from "@ark-ui/react/radio-group";
import type { FilterOptionsProps } from "./filter-options.types";
import styles from "./filter-options.module.css";

export default function FilterOptions({
  section,
  value,
  onValueChange,
  hideLabel,
}: FilterOptionsProps) {
  return (
    <RadioGroup.Root
      className={styles.group}
      value={value}
      onValueChange={(details) => {
        if (details.value !== null) onValueChange(details.value);
      }}
    >
      <RadioGroup.Label
        className={hideLabel ? styles.hiddenLabel : styles.label}
      >
        {section.label}
      </RadioGroup.Label>
      {section.options.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={String(option.value)}
          disabled={option.disabled}
          className={styles.option}
        >
          <RadioGroup.ItemControl className={styles.radio} />
          <RadioGroup.ItemText>{option.label}</RadioGroup.ItemText>
          <RadioGroup.ItemHiddenInput />
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
