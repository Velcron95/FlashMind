export const generateRandomColor = (): string => {
  // Generate vibrant colors by using HSL
  const hue = Math.floor(Math.random() * 360); // Random hue (0-360)
  const saturation = Math.floor(Math.random() * 20) + 80; // High saturation (80-100)
  const lightness = Math.floor(Math.random() * 20) + 40; // Medium lightness (40-60)

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
