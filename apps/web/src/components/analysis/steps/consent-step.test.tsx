import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AnalysisWizard } from "@/components/analysis/analysis-wizard";

describe("Consent step", () => {
  it("blocks continuing until consent is given", async () => {
    const user = userEvent.setup();
    render(<AnalysisWizard />);

    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      await screen.findByText(/consent is required before an analysis can run/i),
    ).toBeInTheDocument();
    // Still on the consent step.
    expect(screen.getByText(/before we start: your consent/i)).toBeInTheDocument();
  });

  it("has the image-storage opt-in unchecked by default", () => {
    render(<AnalysisWizard />);
    const saveCheckbox = screen.getByRole("checkbox", {
      name: /save my analysis image/i,
    });
    expect(saveCheckbox).not.toBeChecked();
  });

  it("advances to guidance after agreeing, then to capture", async () => {
    const user = userEvent.setup();
    render(<AnalysisWizard />);

    await user.click(screen.getByRole("checkbox", { name: /i agree to the analysis/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByText(/getting a reliable photo/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(await screen.findByText(/add your photo/i)).toBeInTheDocument();
  });

  it("states that identity recognition is never performed", () => {
    render(<AnalysisWizard />);
    expect(screen.getByText(/no identity recognition/i)).toBeInTheDocument();
  });
});
