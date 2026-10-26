"use client";

import { useId } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import FormField from "@/components/form-field/form-field";
import { cn } from "@/lib/cn";
import styles from "./dropdown.module.css";
import type { DropdownProps } from "./dropdown.types";

export default function Dropdown({
  label,
  hint,
  error,
  id,
  className,
  fieldClassName,
  options,
  value,
  onValueChange,
  size = "md",
  disabled,
  name,
  required,
  dir,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...rest
}: DropdownProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  const message = error ?? hint;

  return (
    <FormField
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      className={fieldClassName}
    >
      <Select.Root
        value={`option:${value}`}
        onValueChange={(nextValue) =>
          onValueChange(nextValue.slice("option:".length))
        }
        disabled={disabled}
        required={required}
        dir={dir}
      >
        <Select.Trigger
          {...rest}
          id={fieldId}
          aria-invalid={error ? true : invalid}
          aria-describedby={
            [describedBy, message ? messageId : undefined]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className={cn(
            styles.trigger,
            size === "sm" && styles.compact,
            error && styles.invalid,
            className,
          )}
        >
          <span className={styles.value}>
            <Select.Value>
              {
                options.find((option) => String(option.value) === String(value))
                  ?.label
              }
            </Select.Value>
          </span>
          <Select.Icon asChild>
            <ChevronDown className={styles.icon} aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className={styles.content}
            position="popper"
            sideOffset={4}
            align="start"
          >
            <Select.ScrollUpButton className={styles.scrollButton}>
              <ChevronUp className={styles.icon} aria-hidden="true" />
            </Select.ScrollUpButton>
            <Select.Viewport className={styles.viewport}>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={`option:${option.value}`}
                  disabled={option.disabled}
                  className={styles.option}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className={styles.indicator}>
                    <Check className={styles.icon} aria-hidden="true" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className={styles.scrollButton}>
              <ChevronDown className={styles.icon} aria-hidden="true" />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      {name && (
        <input type="hidden" name={name} value={value} disabled={disabled} />
      )}
    </FormField>
  );
}
