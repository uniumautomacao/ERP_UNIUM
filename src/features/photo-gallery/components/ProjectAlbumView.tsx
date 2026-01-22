import { forwardRef, useState } from "react";
import { Button, Field, Input, Spinner, Text, tokens } from "@fluentui/react-components";
import type { Cr22fProjeto } from "../../../generated/models/Cr22fProjetoModel";
import type { NewS3objects } from "../../../generated/models/NewS3objectsModel";
import { formatDateTime, getMediaType } from "../utils/mediaUtils";
import { EndOfContentIndicator } from "./EndOfContentIndicator";
import { MediaLightbox } from "./MediaLightbox";

interface ProjectAlbumViewProps {
  project: Cr22fProjeto;
  medias: NewS3objects[];
  loading: boolean;
  error: string;
  hasMore: boolean;
  searchTerm: string;
  onSearch: (term: string) => void;
  onBack: () => void;
}

export const ProjectAlbumView = forwardRef<HTMLDivElement, ProjectAlbumViewProps>(({
  project,
  medias,
  loading,
  error,
  hasMore,
  searchTerm,
  onSearch,
  onBack,
}, ref) => {
  const [lightboxMedia, setLightboxMedia] = useState<NewS3objects | null>(null);

  const title = project.cr22f_apelido ?? "Sem apelido";
  const year = project.cr22f_ano ?? "Sem ano";

  const handleMediaClick = (media: NewS3objects) => {
    const mediaType = getMediaType(media.new_isimage, media.new_remoteurl ?? "");

    if (mediaType === "image" || mediaType === "pdf") {
      setLightboxMedia(media);
    } else if (mediaType === "file" && media.new_remoteurl) {
      window.open(media.new_remoteurl, "_blank");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button appearance="subtle" onClick={onBack}>
          Voltar
        </Button>
        <div>
          <Text weight="semibold" block>
            {title}
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            {year}
          </Text>
        </div>
      </div>

      <Field label="Buscar no album">
        <Input
          value={searchTerm}
          onChange={(_, data) => onSearch(data.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch(searchTerm);
            }
          }}
          placeholder="Buscar por remetente, cliente, ID ou descricao..."
        />
      </Field>

      {loading && medias.length === 0 && (
        <div className="flex items-center gap-2">
          <Spinner size="tiny" />
          <Text size={300}>Carregando fotos do projeto...</Text>
        </div>
      )}

      {error && (
        <Text size={300} style={{ color: tokens.colorPaletteRedForeground2 }}>
          Erro: {error}
        </Text>
      )}

      {!loading && !error && medias.length === 0 && (
        <Text size={300}>Nenhuma midia encontrada para este projeto.</Text>
      )}

      {medias.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {medias.map((media, index) => {
            const mediaType = getMediaType(
              media.new_isimage,
              media.new_remoteurl ?? ""
            );
            const description = media.new_wazzupmessagetext ?? "";
            const sender = media.new_nomedoremetente ?? "Sem remetente";

            return (
              <div
                key={media.new_s3objectsid}
                className="flex flex-col gap-2 rounded-lg border p-3"
                style={{
                  borderColor: tokens.colorNeutralStroke2,
                  backgroundColor: tokens.colorNeutralBackground1,
                }}
                ref={index === medias.length - 1 ? ref : undefined}
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
                        alt={description || "Imagem do projeto"}
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

      {!loading && !hasMore && medias.length > 0 && (
        <EndOfContentIndicator type="photos" totalItems={medias.length} />
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

ProjectAlbumView.displayName = "ProjectAlbumView";
