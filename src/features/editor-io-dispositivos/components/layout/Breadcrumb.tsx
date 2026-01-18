import React from 'react';
import {
  Breadcrumb as FluentBreadcrumb,
  BreadcrumbItem,
  BreadcrumbButton,
  BreadcrumbDivider,
  makeStyles,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  breadcrumb: {
    fontSize: '12px',
  },
});

interface BreadcrumbItemType {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItemType[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const styles = useStyles();

  return (
    <FluentBreadcrumb className={styles.breadcrumb} size="small">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            <BreadcrumbItem>
              {item.onClick && !isLast ? (
                <BreadcrumbButton onClick={item.onClick}>{item.label}</BreadcrumbButton>
              ) : (
                <BreadcrumbButton current={isLast} onClick={item.onClick}>
                  {item.label}
                </BreadcrumbButton>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbDivider />}
          </React.Fragment>
        );
      })}
    </FluentBreadcrumb>
  );
};

export default Breadcrumb;
