import type { AuthFormState } from "@/actions/auth";
import type { TextInputProps } from "@/components/text-input/text-input.types";

export type AuthFormField = Omit<TextInputProps, "className" | "required"> & {
  name: string;
};

export type AuthFormProps = {
  action: (
    previous: AuthFormState,
    formData: FormData,
  ) => Promise<AuthFormState>;
  fields: AuthFormField[];
  submitLabel: string;
};
