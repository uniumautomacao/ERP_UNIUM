import {
  Fragment,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  tokens,
} from '@fluentui/react-components';
import { MoreHorizontal24Regular, Navigation24Regular } from '@fluentui/react-icons';
import { LAYOUT } from '../../config/theme';
import { useSidebar } from '../../hooks/useSidebar';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface CommandAction {
  id: string;
  label: string;
  icon?: React.ReactElement;
  onClick: () => void;
  appearance?: 'primary' | 'subtle';
  disabled?: boolean;
}

interface CommandBarProps {
  primaryActions?: CommandAction[];
  secondaryActions?: CommandAction[];
  overflowActions?: CommandAction[];
}

export function CommandBar({ primaryActions = [], secondaryActions = [], overflowActions = [] }: CommandBarProps) {
  const { toggleMobileOpen } = useSidebar();
  const isMobile = useIsMobile();
  const itemGap = 8;
  const dividerStyle = { alignSelf: 'center', height: '60%' };
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureActionRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const measureOverflowRef = useRef<HTMLSpanElement | null>(null);
  const measureDividerRef = useRef<HTMLSpanElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(primaryActions.length + secondaryActions.length);

  const mobileOverflowActions = isMobile
    ? [...primaryActions, ...secondaryActions, ...overflowActions]
    : overflowActions;
  const allActions = useMemo(
    () => [...primaryActions, ...secondaryActions],
    [primaryActions, secondaryActions]
  );
  const visibleActions = isMobile ? [] : allActions.slice(0, visibleCount);
  const hiddenActions = isMobile ? allActions : allActions.slice(visibleCount);
  const overflowMenuActions = isMobile
    ? mobileOverflowActions
    : [...hiddenActions, ...overflowActions];

  useLayoutEffect(() => {
    if (isMobile) {
      setVisibleCount(0);
      return;
    }

    const recalc = () => {
      const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 0;
      if (!containerWidth) {
        return;
      }

      const actionWidths = allActions.map((_, index) => (
        measureActionRefs.current[index]?.getBoundingClientRect().width ?? 0
      ));
      const actionOffsets = allActions.map((_, index) => measureActionRefs.current[index]?.offsetLeft ?? 0);
      const overflowWidth = measureOverflowRef.current?.getBoundingClientRect().width ?? 0;
      const dividerWidth = measureDividerRef.current?.getBoundingClientRect().width ?? 0;

      let count = 0;
      for (let i = 0; i < actionWidths.length; i += 1) {
        const rightEdge = actionOffsets[i] + actionWidths[i];
        const hiddenCount = actionWidths.length - (i + 1);
        const willShowOverflow = hiddenCount > 0 || overflowActions.length > 0;
        const overflowExtra = willShowOverflow
          ? (rightEdge > 0 ? itemGap + dividerWidth + itemGap : 0) + overflowWidth
          : 0;
        const requiredWidth = rightEdge + overflowExtra;
        if (requiredWidth <= containerWidth) {
          count = i + 1;
        } else {
          break;
        }
      }

      setVisibleCount(count);
    };

    const observer = new ResizeObserver(recalc);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    recalc();

    return () => {
      observer.disconnect();
    };
  }, [allActions, isMobile, overflowActions.length]);

  return (
    <div
      style={{
        height: `${LAYOUT.commandBar.height}px`,
        minHeight: `${LAYOUT.commandBar.height}px`,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: tokens.colorNeutralBackground1,
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 8px' : '0 16px',
        overflow: 'hidden',
      }}
    >
      <Toolbar ref={containerRef} style={{ columnGap: itemGap }}>
        {/* Botao Hamburger (apenas mobile) */}
        {isMobile && (
          <ToolbarButton
            icon={<Navigation24Regular />}
            onClick={toggleMobileOpen}
            aria-label="Open menu"
          />
        )}

        {/* Primary Actions */}
        {!isMobile && visibleActions.map((action, index) => (
          <Fragment key={action.id}>
            {!isMobile &&
              primaryActions.length > 0 &&
              secondaryActions.length > 0 &&
              index === primaryActions.length && <ToolbarDivider style={dividerStyle} />}
            <ToolbarButton
              icon={action.icon}
              onClick={action.onClick}
              appearance={action.appearance}
              disabled={action.disabled}
            >
              {action.label}
            </ToolbarButton>
          </Fragment>
        ))}

        {/* Overflow Menu */}
        {overflowMenuActions.length > 0 && (
          <>
            {!isMobile && visibleActions.length > 0 && (
              <ToolbarDivider style={dividerStyle} />
            )}
            <Menu>
              <MenuTrigger>
                <ToolbarButton
                  icon={<MoreHorizontal24Regular />}
                  aria-label="More actions"
                  appearance="subtle"
                />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {overflowMenuActions.map((action) => (
                    <MenuItem
                      key={action.id}
                      icon={action.icon}
                      onClick={action.onClick}
                      disabled={action.disabled}
                    >
                      {action.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </MenuPopover>
            </Menu>
          </>
        )}
      </Toolbar>
      <div
        style={{
          position: 'absolute',
          visibility: 'hidden',
          height: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <Toolbar style={{ columnGap: itemGap }}>
          {allActions.map((action, index) => (
            <span
              key={action.id}
              ref={(el) => {
                measureActionRefs.current[index] = el;
              }}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              {primaryActions.length > 0 &&
                secondaryActions.length > 0 &&
                index === primaryActions.length && <ToolbarDivider style={dividerStyle} />}
              <ToolbarButton
                icon={action.icon}
                onClick={action.onClick}
                appearance={action.appearance}
                disabled={action.disabled}
              >
                {action.label}
              </ToolbarButton>
            </span>
          ))}
          <span
            ref={measureDividerRef}
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <ToolbarDivider style={dividerStyle} />
          </span>
          <span
            ref={measureOverflowRef}
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <ToolbarButton icon={<MoreHorizontal24Regular />} appearance="subtle" />
          </span>
        </Toolbar>
      </div>
    </div>
  );
}
