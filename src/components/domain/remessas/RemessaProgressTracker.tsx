import { Text, Tooltip, tokens } from '@fluentui/react-components';
import { Checkmark24Regular } from '@fluentui/react-icons';
import { REMESSA_STAGES } from '../../../features/remessas/constants';

interface RemessaProgressTrackerProps {
  stageValue?: number | null;
}

export function RemessaProgressTracker({ stageValue }: RemessaProgressTrackerProps) {
  const currentIndex = REMESSA_STAGES.findIndex((stage) => stage.value === stageValue);
  const currentLabel = currentIndex >= 0 ? REMESSA_STAGES[currentIndex].label : 'Não definido';

  return (
    <div className="flex flex-col gap-2">
      <Text size={200} weight="medium" style={{ color: tokens.colorNeutralForeground2 }}>
        Estágio atual: {currentLabel}
      </Text>
      <div className="flex items-start gap-0 overflow-x-auto" role="list">
        {REMESSA_STAGES.map((stage, index) => {
          const isComplete = currentIndex > index;
          const isCurrent = currentIndex === index;
          const leftColor = index === 0
            ? 'transparent'
            : isComplete || isCurrent
              ? tokens.colorBrandBackground
              : tokens.colorNeutralStroke2;
          const rightColor = index >= REMESSA_STAGES.length - 1
            ? 'transparent'
            : isComplete
              ? tokens.colorBrandBackground
              : tokens.colorNeutralStroke2;
          const nodeSize = isCurrent ? 32 : 28;
          const nodeStyle = {
            width: nodeSize,
            height: nodeSize,
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isComplete ? tokens.colorBrandBackground : tokens.colorNeutralBackground1,
            color: isComplete ? tokens.colorNeutralForegroundOnBrand : tokens.colorNeutralForeground2,
            border: isCurrent
              ? `2px solid ${tokens.colorBrandBackground}`
              : `1px solid ${tokens.colorNeutralStroke2}`,
            fontSize: 12,
            fontWeight: 600 as const,
            position: 'relative' as const,
          };

          return (
            <div
              key={stage.value}
              role="listitem"
              className="flex flex-col items-center"
              style={{ minWidth: 130, flex: 1, padding: '0 4px' }}
            >
              <div className="flex items-center w-full">
                <div style={{ flex: 1, height: 2, background: leftColor }} />
                <div aria-current={isCurrent ? 'step' : undefined} style={nodeStyle}>
                  {isComplete ? (
                    <Checkmark24Regular />
                  ) : (
                    <>
                      {isCurrent && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: tokens.colorBrandBackground,
                            position: 'absolute',
                          }}
                        />
                      )}
                      {!isCurrent && index + 1}
                    </>
                  )}
                </div>
                <div style={{ flex: 1, height: 2, background: rightColor }} />
              </div>
              <Tooltip content={stage.label} relationship="description">
                <Text
                  size={200}
                  block
                  style={{
                    marginTop: 8,
                    maxWidth: 140,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: isCurrent ? tokens.colorNeutralForeground1 : tokens.colorNeutralForeground2,
                  }}
                >
                  {stage.label}
                </Text>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
}
