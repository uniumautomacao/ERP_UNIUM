type UnknownError = unknown;

export const resolveErrorMessage = (error: UnknownError, fallback: string) => {
  if (!error) {
    return fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object') {
    const candidate =
      (error as { message?: string }).message ??
      (error as { error?: { message?: string } }).error?.message ??
      (error as { statusText?: string }).statusText;
    if (candidate) {
      return String(candidate);
    }

    try {
      return JSON.stringify(error);
    } catch {
      return fallback;
    }
  }

  return fallback;
};
