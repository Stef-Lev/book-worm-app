"use client";

import styles from "./book-entry.module.css";
import { Save, Trash2 } from "lucide-react";
import Dropdown from "@/components/dropdown/dropdown";
import Button from "@/components/button/button";
import BookCover from "@/components/book-cover/book-cover";
import TextInput from "@/components/text-input/text-input";
import Textarea from "@/components/textarea/textarea";
import StarRating from "@/components/star-rating/star-rating";
import type { BookEntryProps, Shelf } from "./book-entry.types";

const shelves: Shelf[] = [
  "to-read",
  "currently-reading",
  "read",
  "did-not-finish",
];

export default function BookEntry({
  entry,
  collections,
  shelfNames,
  labels,
  onChange,
  onSave,
  onRemove,
  busy,
}: BookEntryProps) {
  function update(changes: Partial<BookEntryProps["entry"]>) {
    onChange(entry.id, changes);
  }

  return (
    <article className={styles.entry}>
      <BookCover className={styles.cover} src={entry.book.coverUrl} />
      <div className={styles.details}>
        <h3 className={styles.title}>{entry.book.title}</h3>
        <p className={styles.muted}>
          {entry.book.authors.length
            ? entry.book.authors.join(", ")
            : labels.noAuthor}
        </p>
        <p className={styles.muted}>
          {entry.book.pageCount
            ? `${entry.book.pageCount} ${labels.pages}`
            : ""}
          {entry.book.categories.length
            ? ` · ${entry.book.categories.join(", ")}`
            : ""}
        </p>
        <div className={styles.fields}>
          <fieldset className={styles.collectionField}>
            <legend>{labels.collections}</legend>
            <div className={styles.collections}>
              {collections.map((collection) => (
                <label className={styles.check} key={collection.id}>
                  <input
                    type="checkbox"
                    checked={entry.collectionIds.includes(collection.id)}
                    onChange={(event) => {
                      const collectionIds = event.target.checked
                        ? [...entry.collectionIds, collection.id]
                        : entry.collectionIds.filter(
                            (id) => id !== collection.id,
                          );
                      update({ collectionIds });
                    }}
                  />
                  {collection.name}
                </label>
              ))}
            </div>
          </fieldset>
          <Dropdown
            label={shelfNames[entry.status]}
            fieldClassName={styles.field}
            value={entry.status}
            onValueChange={(value) => update({ status: value as Shelf })}
            options={shelves.map((shelf) => ({
              value: shelf,
              label: shelfNames[shelf],
            }))}
          />
          <div className={styles.dates}>
            <TextInput
              label={labels.startedAt}
              fieldClassName={styles.field}
              className={styles.input}
              type="date"
              value={entry.startedAt}
              onChange={(event) => update({ startedAt: event.target.value })}
            />
            {(entry.status === "currently-reading" ||
              entry.status === "read") && (
              <TextInput
                label={labels.finishedAt}
                fieldClassName={styles.field}
                className={styles.input}
                type="date"
                value={entry.finishedAt}
                onChange={(event) => update({ finishedAt: event.target.value })}
              />
            )}
          </div>
          <div className={styles.review}>
            <StarRating
              label={labels.rating}
              value={entry.rating}
              onValueChange={(rating) => update({ rating })}
              disabled={busy}
            />
            <Textarea
              label={labels.review}
              fieldClassName={styles.field}
              className={styles.textarea}
              value={entry.review}
              maxLength={5000}
              onChange={(event) => update({ review: event.target.value })}
            />
          </div>
        </div>
        <div className={styles.actions}>
          <Button loading={busy} onClick={() => onSave(entry)}>
            <Save aria-hidden="true" />
            {busy ? labels.saving : labels.save}
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => onRemove(entry)}
          >
            <Trash2 aria-hidden="true" />
            {labels.remove}
          </Button>
        </div>
      </div>
    </article>
  );
}
