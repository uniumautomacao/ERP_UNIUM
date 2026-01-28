import { config, dataverseApiBase } from './config';
import { getAccessToken } from './auth';

const buildHeaders = (token: string, solutionUniqueName?: string) => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'OData-MaxVersion': '4.0',
    'OData-Version': '4.0',
  };
  if (solutionUniqueName) {
    headers.MSCRM_SolutionUniqueName = solutionUniqueName;
    headers['MSCRM.SolutionUniqueName'] = solutionUniqueName;
  }
  return headers;
};

const buildUrl = (path: string) => new URL(path, dataverseApiBase).toString();

export type DataverseRequestOptions = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  solutionUniqueName?: string;
};

export const dataverseRequest = async <T>({ method, path, body, solutionUniqueName }: DataverseRequestOptions) => {
  const token = await getAccessToken([`${config.DATAVERSE_URL}/user_impersonation`]);
  const response = await fetch(buildUrl(path), {
    method,
    headers: buildHeaders(token, solutionUniqueName),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Dataverse ${method} ${path} falhou: ${response.status} ${response.statusText} - ${text}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  const json = (await response.json()) as T;
  return json;
};
