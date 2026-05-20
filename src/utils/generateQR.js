import QRCode from "qrcode";
import gamanLogo from "../assets/gaman_transparente.png";

/**
 * Genera un QR code con el logo de GAMAN centrado.
 *
 * Usa errorCorrectionLevel "H" (30 % de redundancia) para tolerar
 * el área que ocupa el logo sin perder legibilidad.
 *
 * @param {string} text   Texto a codificar (ej. número de constancia)
 * @param {number} [size=300] Tamaño en píxeles del canvas de salida
 * @returns {Promise<string>} Data URL PNG lista para usar en <Image> de react-pdf
 */
export async function generateQR(text, size = 250) {
  // 1. Renderizar QR en canvas
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#000000", light: "#FFFFFF" },
  });

  const ctx = canvas.getContext("2d");

  // 2. Calcular área del logo (30 % del QR, sin fondo)
  const logoSize = Math.floor(size * 0.33);
  const x = Math.floor((size - logoSize) / 2);
  const y = Math.floor((size - logoSize) / 2);

  // 3. Logo directo encima del QR, sin fondo
  const img = new Image();
  img.src = gamanLogo;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  ctx.drawImage(img, x, y, logoSize, logoSize);

  return canvas.toDataURL("image/png");
}
