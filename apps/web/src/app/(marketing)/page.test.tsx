import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("Landing page", () => {
  it("renders the hero heading and primary call to action", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Find the colours that were made for you",
    );
    expect(screen.getAllByRole("link", { name: /start your analysis/i }).length).toBeGreaterThan(0);
  });

  it("presents all four colour seasons", () => {
    render(<HomePage />);
    const seasonsRegion = screen.getByRole("region", { name: /the four colour seasons/i });
    expect(seasonsRegion).toBeInTheDocument();
    for (const season of ["Spring", "Summer", "Autumn", "Winter"]) {
      expect(screen.getAllByText(season).length).toBeGreaterThan(0);
    }
  });

  it("states the privacy-by-default position", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: /private by default/i })).toBeInTheDocument();
  });

  it("never markets itself as AI-powered", () => {
    render(<HomePage />);
    // The FAQ may *mention* AI to honestly deny it; marketing claims may not.
    expect(screen.queryByText(/powered by ai|ai[- ]powered|our ai/i)).not.toBeInTheDocument();
    expect(screen.getByText(/rule-based colour science/i)).toBeInTheDocument();
  });
});
