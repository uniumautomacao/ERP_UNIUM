import { useMemo } from 'react';
import {
  connectionDirectionOptions,
  connectionTypeOptions,
} from '../../utils/device-io/optionSetMaps';

export const useDeviceIOConnectionTypes = () => {
  const typeOptions = useMemo(() => connectionTypeOptions, []);
  const directionOptions = useMemo(() => connectionDirectionOptions, []);

  return { typeOptions, directionOptions };
};
