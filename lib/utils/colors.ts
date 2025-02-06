export const generateRandomColor = (): string => {
  // Define a palette that matches the app's theme
  const palette = [
    "#FF6B6B", // Coral red (from background)
    "#4158D0", // Blue (from background)
    "#845EC2", // Purple
    "#FF9671", // Peach
    "#FFC75F", // Yellow
    "#F9F871", // Light yellow
    "#00C9A7", // Teal
    "#4D8076", // Dark teal
    "#C34A36", // Dark coral
    "#845EC2", // Purple
  ] as const;

  // Pick a random color from the palette
  return palette[Math.floor(Math.random() * palette.length)];
};

export const adjustColor = (color: string, amount: number): string => {
  // Handle HSL colors
  if (color.startsWith("hsl")) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length === 3) {
      const h = parseInt(matches[0]);
      const s = parseInt(matches[1]);
      const l = Math.max(0, Math.min(100, parseInt(matches[2]) + amount));
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
  }

  // Handle hex colors
  try {
    const hex = color.replace("#", "");
    const num = parseInt(hex, 16);
    let r = num >> 16;
    let g = (num >> 8) & 0x00ff;
    let b = num & 0x0000ff;

    r = Math.min(255, Math.max(0, r + amount));
    g = Math.min(255, Math.max(0, g + amount));
    b = Math.min(255, Math.max(0, b + amount));

    const newHex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
    return `#${newHex}`;
  } catch (e) {
    console.error("Error adjusting color:", color);
    return color; // Return original color if conversion fails
  }
};
