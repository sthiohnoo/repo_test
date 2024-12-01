import { Configuration, DefaultApi } from '../adapter/api/__generated';
import { useMemo } from 'react';

export const useApiClient = () => {
  const basePath = '/api';

  const apiClient = useMemo(() => {
    const config = new Configuration({ basePath });
    return new DefaultApi(config, basePath);
  }, [basePath]);
  return apiClient;
};
