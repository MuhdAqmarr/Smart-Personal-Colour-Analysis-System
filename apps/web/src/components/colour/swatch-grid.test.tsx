import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SwatchGrid } from "./swatch-grid";

const swatches = [
  { name: "Terracotta", hex: "#c66b3d" },
  { name: "Rust", hex: "#b7410e" },
];

describe("SwatchGrid", () => {
  it("renders one accessible button per swatch", () => {
    render(<SwatchGrid swatches={swatches} />);
    expect(screen.getByRole("button", { name: /Terracotta, #c66b3d/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rust, #b7410e/i })).toBeInTheDocument();
  });

  it("shows name and hex labels when requested", () => {
    render(<SwatchGrid swatches={swatches} showLabels />);
    expect(screen.getByText("Terracotta")).toBeInTheDocument();
    expect(screen.getByText("#c66b3d")).toBeInTheDocument();
  });

  it("copies the hex value on click", async () => {
    // userEvent installs a working clipboard stub; read it back to verify.
    const user = userEvent.setup();
    render(<SwatchGrid swatches={swatches} />);
    await user.click(screen.getByRole("button", { name: /Terracotta/i }));
    await expect(navigator.clipboard.readText()).resolves.toBe("#c66b3d");
  });
});
