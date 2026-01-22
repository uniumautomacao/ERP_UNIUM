import { useCallback, useEffect, useRef, useState } from "react";
import type { Cr22fProjeto } from "../../generated/models/Cr22fProjetoModel";
import type { NewS3objects } from "../../generated/models/NewS3objectsModel";
import { Cr22fProjetoService } from "../../generated/services/Cr22fProjetoService";
import { NewOrdemdeServicoFieldControlService } from "../../generated/services/NewOrdemdeServicoFieldControlService";
import { NewS3objectsService } from "../../generated/services/NewS3objectsService";
import {
  buildAlbumMediaSearchFilter,
  buildProjectSearchFilter,
  buildS3ObjectsByWorkOrdersFilter,
  buildUniversalPhotoSearchFilter,
  buildWorkOrdersByProjectFilter,
} from "./utils/dataverseFilters";
import { getMediaType } from "./utils/mediaUtils";
import type { AlbumPreviewState } from "./types";

const PAGE_SIZE = 12;

export function usePhotoGalleryController() {
  const [isUniversalSearch, setIsUniversalSearch] = useState(false);

  const [projects, setProjects] = useState<Cr22fProjeto[]>([]);
  const [previews, setPreviews] = useState<Record<string, AlbumPreviewState>>(
    {}
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const [universalPhotos, setUniversalPhotos] = useState<NewS3objects[]>([]);
  const [universalSearchTerm, setUniversalSearchTerm] = useState("");
  const [universalLoading, setUniversalLoading] = useState(false);
  const [universalError, setUniversalError] = useState("");
  const [universalHasMore, setUniversalHasMore] = useState(true);

  const [selectedProject, setSelectedProject] = useState<Cr22fProjeto | null>(
    null
  );
  const [albumMedias, setAlbumMedias] = useState<NewS3objects[]>([]);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [albumError, setAlbumError] = useState("");
  const [albumHasMore, setAlbumHasMore] = useState(true);
  const [albumSearchTerm, setAlbumSearchTerm] = useState("");

  const projectsObserverRef = useRef<HTMLDivElement | null>(null);
  const universalObserverRef = useRef<HTMLDivElement | null>(null);
  const albumObserverRef = useRef<HTMLDivElement | null>(null);

  const loadProjectPreview = async (projectId: string) => {
    setPreviews((prev) => ({
      ...prev,
      [projectId]: { url: null, loading: true },
    }));

    try {
      const osFilter = buildWorkOrdersByProjectFilter(projectId);
      const osResult = await NewOrdemdeServicoFieldControlService.getAll({
        select: ["new_ordemdeservicofieldcontrolid"],
        filter: osFilter,
      });

      if (!osResult.data || osResult.data.length === 0) {
        setPreviews((prev) => ({
          ...prev,
          [projectId]: { url: null, loading: false },
        }));
        return;
      }

      const osIds = osResult.data
        .map((os) => os.new_ordemdeservicofieldcontrolid)
        .filter((id): id is string => !!id);

      const mediaFilter = buildS3ObjectsByWorkOrdersFilter(osIds);
      const photoResult = await NewS3objectsService.getAll({
        select: ["new_s3objectsid", "new_remoteurl", "new_isimage"],
        filter: mediaFilter,
        orderBy: ["new_datetime desc"],
        top: 1,
      });

      if (!photoResult.success) {
        setPreviews((prev) => ({
          ...prev,
          [projectId]: { url: null, loading: false },
        }));
        return;
      }

      if (photoResult.data && photoResult.data.length > 0) {
        const lastMedia = photoResult.data[0];
        const remoteUrl = lastMedia.new_remoteurl ?? "";
        const mediaType = getMediaType(lastMedia.new_isimage, remoteUrl);
        const isImage = mediaType === "image" && !!remoteUrl;

        setPreviews((prev) => ({
          ...prev,
          [projectId]: {
            url: isImage ? remoteUrl : null,
            loading: false,
            hasContent: true,
            mediaType,
          },
        }));
      } else {
        setPreviews((prev) => ({
          ...prev,
          [projectId]: { url: null, loading: false, hasContent: false },
        }));
      }
    } catch (err) {
      console.error(`Erro ao carregar preview do projeto ${projectId}:`, err);
      setPreviews((prev) => ({
        ...prev,
        [projectId]: { url: null, loading: false },
      }));
    }
  };

  const loadProjects = useCallback(
    async (isLoadMore: boolean) => {
      setLoading(true);
      setError("");

      try {
        let filterStr = buildProjectSearchFilter(searchTerm);

        if (isLoadMore && projects.length > 0) {
          const lastProject = projects[projects.length - 1];
          if (lastProject.cr22f_apelido) {
            const cursorFilter = `cr22f_apelido gt '${lastProject.cr22f_apelido.replace(/'/g, "''")}'`;
            filterStr = filterStr ? `${filterStr} and ${cursorFilter}` : cursorFilter;
          }
        }

        const result = await Cr22fProjetoService.getAll({
          select: ["cr22f_projetoid", "cr22f_apelido", "cr22f_ano"],
          filter: filterStr || undefined,
          orderBy: ["cr22f_apelido asc"],
          top: PAGE_SIZE,
        });

        if (!result.success) {
          setError(
            result.error?.message ?? "Falha ao carregar projetos do Dataverse."
          );
          setProjects([]);
          setHasMore(false);
          return;
        }

        if (result.data) {
          if (isLoadMore) {
            setProjects((prev) => [...prev, ...result.data]);
          } else {
            setProjects(result.data);
          }

          setHasMore(result.data.length === PAGE_SIZE);

          result.data.forEach((project) => {
            if (project.cr22f_projetoid) {
              loadProjectPreview(project.cr22f_projetoid);
            }
          });
        }
      } catch (err) {
        setError((err as Error).message);
        console.error("Erro ao carregar projetos:", err);
      } finally {
        setLoading(false);
      }
    },
    [projects, searchTerm]
  );

  const loadAlbumMedias = async (
    project: Cr22fProjeto,
    isLoadMore: boolean = false,
    searchOverride?: string
  ) => {
    if (!project.cr22f_projetoid) return;

    if (!isLoadMore) {
      setSelectedProject(project);
      setAlbumMedias([]);
      setAlbumHasMore(true);
    }

    const currentSearch = searchOverride ?? albumSearchTerm;

    setAlbumLoading(true);
    setAlbumError("");

    try {
      const osFilter = buildWorkOrdersByProjectFilter(project.cr22f_projetoid);
      const osResult = await NewOrdemdeServicoFieldControlService.getAll({
        select: ["new_ordemdeservicofieldcontrolid"],
        filter: osFilter,
      });

      if (!osResult.success) {
        setAlbumError(
          osResult.error?.message ??
            "Falha ao carregar ordens de servico do projeto."
        );
        setAlbumLoading(false);
        return;
      }

      if (!osResult.data || osResult.data.length === 0) {
        setAlbumLoading(false);
        setAlbumHasMore(false);
        return;
      }

      const osIds = osResult.data
        .map((os) => os.new_ordemdeservicofieldcontrolid)
        .filter((id): id is string => !!id);

      const baseMediaFilter = buildS3ObjectsByWorkOrdersFilter(osIds);
      const searchFilter = buildAlbumMediaSearchFilter(currentSearch);
      const combinedBaseFilter = searchFilter
        ? `${baseMediaFilter} and ${searchFilter}`
        : baseMediaFilter;

      let paginationFilter = combinedBaseFilter;
      if (isLoadMore && albumMedias.length > 0) {
        const lastPhoto = albumMedias[albumMedias.length - 1];
        if (lastPhoto.new_datetime) {
          const dateFilter = `new_datetime lt '${lastPhoto.new_datetime}'`;
          paginationFilter = combinedBaseFilter
            ? `${combinedBaseFilter} and ${dateFilter}`
            : dateFilter;
        }
      }

      const mediaResult = await NewS3objectsService.getAll({
        select: [
          "new_s3objectsid",
          "new_remoteurl",
          "new_isimage",
          "new_wazzupmessagetext",
          "new_nomedoremetente",
          "new_nomedocliente",
          "new_id",
          "new_datetime",
        ],
        filter: paginationFilter,
        orderBy: ["new_datetime desc"],
        top: PAGE_SIZE,
      });

      if (!mediaResult.success) {
        setAlbumError(
          mediaResult.error?.message ?? "Falha ao carregar midias do projeto."
        );
        return;
      }

      if (mediaResult.data) {
        if (isLoadMore) {
          setAlbumMedias((prev) => [...prev, ...mediaResult.data]);
        } else {
          setAlbumMedias(mediaResult.data);
        }

        setAlbumHasMore(mediaResult.data.length === PAGE_SIZE);
      }
    } catch (err) {
      setAlbumError((err as Error).message);
      console.error("Erro ao carregar midias do album:", err);
    } finally {
      setAlbumLoading(false);
    }
  };

  const loadUniversalPhotos = useCallback(
    async (isLoadMore: boolean) => {
      setUniversalLoading(true);
      setUniversalError("");

      try {
        const baseFilter = buildUniversalPhotoSearchFilter(universalSearchTerm);

        let paginationFilter = baseFilter;
        if (isLoadMore && universalPhotos.length > 0) {
          const lastPhoto = universalPhotos[universalPhotos.length - 1];
          if (lastPhoto.new_datetime) {
            const dateFilter = `new_datetime lt '${lastPhoto.new_datetime}'`;
            paginationFilter = baseFilter
              ? `${baseFilter} and ${dateFilter}`
              : dateFilter;
          }
        }

        const result = await NewS3objectsService.getAll({
          select: [
            "new_s3objectsid",
            "new_remoteurl",
            "new_isimage",
            "new_wazzupmessagetext",
            "new_nomedoremetente",
            "new_nomedocliente",
            "new_nomedoprojeto",
            "new_id",
            "new_datetime",
          ],
          filter: paginationFilter,
          orderBy: ["new_datetime desc"],
          top: PAGE_SIZE,
        });

        if (!result.success) {
          setUniversalError(
            result.error?.message ?? "Falha ao carregar fotos universais."
          );
          setUniversalPhotos([]);
          setUniversalHasMore(false);
          return;
        }

        if (result.data) {
          if (isLoadMore) {
            setUniversalPhotos((prev) => [...prev, ...result.data]);
          } else {
            setUniversalPhotos(result.data);
          }

          setUniversalHasMore(result.data.length === PAGE_SIZE);
        }
      } catch (err) {
        setUniversalError((err as Error).message);
        console.error("Erro ao carregar fotos universais:", err);
      } finally {
        setUniversalLoading(false);
      }
    },
    [universalSearchTerm, universalPhotos]
  );

  const handleSearch = () => {
    if (isUniversalSearch) {
      setUniversalPhotos([]);
      setUniversalHasMore(true);
      loadUniversalPhotos(false);
    } else {
      setProjects([]);
      setPreviews({});
      loadProjects(false);
    }
  };

  const handleUniversalPhotoSearch = (term: string) => {
    setUniversalSearchTerm(term);
    setUniversalPhotos([]);
    setUniversalHasMore(true);
  };

  const handleAlbumSearch = (term: string) => {
    setAlbumSearchTerm(term);
    setAlbumMedias([]);
    setAlbumHasMore(true);
    if (selectedProject) {
      loadAlbumMedias(selectedProject, false, term);
    }
  };

  const handleToggleSearchMode = () => {
    setIsUniversalSearch(!isUniversalSearch);
    setProjects([]);
    setPreviews({});
    setSearchTerm("");
    setUniversalPhotos([]);
    setUniversalSearchTerm("");
    setUniversalHasMore(true);
    setError("");
    setUniversalError("");
  };

  const handleOpenAlbum = (project: Cr22fProjeto) => {
    setAlbumSearchTerm("");
    loadAlbumMedias(project);
  };

  const handleBackToList = () => {
    setSelectedProject(null);
    setAlbumMedias([]);
    setAlbumError("");
    setAlbumHasMore(true);
    setAlbumSearchTerm("");
  };

  useEffect(() => {
    if (!isUniversalSearch) {
      loadProjects(false);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !isUniversalSearch) {
          loadProjects(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    );

    const currentRef = projectsObserverRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loading, isUniversalSearch, loadProjects]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && universalHasMore && !universalLoading && isUniversalSearch) {
          loadUniversalPhotos(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    );

    const currentRef = universalObserverRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [universalHasMore, universalLoading, isUniversalSearch, loadUniversalPhotos]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && albumHasMore && !albumLoading && selectedProject) {
          loadAlbumMedias(selectedProject, true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    );

    const currentRef = albumObserverRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [albumHasMore, albumLoading, selectedProject, albumMedias]);

  return {
    isUniversalSearch,
    projects,
    previews,
    searchTerm,
    loading,
    error,
    hasMore,
    universalPhotos,
    universalSearchTerm,
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
    setUniversalSearchTerm,
    handleSearch,
    handleUniversalPhotoSearch,
    handleAlbumSearch,
    handleToggleSearchMode,
    handleOpenAlbum,
    handleBackToList,
  };
}
