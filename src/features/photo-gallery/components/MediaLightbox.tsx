import { useEffect } from "react";
import { Button, Text, tokens } from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";

interface MediaLightboxProps {
  imageUrl: string;
  description: string;
  onClose: () => void;
  mediaType?: "image" | "pdf" | "video" | "file";
}

export function MediaLightbox({
  imageUrl,
  description,
  onClose,
  mediaType = "image",
}: MediaLightboxProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 2000,
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        className="relative max-h-full w-full max-w-5xl overflow-hidden"
        style={{
          backgroundColor: tokens.colorNeutralBackground1,
          borderRadius: "12px",
          boxShadow: tokens.shadow16,
          padding: "16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <Text weight="semibold">
            {description || "Visualizacao de midia"}
          </Text>
          <Button
            icon={<Dismiss24Regular />}
            appearance="subtle"
            onClick={onClose}
            aria-label="Fechar"
          />
        </div>

        <div className="mt-3 max-h-[70vh] overflow-auto">
          {mediaType === "image" && (
            <img
              src={imageUrl}
              alt={description || "Imagem"}
              className="mx-auto max-h-[70vh] w-auto"
            />
          )}

          {mediaType === "video" && (
            <video controls className="w-full max-h-[70vh]">
              <source src={imageUrl} />
              Seu navegador nao suporta video.
            </video>
          )}

          {mediaType === "pdf" && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => window.open(imageUrl, "_blank")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  window.open(imageUrl, "_blank");
                }
              }}
              aria-label="Clique para abrir PDF em nova aba"
            >
              <embed
                src={imageUrl}
                type="application/pdf"
                className="h-[70vh] w-full"
                title={description || "PDF"}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
