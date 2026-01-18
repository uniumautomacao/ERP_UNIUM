import { useMemo } from 'react';
import { connectionDirectionOptions, connectionTypeOptions } from '../utils/optionSetMaps';

export const useConnectionTypes = () => {
  const typeOptions = useMemo(() => connectionTypeOptions, []);
  const directionOptions = useMemo(() => connectionDirectionOptions, []);

  return { typeOptions, directionOptions };
};
