"use client";

/* eslint-disable @next/next/no-img-element -- Cover URLs can come from the catalog or manual book entries. */
import styles from "./book-entry.module.css";
import { BookOpen, Save, Trash2 } from "lucide-react";
import type { BookEntryProps, Shelf } from "./book-entry.types";

const shelves: Shelf[] = ["to-read", "currently-reading", "read", "did-not-finish"];

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
      {entry.book.coverUrl ? (
        <img className={styles.cover} src={entry.book.coverUrl} alt="" />
      ) : (
        <div className={`${styles.cover} ${styles.placeholder}`} aria-hidden="true"><BookOpen /></div>
      )}
      <div className={styles.details}>
        <h3 className={styles.title}>{entry.book.title}</h3>
        <p className={styles.muted}>
          {entry.book.authors.length ? entry.book.authors.join(", ") : labels.noAuthor}
        </p>
        <p className={styles.muted}>
          {entry.book.pageCount ? `${entry.book.pageCount} ${labels.pages}` : ""}
          {entry.book.categories.length ? ` · ${entry.book.categories.join(", ")}` : ""}
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
                        : entry.collectionIds.filter((id) => id !== collection.id);
                      update({ collectionIds });
                    }}
                  />
                  {collection.name}
                </label>
              ))}
            </div>
          </fieldset>
          <label className={styles.field}>
            {shelfNames[entry.status]}
            <select
              className={styles.select}
              value={entry.status}
              onChange={(event) => update({ status: event.target.value as Shelf })}
              aria-label={shelfNames[entry.status]}
            >
              {shelves.map((shelf) => (
                <option value={shelf} key={shelf}>
                  {shelfNames[shelf]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            {labels.rating}
            <select
              className={styles.select}
              value={entry.rating ?? ""}
              onChange={(event) =>
                update({ rating: event.target.value ? Number(event.target.value) : null })
              }
            >
              <option value="">{labels.noRating}</option>
              {Array.from({ length: 9 }, (_, index) => (index + 2) / 2).map((rating) => (
                <option key={rating} value={rating}>
                  {"★".repeat(Math.floor(rating))}{rating % 1 ? "½" : ""} ({rating})
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            {labels.startedAt}
            <input
              className={styles.input}
              type="date"
              value={entry.startedAt}
              onChange={(event) => update({ startedAt: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            {labels.finishedAt}
            <input
              className={styles.input}
              type="date"
              value={entry.finishedAt}
              onChange={(event) => update({ finishedAt: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            {labels.review}
            <textarea
              className={styles.textarea}
              value={entry.review}
              maxLength={5000}
              onChange={(event) => update({ review: event.target.value })}
            />
          </label>
        </div>
        <div className={styles.actions}>
          <button className={styles.button} type="button" disabled={busy} onClick={() => onSave(entry)}>
            <Save aria-hidden="true" />
            {busy ? labels.saving : labels.save}
          </button>
          <button className={`${styles.button} ${styles.removeButton}`} type="button" disabled={busy} onClick={() => onRemove(entry)}>
            <Trash2 aria-hidden="true" />
            {labels.remove}
          </button>
        </div>
      </div>
    </article>
  );
}
