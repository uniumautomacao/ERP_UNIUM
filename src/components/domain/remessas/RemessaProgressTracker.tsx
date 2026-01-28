import { Text, tokens } from '@fluentui/react-components';
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
      <div className="flex items-center gap-2">
        {REMESSA_STAGES.map((stage, index) => {
          const isComplete = currentIndex >= index;
          return (
            <div key={stage.value} className="flex items-center">
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isComplete ? tokens.colorBrandBackground : tokens.colorNeutralBackground3,
                  color: isComplete ? tokens.colorNeutralForegroundOnBrand : tokens.colorNeutralForeground2,
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {index + 1}
              </div>
              {index < REMESSA_STAGES.length - 1 && (
                <div
                  style={{
                    width: 28,
                    height: 4,
                    backgroundColor: currentIndex > index ? tokens.colorBrandBackground : tokens.colorNeutralStroke2,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
