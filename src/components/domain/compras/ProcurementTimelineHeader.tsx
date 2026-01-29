/**
 * ProcurementTimelineHeader - Header component with month and week labels
 */

import { useMemo } from 'react';
import { Text, tokens } from '@fluentui/react-components';
import { TimelineHeaderProps } from './types';
import { generateTimelineHeaders } from './utils';

const HEADER_HEIGHT = 60;
const MONTH_ROW_HEIGHT = 30;
const WEEK_ROW_HEIGHT = 30;

export function ProcurementTimelineHeader({
  startDate,
  endDate,
  totalDays,
}: TimelineHeaderProps) {
  const headers = useMemo(
    () => generateTimelineHeaders(startDate, totalDays),
    [startDate, totalDays]
  );

  return (
    <div
      style={{
        height: `${HEADER_HEIGHT}px`,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: tokens.colorNeutralBackground3,
        position: 'sticky',
        top: 0,
        zIndex: 20,
        minWidth: '100%',
      }}
    >
      {/* Months Row */}
      <div
        className="flex"
        style={{
          height: `${MONTH_ROW_HEIGHT}px`,
          borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        }}
      >
        {headers.months.map((month, index) => (
          <div
            key={`month-${index}`}
            style={{
              width: `${(month.width / totalDays) * 100}%`,
              minWidth: `${(month.width / totalDays) * 100}%`,
              borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Text
              size={200}
              weight="semibold"
              style={{
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                textTransform: 'capitalize',
              }}
            >
              {month.label}
            </Text>
          </div>
        ))}
      </div>

      {/* Weeks Row */}
      <div
        className="flex"
        style={{
          height: `${WEEK_ROW_HEIGHT}px`,
        }}
      >
        {headers.weeks.map((week, index) => (
          <div
            key={`week-${index}`}
            style={{
              width: `${(week.width / totalDays) * 100}%`,
              minWidth: `${(week.width / totalDays) * 100}%`,
              borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              size={100}
              style={{ color: tokens.colorNeutralForeground3 }}
            >
              {week.label}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}
