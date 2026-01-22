export interface AlbumPreviewState {
  url: string | null;
  loading: boolean;
  hasContent?: boolean;
  mediaType?: "image" | "video" | "pdf" | "file";
}
