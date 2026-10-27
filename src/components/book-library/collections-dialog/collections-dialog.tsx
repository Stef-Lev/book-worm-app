"use client";

import { useState } from "react";
import { Dialog } from "@ark-ui/react/dialog";
import DialogOverlay from "@/components/dialog-overlay/dialog-overlay";
import { FolderCog, Plus, Save, Trash2, TriangleAlert, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { fetchJson, getErrorMessage } from "@/lib/fetch-json";
import { getNotificationRegion } from "@/lib/notifications";
import Button from "@/components/button/button";
import IconButton from "@/components/icon-button/icon-button";
import TextInput from "@/components/text-input/text-input";
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
    try {
      const data = await fetchJson<{ collection: BookCollection }>(
        collection ? `/api/collections/${collection.id}` : "/api/collections",
        { method: collection ? "PATCH" : "POST", json: { name } },
      );
      const next = collection
        ? collections.map((item) =>
            item.id === collection.id ? data.collection : item,
          )
        : [...collections, data.collection];
      onChange(
        next.sort((first, second) => first.name.localeCompare(second.name)),
      );
      if (!collection) form.reset();
      toast.success(
        collection ? t("collectionRenamed") : t("collectionCreated"),
      );
    } catch (reason) {
      toast.error(getErrorMessage(reason, t("genericError")));
    } finally {
      setBusyId("");
    }
  }

  async function deleteCollection(collection: BookCollection) {
    setBusyId(collection.id);
    try {
      await fetchJson(`/api/collections/${collection.id}`, {
        method: "DELETE",
      });
      onChange(collections.filter((item) => item.id !== collection.id));
      onDeleted(collection.id);
      setPendingDelete(null);
      toast.success(t("collectionDeleted"));
    } catch (reason) {
      toast.error(getErrorMessage(reason, t("genericError")));
    } finally {
      setBusyId("");
    }
  }

  return (
    <Dialog.Root
      persistentElements={[getNotificationRegion]}
      lazyMount
      unmountOnExit
      closeOnEscape={!busyId}
      closeOnInteractOutside={!busyId}
      onOpenChange={({ open }) => {
        if (open) {
          setPendingDelete(null);
        }
      }}
    >
      <Dialog.Trigger asChild>
        <Button variant="outline" disabled={disabled}>
          <FolderCog aria-hidden="true" />
          {t("manageCollections")}
        </Button>
      </Dialog.Trigger>
      <DialogOverlay>
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
                    onSubmit={(event) => void saveCollection(event, collection)}
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
            <div className={styles.confirmation} role="alertdialog">
              <TriangleAlert
                className={styles.confirmIcon}
                aria-hidden="true"
              />
              <p className={styles.confirmText}>
                {t("confirmDeleteCollection", { name: pendingDelete.name })}
              </p>
              <div className={styles.confirmActions}>
                <Button
                  variant="outline"
                  disabled={!!busyId}
                  onClick={() => setPendingDelete(null)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  className={styles.confirmDelete}
                  variant="destructive"
                  disabled={!!busyId}
                  loading={busyId === pendingDelete.id}
                  onClick={() => void deleteCollection(pendingDelete)}
                >
                  <Trash2 aria-hidden="true" />
                  {t("deleteCollection", { name: pendingDelete.name })}
                </Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </DialogOverlay>
    </Dialog.Root>
  );
}
