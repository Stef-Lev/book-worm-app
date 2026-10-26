"use client";

import { useState } from "react";
import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { FolderCog, Plus, Save, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/button/button";
import IconButton from "@/components/icon-button/icon-button";
import TextInput from "@/components/text-input/text-input";
import FeedbackMessage from "@/components/feedback-message/feedback-message";
import type { BookCollection } from "@/components/book-entry/book-entry.types";
import type { CollectionsDialogProps } from "./collections-dialog.types";
import styles from "./collections-dialog.module.css";

export default function CollectionsDialog({
  collections,
  onChange,
  onDeleted,
  disabled,
}: CollectionsDialogProps) {
  const t = useTranslations("libraryWorkspace");
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState<BookCollection | null>(
    null,
  );

  async function saveCollection(
    event: React.FormEvent<HTMLFormElement>,
    collection?: BookCollection,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "").trim();
    if (!name) return;
    setBusyId(collection?.id ?? "create");
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        collection ? `/api/collections/${collection.id}` : "/api/collections",
        {
          method: collection ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
      );
      const data = (await response.json()) as {
        collection: BookCollection;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? t("genericError"));
      const next = collection
        ? collections.map((item) =>
            item.id === collection.id ? data.collection : item,
          )
        : [...collections, data.collection];
      onChange(
        next.sort((first, second) => first.name.localeCompare(second.name)),
      );
      if (!collection) form.reset();
      setMessage(collection ? t("collectionRenamed") : t("collectionCreated"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("genericError"));
    } finally {
      setBusyId("");
    }
  }

  async function deleteCollection(collection: BookCollection) {
    setBusyId(collection.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? t("genericError"));
      onChange(collections.filter((item) => item.id !== collection.id));
      onDeleted(collection.id);
      setPendingDelete(null);
      setMessage(t("collectionDeleted"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("genericError"));
    } finally {
      setBusyId("");
    }
  }

  return (
    <Dialog.Root
      lazyMount
      unmountOnExit
      closeOnEscape={!busyId}
      closeOnInteractOutside={!busyId}
      onOpenChange={({ open }) => {
        if (open) {
          setError("");
          setMessage("");
          setPendingDelete(null);
        }
      }}
    >
      <Dialog.Trigger asChild>
        <IconButton label={t("manageCollections")} disabled={disabled}>
          <FolderCog aria-hidden="true" />
        </IconButton>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Positioner className={styles.positioner}>
          <Dialog.Content className={styles.dialog}>
            <div className={styles.header}>
              <Dialog.Title className={styles.title}>
                {t("manageCollections")}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton label={t("close")} disabled={!!busyId}>
                  <X aria-hidden="true" />
                </IconButton>
              </Dialog.CloseTrigger>
            </div>
            <FeedbackMessage tone="error">{error}</FeedbackMessage>
            <FeedbackMessage>{message}</FeedbackMessage>
            <form
              className={styles.createForm}
              onSubmit={(event) => void saveCollection(event)}
            >
              <TextInput
                label={t("collectionName")}
                fieldClassName={styles.field}
                name="name"
                required
                maxLength={50}
                disabled={!!busyId}
              />
              <Button
                type="submit"
                loading={busyId === "create"}
                disabled={!!busyId}
              >
                <Plus aria-hidden="true" />
                {t("createCollection")}
              </Button>
            </form>
            {collections.length ? (
              <ul className={styles.list}>
                {collections.map((collection) => (
                  <li key={collection.id}>
                    <form
                      className={styles.collectionRow}
                      onSubmit={(event) =>
                        void saveCollection(event, collection)
                      }
                    >
                      <TextInput
                        label={t("renameCollection", { name: collection.name })}
                        fieldClassName={styles.field}
                        name="name"
                        defaultValue={collection.name}
                        required
                        maxLength={50}
                        disabled={!!busyId}
                      />
                      <IconButton
                        type="submit"
                        label={t("renameCollection", { name: collection.name })}
                        disabled={!!busyId}
                      >
                        <Save aria-hidden="true" />
                      </IconButton>
                      <IconButton
                        className={styles.deleteButton}
                        label={t("deleteCollection", { name: collection.name })}
                        disabled={!!busyId}
                        onClick={() => setPendingDelete(collection)}
                      >
                        <Trash2 aria-hidden="true" />
                      </IconButton>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>{t("emptyCollections")}</p>
            )}
            {pendingDelete && (
              <div className={styles.confirmation}>
                <p>
                  {t("confirmDeleteCollection", { name: pendingDelete.name })}
                </p>
                <div className={styles.confirmActions}>
                  <Button
                    variant="destructive"
                    disabled={!!busyId}
                    loading={busyId === pendingDelete.id}
                    onClick={() => void deleteCollection(pendingDelete)}
                  >
                    <Trash2 aria-hidden="true" />
                    {t("deleteCollection", { name: pendingDelete.name })}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={!!busyId}
                    onClick={() => setPendingDelete(null)}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
