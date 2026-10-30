import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { createTranslator, NextIntlClientProvider } from "next-intl";
import { DEFAULT_LOCALE } from "@/i18n/config";
import messages from "@/messages/en.json";

export const t = createTranslator({ locale: DEFAULT_LOCALE, messages });

export function renderWithIntl(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale={DEFAULT_LOCALE} messages={messages}>
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  });
}
