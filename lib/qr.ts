import "server-only";
import QRCode from "qrcode";

/** QR en SVG (noir sur fond clair, lisible par la page scan et les lecteurs standards). */
export function qrSvg(texte: string) {
  return QRCode.toString(texte, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0c0707", light: "#00000000" } });
}
