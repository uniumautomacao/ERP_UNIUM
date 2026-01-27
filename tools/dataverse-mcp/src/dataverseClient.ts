import { config, dataverseApiBase } from './config';
import { getAccessToken } from './auth';

const buildHeaders = (token: string, useSolution: boolean) => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'OData-MaxVersion': '4.0',
    'OData-Version': '4.0',
  };
  if (useSolution && config.SOLUTION_UNIQUE_NAME) {
    headers.MSCRM_SolutionUniqueName = config.SOLUTION_UNIQUE_NAME;
    headers['MSCRM.SolutionUniqueName'] = config.SOLUTION_UNIQUE_NAME;
  }
  return headers;
};

const buildUrl = (path: string) => new URL(path, dataverseApiBase).toString();

export type DataverseRequestOptions = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  useSolution?: boolean;
};

export const dataverseRequest = async <T>({ method, path, body, useSolution }: DataverseRequestOptions) => {
  const token = await getAccessToken([`${config.DATAVERSE_URL}/user_impersonation`]);
  const response = await fetch(buildUrl(path), {
    method,
    headers: buildHeaders(token, Boolean(useSolution)),
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
