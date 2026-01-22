/**
 * Utilitarios para identificacao e manipulacao de tipos de midia
 */

const VIDEO_EXTENSIONS = ["mp4", "mov", "avi", "webm", "mkv"];
const PDF_EXTENSIONS = ["pdf"];

function getFileExtension(url: string): string {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split(".");
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
  } catch {
    const parts = url.split(".");
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
  }

  return "";
}

export function isVideoUrl(url: string): boolean {
  const ext = getFileExtension(url);
  return VIDEO_EXTENSIONS.includes(ext);
}

export function isPdfUrl(url: string): boolean {
  const ext = getFileExtension(url);
  return PDF_EXTENSIONS.includes(ext);
}

export function getMediaType(
  isImage: boolean | undefined,
  remoteUrl: string
): "image" | "video" | "pdf" | "file" {
  if (isImage === true) {
    return "image";
  }

  if (isVideoUrl(remoteUrl)) {
    return "video";
  }

  if (isPdfUrl(remoteUrl)) {
    return "pdf";
  }

  return "file";
}

export function formatDateTime(dateTimeString: string | undefined): string {
  if (!dateTimeString) return "";

  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
