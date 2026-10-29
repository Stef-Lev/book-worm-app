"use client";

import { Checkbox } from "@ark-ui/react/checkbox";
import { RadioGroup } from "@ark-ui/react/radio-group";
import type { FilterOptionsProps } from "./filter-options.types";
import styles from "./filter-options.module.css";

export default function FilterOptions({
  section,
  value,
  onValueChange,
  hideLabel,
}: FilterOptionsProps) {
  const isMultiSelect = section.multiSelect;
  const valueArray = Array.isArray(value) ? value : [value].filter(Boolean);

  if (isMultiSelect) {
    return (
      <div className={styles.group}>
        <label className={hideLabel ? styles.hiddenLabel : styles.label}>
          {section.label}
        </label>
        {section.options.map((option) => {
          const isChecked = valueArray.includes(String(option.value));
          return (
            <Checkbox.Root
              key={option.value}
              checked={isChecked}
              disabled={option.disabled}
              onCheckedChange={() => {
                const newValue = isChecked
                  ? valueArray.filter((v) => v !== String(option.value))
                  : [...valueArray, String(option.value)];
                onValueChange(newValue);
              }}
              className={styles.option}
            >
              <Checkbox.Control className={styles.radio} />
              <Checkbox.Label className={styles.labelWithBadge}>
                {option.label}
                {option.count !== undefined && (
                  <span className={styles.badge}>{option.count}</span>
                )}
              </Checkbox.Label>
              <Checkbox.HiddenInput />
            </Checkbox.Root>
          );
        })}
      </div>
    );
  }

  return (
    <RadioGroup.Root
      className={styles.group}
      value={valueArray[0] || ""}
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
          <RadioGroup.ItemText className={styles.labelWithBadge}>
            {option.label}
            {option.count !== undefined && (
              <span className={styles.badge}>{option.count}</span>
            )}
          </RadioGroup.ItemText>
          <RadioGroup.ItemHiddenInput />
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
