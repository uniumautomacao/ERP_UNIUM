import { Button, Text, tokens } from '@fluentui/react-components';
import { ChevronLeft24Regular, ChevronRight24Regular } from '@fluentui/react-icons';
import type { CronogramaOS } from '../../../features/cronograma-instalacoes/types';
import { SERVICE_COLORS } from '../../../features/cronograma-instalacoes/constants';
import { formatMonthYear, parseDate } from '../../../features/cronograma-instalacoes/utils';

interface CalendarioTabProps {
  itens: CronogramaOS[];
  ano: number;
  mes: number;
  onMesChange: (mes: number) => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const getDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function CalendarioTab({ itens, ano, mes, onMesChange, selectedDate, onSelectDate }: CalendarioTabProps) {
  const firstDayOfMonth = new Date(ano, mes, 1);
  const lastDayOfMonth = new Date(ano, mes + 1, 0);
  const startOffset = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const osByDay = new Map<string, CronogramaOS[]>();
  itens.forEach((os) => {
    const date = parseDate(os.datadaproximaatividade);
    if (!date) return;
    if (date.getFullYear() !== ano || date.getMonth() !== mes) return;
    const key = getDateKey(date);
    const list = osByDay.get(key) ?? [];
    list.push(os);
    osByDay.set(key, list);
  });

  const calendarCells = Array.from({ length: startOffset + totalDays }, (_, index) => {
    if (index < startOffset) return null;
    const dayNumber = index - startOffset + 1;
    return new Date(ano, mes, dayNumber);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Button
          appearance="subtle"
          icon={<ChevronLeft24Regular />}
          onClick={() => onMesChange(Math.max(0, mes - 1))}
          disabled={mes === 0}
        />
        <Text size={300} weight="semibold">
          {formatMonthYear(firstDayOfMonth)}
        </Text>
        <Button
          appearance="subtle"
          icon={<ChevronRight24Regular />}
          onClick={() => onMesChange(Math.min(11, mes + 1))}
          disabled={mes === 11}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: '4px',
        }}
      >
        {dayLabels.map((label) => (
          <Text key={label} size={200} weight="semibold" style={{ textAlign: 'center' }}>
            {label}
          </Text>
        ))}
        {calendarCells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} style={{ height: '72px' }} />;
          }

          const key = getDateKey(date);
          const items = osByDay.get(key) ?? [];
          const isSelected =
            selectedDate &&
            date.getFullYear() === selectedDate.getFullYear() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getDate() === selectedDate.getDate();

          return (
            <button
              type="button"
              key={key}
              onClick={() => onSelectDate(date)}
              style={{
                minHeight: '72px',
                borderRadius: '8px',
                border: `1px solid ${isSelected ? tokens.colorBrandStroke1 : tokens.colorNeutralStroke2}`,
                backgroundColor: isSelected ? tokens.colorBrandBackground2 : tokens.colorNeutralBackground1,
                padding: '6px',
                textAlign: 'left',
              }}
            >
              <Text size={200} weight="semibold">
                {date.getDate()}
              </Text>
              <div className="flex flex-wrap gap-1 mt-1">
                {items.map((os) => (
                  <span
                    key={`${os.id}-${os.tipodeservico}`}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: SERVICE_COLORS[os.tipodeservico],
                      display: 'inline-block',
                    }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

