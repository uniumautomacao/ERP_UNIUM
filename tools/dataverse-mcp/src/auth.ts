import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { PublicClientApplication, type Configuration, type TokenCacheContext } from '@azure/msal-node';
import { config } from './config';

const defaultCachePath = path.join(os.homedir(), '.cursor', 'mcp-cache', 'dataverse_token_cache.json');

const ensureCacheDir = async (filePath: string) => {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
};

const readCache = async (filePath: string) => {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
};

const writeCache = async (filePath: string, data: string) => {
  await ensureCacheDir(filePath);
  await fs.writeFile(filePath, data, 'utf8');
};

const buildCachePlugin = (filePath: string) => ({
  beforeCacheAccess: async (context: TokenCacheContext) => {
    const cache = await readCache(filePath);
    if (cache) {
      context.tokenCache.deserialize(cache);
    }
  },
  afterCacheAccess: async (context: TokenCacheContext) => {
    if (context.cacheHasChanged) {
      await writeCache(filePath, context.tokenCache.serialize());
    }
  },
});

const msalConfig: Configuration = {
  auth: {
    clientId: config.CLIENT_ID,
    authority: `https://login.microsoftonline.com/${config.TENANT_ID}`,
  },
  cache: {
    cachePlugin: buildCachePlugin(config.TOKEN_CACHE_PATH || defaultCachePath),
  },
  system: {
    loggerOptions: {
      loggerCallback: (_level, message) => {
        if (message) {
          console.log(message);
        }
      },
      piiLoggingEnabled: false,
      logLevel: 2,
    },
  },
};

const pca = new PublicClientApplication(msalConfig);

const getAccessTokenSilent = async (scopes: string[]) => {
  const accounts = await pca.getTokenCache().getAllAccounts();
  if (!accounts.length) {
    return null;
  }
  try {
    return await pca.acquireTokenSilent({
      account: accounts[0],
      scopes,
    });
  } catch {
    return null;
  }
};

export const getAccessToken = async (scopes: string[]) => {
  const silent = await getAccessTokenSilent(scopes);
  if (silent?.accessToken) {
    return silent.accessToken;
  }

  const result = await pca.acquireTokenByDeviceCode({
    scopes,
    deviceCodeCallback: (response) => {
      console.log(response.message);
    },
  });

  if (!result?.accessToken) {
    throw new Error('Falha ao obter token de acesso.');
  }

  return result.accessToken;
};
