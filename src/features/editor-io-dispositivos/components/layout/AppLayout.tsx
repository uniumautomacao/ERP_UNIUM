import React from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Title3,
  Caption1,
} from '@fluentui/react-components';
import Breadcrumb from './Breadcrumb';
import { APP_VERSION } from '../../version';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding('16px', '24px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '44px',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  logo: {
    width: '24px',
    height: '24px',
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.borderRadius('4px'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralBackground1,
    fontSize: '14px',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  versionLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
    fontWeight: 400,
    ...shorthands.padding('4px', '8px'),
    ...shorthands.borderRadius('4px'),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
  main: {
    flex: 1,
    ...shorthands.padding('24px'),
    maxWidth: '1400px',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  content: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding('24px'),
    boxShadow: tokens.shadow4,
  },
});

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface AppLayoutProps {
  title: string;
  breadcrumbItems?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ title, breadcrumbItems, actions, children }) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitle}>
            <div className={styles.logo}>IO</div>
            <Title3>{title}</Title3>
          </div>
          <div className={styles.actions}>
            {actions}
            <Caption1 className={styles.versionLabel}>v{APP_VERSION}</Caption1>
          </div>
        </div>
        {breadcrumbItems && breadcrumbItems.length > 0 && (
          <Breadcrumb items={breadcrumbItems} />
        )}
      </header>
      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
