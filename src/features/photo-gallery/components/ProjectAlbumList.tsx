import { forwardRef } from "react";
import { Spinner, Text, tokens } from "@fluentui/react-components";
import type { Cr22fProjeto } from "../../../generated/models/Cr22fProjetoModel";
import type { AlbumPreviewState } from "../types";
import { EndOfContentIndicator } from "./EndOfContentIndicator";
import { ProjectAlbumCard } from "./ProjectAlbumCard";

interface ProjectAlbumListProps {
  projects: Cr22fProjeto[];
  previews: Record<string, AlbumPreviewState>;
  loading: boolean;
  error: string;
  hasMore: boolean;
  onOpen: (project: Cr22fProjeto) => void;
}

export const ProjectAlbumList = forwardRef<HTMLDivElement, ProjectAlbumListProps>(({
  projects,
  previews,
  loading,
  error,
  hasMore,
  onOpen,
}, ref) => {
  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Spinner size="tiny" />
        <Text size={300}>Carregando projetos...</Text>
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

  if (!loading && projects.length === 0) {
    return <Text size={300}>Nenhum projeto encontrado.</Text>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.map((project, index) => (
          <ProjectAlbumCard
            key={project.cr22f_projetoid}
            project={project}
            preview={
              project.cr22f_projetoid ? previews[project.cr22f_projetoid] : undefined
            }
            onOpen={onOpen}
            ref={index === projects.length - 1 ? ref : undefined}
          />
        ))}
      </div>

      {loading && projects.length > 0 && (
        <div className="flex items-center gap-2">
          <Spinner size="tiny" />
          <Text size={300}>Carregando mais projetos...</Text>
        </div>
      )}

      {!loading && !hasMore && projects.length > 0 && (
        <EndOfContentIndicator type="projects" totalItems={projects.length} />
      )}

      {hasMore && !loading && projects.length > 0 && (
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          Role para baixo para carregar mais
        </Text>
      )}
    </div>
  );
});

ProjectAlbumList.displayName = "ProjectAlbumList";
