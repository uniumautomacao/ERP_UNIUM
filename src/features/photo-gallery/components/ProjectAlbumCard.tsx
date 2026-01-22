import { forwardRef } from "react";
import { Card, Text, tokens } from "@fluentui/react-components";
import type { Cr22fProjeto } from "../../../generated/models/Cr22fProjetoModel";
import type { AlbumPreviewState } from "../types";

interface ProjectAlbumCardProps {
  project: Cr22fProjeto;
  preview: AlbumPreviewState | undefined;
  onOpen: (project: Cr22fProjeto) => void;
}

export const ProjectAlbumCard = forwardRef<HTMLDivElement, ProjectAlbumCardProps>(({
  project,
  preview,
  onOpen,
}, ref) => {
  const previewState = preview ?? { url: null, loading: true };
  const title = project.cr22f_apelido ?? "Sem apelido";
  const year = project.cr22f_ano ?? "Sem ano";

  const handleOpen = () => onOpen(project);

  return (
    <div ref={ref}>
      <Card
        onClick={handleOpen}
        tabIndex={0}
        role="button"
        aria-label={`Abrir album ${title}`}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpen();
          }
        }}
        style={{
          cursor: "pointer",
          border: `1px solid ${tokens.colorNeutralStroke2}`,
          backgroundColor: tokens.colorNeutralBackground1,
        }}
      >
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            height: "140px",
            borderRadius: "8px",
            backgroundColor: tokens.colorNeutralBackground2,
          }}
        >
          {previewState.loading ? (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Carregando...
            </Text>
          ) : previewState.url ? (
            <img
              src={previewState.url}
              alt={`Foto do album ${title}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Sem fotos
            </Text>
          )}
        </div>
        <div className="mt-3">
          <Text weight="semibold" block>
            {title}
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            {year}
          </Text>
        </div>
      </Card>
    </div>
  );
});

ProjectAlbumCard.displayName = "ProjectAlbumCard";
