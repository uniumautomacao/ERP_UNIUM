import { useState, forwardRef } from "react";
import { Button, Field, Input, Spinner, Text, tokens } from "@fluentui/react-components";
import type { NewS3objects } from "../../../generated/models/NewS3objectsModel";
import { formatDateTime, getMediaType } from "../utils/mediaUtils";
import { EndOfContentIndicator } from "./EndOfContentIndicator";
import { MediaLightbox } from "./MediaLightbox";

interface UniversalPhotoGridProps {
  photos: NewS3objects[];
  loading: boolean;
  error: string;
  hasMore: boolean;
  onSearch: (term: string) => void;
}

export const UniversalPhotoGrid = forwardRef<HTMLDivElement, UniversalPhotoGridProps>(({
  photos,
  loading,
  error,
  hasMore,
  onSearch,
}, ref) => {
  const [lightboxMedia, setLightboxMedia] = useState<NewS3objects | null>(null);
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  const handleSearch = () => onSearch(localSearchTerm);

  const handleMediaClick = (media: NewS3objects) => {
    const mediaType = getMediaType(media.new_isimage, media.new_remoteurl ?? "");

    if (mediaType === "image" || mediaType === "pdf") {
      setLightboxMedia(media);
    } else if (mediaType === "file" && media.new_remoteurl) {
      window.open(media.new_remoteurl, "_blank");
    }
  };

  if (loading && photos.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Spinner size="tiny" />
        <Text size={300}>Carregando fotos...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <Text size={300} style={{ color: tokens.colorPaletteRedForeground2 }}>
        Erro: {error}
      </Text>
    );
  }

  if (!loading && photos.length === 0) {
    return (
      <Text size={300}>Nenhuma foto encontrada na busca universal.</Text>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Buscar fotos">
          <Input
            value={localSearchTerm}
            onChange={(_, data) => setLocalSearchTerm(data.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Buscar por remetente, cliente, descricao..."
          />
        </Field>
        <Button onClick={handleSearch}>Buscar</Button>
      </div>

      {photos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {photos.map((media, index) => {
            const mediaType = getMediaType(
              media.new_isimage,
              media.new_remoteurl ?? ""
            );
            const description = media.new_wazzupmessagetext ?? "";
            const sender = media.new_nomedoremetente ?? "Sem remetente";
            const client = media.new_nomedocliente ?? "";
            const project = media.new_nomedoprojeto ?? "";

            return (
              <div
                key={media.new_s3objectsid}
                className="flex flex-col gap-2 rounded-lg border p-3"
                style={{
                  borderColor: tokens.colorNeutralStroke2,
                  backgroundColor: tokens.colorNeutralBackground1,
                }}
                ref={index === photos.length - 1 ? ref : undefined}
              >
                <div className="flex items-center justify-center rounded-md bg-neutral-100">
                  {mediaType === "image" && media.new_remoteurl && (
                    <button
                      type="button"
                      onClick={() => handleMediaClick(media)}
                      aria-label="Abrir imagem em tela cheia"
                    >
                      <img
                        src={media.new_remoteurl}
                        alt={description || "Imagem de foto universal"}
                        className="h-40 w-full rounded-md object-cover"
                      />
                    </button>
                  )}

                  {mediaType === "video" && media.new_remoteurl && (
                    <video controls className="h-40 w-full rounded-md object-cover">
                      <source src={media.new_remoteurl} />
                      Seu navegador nao suporta video.
                    </video>
                  )}

                  {mediaType === "pdf" && media.new_remoteurl && (
                    <button
                      type="button"
                      className="w-full"
                      onClick={() => handleMediaClick(media)}
                      aria-label="Abrir PDF em tela cheia"
                    >
                      <embed
                        src={media.new_remoteurl}
                        type="application/pdf"
                        className="h-40 w-full rounded-md"
                        title={description || "Preview PDF"}
                      />
                    </button>
                  )}

                  {mediaType === "file" && (
                    <Button appearance="subtle" onClick={() => handleMediaClick(media)}>
                      Abrir arquivo
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Text weight="semibold">{sender}</Text>
                  {media.new_remoteurl && (
                    <Button
                      size="small"
                      appearance="subtle"
                      onClick={() => window.open(media.new_remoteurl ?? "", "_blank")}
                      aria-label="Abrir URL em nova aba"
                    >
                      Abrir
                    </Button>
                  )}
                </div>

                {client && (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Cliente: {client}
                  </Text>
                )}

                {project && (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Projeto: {project}
                  </Text>
                )}

                {media.new_datetime && (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Data: {formatDateTime(media.new_datetime)}
                  </Text>
                )}

                {description && <Text size={300}>{description}</Text>}
              </div>
            );
          })}
        </div>
      )}

      {loading && photos.length > 0 && (
        <div className="flex items-center gap-2">
          <Spinner size="tiny" />
          <Text size={300}>Carregando mais fotos...</Text>
        </div>
      )}

      {!loading && !hasMore && photos.length > 0 && (
        <EndOfContentIndicator type="photos" totalItems={photos.length} />
      )}

      {lightboxMedia && (
        <MediaLightbox
          imageUrl={lightboxMedia.new_remoteurl ?? ""}
          description={lightboxMedia.new_wazzupmessagetext ?? ""}
          onClose={() => setLightboxMedia(null)}
          mediaType={getMediaType(lightboxMedia.new_isimage, lightboxMedia.new_remoteurl ?? "")}
        />
      )}
    </div>
  );
});

UniversalPhotoGrid.displayName = "UniversalPhotoGrid";
