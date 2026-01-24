import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  Button,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Edit24Regular } from '@fluentui/react-icons';

export type SidebarPort = {
  id: string;
  label: string;
  directionCode: 'IN' | 'OUT' | 'BI';
  typeLabel: string;
};

export type SidebarDevice = {
  id: string;
  name: string;
  location?: string | null;
  systemTypeValue?: string | null;
  systemTypeLabel?: string | null;
  ports: SidebarPort[];
};

interface DisconnectedDevicesSidebarProps {
  devices: SidebarDevice[];
  isConnecting: boolean;
  onPortMouseDown?: (portId: string) => void;
  onPortMouseUp: (portId: string) => void;
  onEditLocation?: (deviceId: string) => void;
}

const useStyles = makeStyles({
  sidebar: {
    width: '260px',
    minWidth: '260px',
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '12px',
    overflowY: 'auto',
  },
  title: {
    fontWeight: 600,
  },
  accordionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    width: '100%',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  deviceCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '8px',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  deviceHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  ports: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  portRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
    borderRadius: '6px',
    padding: '4px 6px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: 'pointer',
  },
  portDot: {
    width: '10px',
    height: '10px',
    borderRadius: '999px',
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    flexShrink: 0,
  },
  portLabel: {
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  portMeta: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  portBadge: {
    minWidth: '36px',
    textAlign: 'center',
  },
  hint: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
});

export function DisconnectedDevicesSidebar({
  devices,
  isConnecting,
  onPortMouseDown,
  onPortMouseUp,
  onEditLocation,
}: DisconnectedDevicesSidebarProps) {
  const styles = useStyles();
  const [openLocations, setOpenLocations] = useState<string[]>([]);
  const [openTypes, setOpenTypes] = useState<Record<string, string[]>>({});
  const hintText = useMemo(() => {
    if (devices.length === 0) return 'Nenhum equipamento sem conexão.';
    if (isConnecting) return 'Solte a conexão em uma porta livre.';
    return 'Arraste uma conexão do blueprint até uma porta livre.';
  }, [devices.length, isConnecting]);

  const grouped = useMemo(() => {
    const locationMap = new Map<
      string,
      { label: string; types: Map<string, { label: string; devices: SidebarDevice[] }> }
    >();
    devices.forEach((device) => {
      const rawLocation = device.location?.trim();
      const locationKey = rawLocation && rawLocation.length > 0 ? rawLocation : 'Sem localização';
      const locationLabel = locationKey;
      const typeKey = device.systemTypeValue || 'Sem tipo de sistema';
      const typeLabel = device.systemTypeLabel || 'Sem tipo de sistema';
      if (!locationMap.has(locationKey)) {
        locationMap.set(locationKey, { label: locationLabel, types: new Map() });
      }
      const typeMap = locationMap.get(locationKey)?.types;
      if (!typeMap) return;
      if (!typeMap.has(typeKey)) {
        typeMap.set(typeKey, { label: typeLabel, devices: [] });
      }
      typeMap.get(typeKey)?.devices.push(device);
    });

    return Array.from(locationMap.entries()).map(([key, value]) => ({
      key,
      label: value.label,
      types: Array.from(value.types.entries()).map(([typeKey, typeValue]) => ({
        key: typeKey,
        label: typeValue.label,
        devices: typeValue.devices,
      })),
    }));
  }, [devices]);

  return (
    <aside className={styles.sidebar}>
      <Text className={styles.title}>Equipamentos sem conexão</Text>
      <Text className={styles.hint}>{hintText}</Text>
      <Accordion
        multiple
        openItems={openLocations}
        onToggle={(_, data) => setOpenLocations(data.openItems as string[])}
        collapsible
      >
        {grouped.map((locationGroup) => (
          <AccordionItem key={locationGroup.key} value={locationGroup.key}>
            <AccordionHeader>
              <div className={styles.accordionHeader}>
                <Text weight="semibold">{locationGroup.label}</Text>
                <div className={styles.headerMeta}>
                  <Badge size="small" appearance="outline">
                    {locationGroup.types.reduce((acc, group) => acc + group.devices.length, 0)}
                  </Badge>
                </div>
              </div>
            </AccordionHeader>
            <AccordionPanel>
              <Accordion
                multiple
                openItems={openTypes[locationGroup.key] ?? []}
                onToggle={(_, data) =>
                  setOpenTypes((prev) => ({ ...prev, [locationGroup.key]: data.openItems as string[] }))
                }
                collapsible
              >
                {locationGroup.types.map((typeGroup) => (
                  <AccordionItem key={typeGroup.key} value={typeGroup.key}>
                    <AccordionHeader>
                      <div className={styles.accordionHeader}>
                        <Text weight="semibold">{typeGroup.label}</Text>
                        <div className={styles.headerMeta}>
                          <Badge size="small" appearance="outline">
                            {typeGroup.devices.length}
                          </Badge>
                        </div>
                      </div>
                    </AccordionHeader>
                    <AccordionPanel>
                      {typeGroup.devices.map((device) => (
                        <div key={device.id} className={styles.deviceCard}>
                          <div className={styles.deviceHeader}>
                            <Text weight="semibold">{device.name}</Text>
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Edit24Regular />}
                              onClick={() => onEditLocation?.(device.id)}
                            />
                          </div>
                          <div className={styles.ports}>
                            {device.ports.map((port) => (
                              <div
                                key={port.id}
                                className={styles.portRow}
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  onPortMouseDown?.(port.id);
                                }}
                                onMouseUp={() => onPortMouseUp(port.id)}
                                data-sidebar-port-id={port.id}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                  <span className={styles.portDot} />
                                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                    <Text className={styles.portLabel}>
                                      {port.directionCode === 'BI'
                                        ? port.label
                                        : `${port.label} ${port.directionCode}`}
                                    </Text>
                                    {port.directionCode === 'BI' && (
                                      <Text className={styles.portMeta}>{port.typeLabel}</Text>
                                    )}
                                  </div>
                                </div>
                                <Badge size="small" appearance="outline" className={styles.portBadge}>
                                  {port.directionCode}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </aside>
  );
}
