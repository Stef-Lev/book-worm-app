"use client";

import { RatingGroup } from "@ark-ui/react/rating-group";
import { Star, X } from "lucide-react";
import { useTranslations } from "next-intl";
import IconButton from "@/components/icon-button/icon-button";
import styles from "./star-rating.module.css";
import type { StarRatingProps } from "./star-rating.types";

export default function StarRating({
  label,
  value,
  onValueChange,
  disabled,
  readOnly = false,
}: StarRatingProps) {
  const t = useTranslations("ratingControl");

  return (
    <RatingGroup.Root
      className={styles.rating}
      count={5}
      allowHalf
      value={value ?? 0}
      readOnly={readOnly}
      onValueChange={({ value: nextValue }) =>
        onValueChange?.(nextValue ? Math.max(1, nextValue) : null)
      }
      disabled={disabled}
      translations={{
        ratingValueText: (rating) =>
          t("valueLabel", {
            value:
              value !== null && Math.ceil(value) === rating ? value : rating,
          }),
      }}
    >
      <RatingGroup.Label
        className={readOnly ? styles.readOnlyLabel : styles.label}
      >
        {label}
      </RatingGroup.Label>
      <div className={styles.controls}>
        <RatingGroup.Control className={styles.stars}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <RatingGroup.Item
              key={rating}
              index={rating}
              className={styles.item}
            >
              <span className={styles.star} aria-hidden="true">
                <Star className={styles.outline} />
                <Star className={styles.fill} />
              </span>
            </RatingGroup.Item>
          ))}
        </RatingGroup.Control>
        {!readOnly && (
          <IconButton
            className={styles.clearButton}
            label={t("clear")}
            onClick={() => onValueChange?.(null)}
            disabled={disabled || value === null}
          >
            <X aria-hidden="true" />
          </IconButton>
        )}
      </div>
    </RatingGroup.Root>
  );
}
