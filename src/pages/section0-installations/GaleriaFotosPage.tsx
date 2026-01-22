import { useMemo } from "react";
import { Button, Field, Input } from "@fluentui/react-components";
import { ArrowLeft24Regular, ImageMultiple24Regular, Search24Regular } from "@fluentui/react-icons";
import { CommandBar } from "../../components/layout/CommandBar";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import {
  ProjectAlbumList,
  ProjectAlbumView,
  UniversalPhotoGrid,
  usePhotoGalleryController,
} from "../../features/photo-gallery";

export function GaleriaFotosPage() {
  const {
    isUniversalSearch,
    projects,
    previews,
    searchTerm,
    loading,
    error,
    hasMore,
    universalPhotos,
    universalLoading,
    universalError,
    universalHasMore,
    selectedProject,
    albumMedias,
    albumLoading,
    albumError,
    albumHasMore,
    albumSearchTerm,
    projectsObserverRef,
    universalObserverRef,
    albumObserverRef,
    setSearchTerm,
    handleSearch,
    handleUniversalPhotoSearch,
    handleAlbumSearch,
    handleToggleSearchMode,
    handleOpenAlbum,
    handleBackToList,
  } = usePhotoGalleryController();

  const isAlbumView = !!selectedProject;

  const tabs = useMemo(
    () => [
      { value: "projects", label: "Projetos" },
      { value: "photos", label: "Fotos" },
    ],
    []
  );

  const selectedTab = isUniversalSearch ? "photos" : "projects";

  const primaryActions = isAlbumView
    ? [
        {
          id: "back",
          label: "Voltar",
          icon: <ArrowLeft24Regular />,
          onClick: handleBackToList,
        },
      ]
    : [
        {
          id: "search",
          label: "Buscar",
          icon: <Search24Regular />,
          onClick: handleSearch,
          appearance: "primary" as const,
        },
      ];

  const secondaryActions = isAlbumView
    ? []
    : [
        {
          id: "toggle-mode",
          label: isUniversalSearch ? "Ver projetos" : "Ver fotos",
          icon: <ImageMultiple24Regular />,
          onClick: handleToggleSearchMode,
        },
      ];

  const headerSubtitle = isAlbumView
    ? "Album do projeto selecionado"
    : isUniversalSearch
      ? "Busca universal por fotos"
      : "Albuns por projeto";

  return (
    <>
      <CommandBar primaryActions={primaryActions} secondaryActions={secondaryActions} />
      <PageHeader
        title="Galeria de Fotos"
        subtitle={headerSubtitle}
        tabs={!isAlbumView ? tabs : undefined}
        selectedTab={!isAlbumView ? selectedTab : undefined}
        onTabSelect={(value) => {
          if (value === "photos" && !isUniversalSearch) {
            handleToggleSearchMode();
          }
          if (value === "projects" && isUniversalSearch) {
            handleToggleSearchMode();
          }
        }}
      />
      <PageContainer>
        <div className="flex flex-col gap-4 min-h-0">
          {!isAlbumView && !isUniversalSearch && (
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Buscar projetos">
                <Input
                  value={searchTerm}
                  onChange={(_, data) => setSearchTerm(data.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="Buscar por apelido ou ano..."
                />
              </Field>
              <Button onClick={handleSearch}>Buscar</Button>
            </div>
          )}

          {isAlbumView && selectedProject ? (
            <ProjectAlbumView
              ref={albumObserverRef}
              project={selectedProject}
              medias={albumMedias}
              loading={albumLoading}
              error={albumError}
              hasMore={albumHasMore}
              searchTerm={albumSearchTerm}
              onSearch={handleAlbumSearch}
              onBack={handleBackToList}
            />
          ) : isUniversalSearch ? (
            <UniversalPhotoGrid
              ref={universalObserverRef}
              photos={universalPhotos}
              loading={universalLoading}
              error={universalError}
              hasMore={universalHasMore}
              onSearch={(term) => {
                handleUniversalPhotoSearch(term);
                handleSearch();
              }}
            />
          ) : (
            <ProjectAlbumList
              ref={projectsObserverRef}
              projects={projects}
              previews={previews}
              loading={loading}
              error={error}
              hasMore={hasMore}
              onOpen={handleOpenAlbum}
            />
          )}
        </div>
      </PageContainer>
    </>
  );
}
