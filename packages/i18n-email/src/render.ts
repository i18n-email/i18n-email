import { render } from "@react-email/render";
import type { ReactElement } from "react";

export async function renderReactEmail(
  component: ReactElement,
): Promise<string> {
  try {
    return await render(component);
  } catch (error) {
    throw new Error(
      `i18n-email: Failed to render React component: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
