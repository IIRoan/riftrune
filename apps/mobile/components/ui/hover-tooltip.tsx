import { useCallback, useEffect, useId, useRef, useState, type ReactElement } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { Portal } from '@/components/ui/portal';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const TOOLBAR_BUTTON_SIZE = 32;
const TOOLBAR_ICON_SIZE = 18;
const EDGE_PAD = 8;
const GAP = 10;
/** Match shadcn TooltipProvider delayDuration — wait before show. */
const SHOW_DELAY_MS = 500;

export const toolbarButtonSize = TOOLBAR_BUTTON_SIZE;
export const toolbarIconSize = TOOLBAR_ICON_SIZE;

type Anchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TooltipPlacement = 'top' | 'right' | 'left';

type HoverTooltipProps = {
  label: string;
  /** Optional second line describing what the control does. */
  description?: string;
  /** Preferred side relative to the trigger. Defaults to `top`. */
  side?: 'top' | 'right';
  children: ReactElement;
  className?: string;
};

function estimateTooltipSize(hasDescription: boolean): { width: number; height: number } {
  return {
    width: hasDescription ? 208 : 112,
    height: hasDescription ? 48 : 28,
  };
}

function TooltipArrow({
  placement,
  color,
}: {
  placement: TooltipPlacement;
  color: string;
}) {
  // 45° square caret — same cue as shadcn TooltipArrow
  const base = {
    position: 'absolute' as const,
    width: 8,
    height: 8,
    backgroundColor: color,
    transform: [{ rotate: '45deg' }],
  };

  if (placement === 'right') {
    return (
      <View
        pointerEvents="none"
        style={{
          ...base,
          left: -4,
          top: '50%',
          marginTop: -4,
        }}
      />
    );
  }

  if (placement === 'left') {
    return (
      <View
        pointerEvents="none"
        style={{
          ...base,
          right: -4,
          top: '50%',
          marginTop: -4,
        }}
      />
    );
  }

  return (
    <View
      pointerEvents="none"
      style={{
        ...base,
        bottom: -4,
        left: '50%',
        marginLeft: -4,
      }}
    />
  );
}

/**
 * Web-only hover label in the shadcn tooltip idiom (primary surface, xs type,
 * delayed open). Portaled with fixed positioning so sidebar / overflow parents
 * cannot clip it. Native: children only (use accessibilityLabel instead).
 */
export function HoverTooltip({
  label,
  description,
  side = 'top',
  children,
  className,
}: HoverTooltipProps) {
  const portalName = useId();
  const anchorRef = useRef<View>(null);
  const hoveringRef = useRef(false);
  const sessionRef = useRef(0);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [entered, setEntered] = useState(false);
  const primaryColor = useCSSVariable('--color-primary') as string;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const clearDelay = useCallback(() => {
    if (delayTimerRef.current != null) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    hoveringRef.current = false;
    sessionRef.current += 1;
    clearDelay();
    setEntered(false);
    setAnchor(null);
  }, [clearDelay]);

  const revealAtAnchor = useCallback(() => {
    const session = sessionRef.current;
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      if (!hoveringRef.current || session !== sessionRef.current) return;
      setAnchor({ x, y, width, height });
      // Next frame so opacity transition can run from 0 → 1
      requestAnimationFrame(() => {
        if (hoveringRef.current && session === sessionRef.current) {
          setEntered(true);
        }
      });
    });
  }, []);

  const scheduleShow = useCallback(() => {
    hoveringRef.current = true;
    sessionRef.current += 1;
    clearDelay();
    delayTimerRef.current = setTimeout(() => {
      delayTimerRef.current = null;
      if (!hoveringRef.current) return;
      revealAtAnchor();
    }, SHOW_DELAY_MS);
  }, [clearDelay, revealAtAnchor]);

  useEffect(() => {
    return () => {
      hide();
    };
  }, [hide]);

  useEffect(() => {
    if (!anchor || Platform.OS !== 'web' || typeof window === 'undefined') return;

    const onScroll = () => {
      hide();
    };
    const onBlur = () => {
      hide();
    };
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') hide();
    };

    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [anchor, hide]);

  if (Platform.OS !== 'web') {
    return children;
  }

  const tip = estimateTooltipSize(Boolean(description));
  let left = 0;
  let top = 0;
  let placement: TooltipPlacement = side;
  if (anchor) {
    if (side === 'right') {
      const preferRight = anchor.x + anchor.width + GAP;
      const fitsRight = preferRight + tip.width <= windowWidth - EDGE_PAD;
      left = fitsRight
        ? preferRight
        : Math.max(EDGE_PAD, anchor.x - tip.width - GAP);
      placement = fitsRight ? 'right' : 'left';
      top = Math.max(
        EDGE_PAD,
        Math.min(
          anchor.y + anchor.height / 2 - tip.height / 2,
          windowHeight - tip.height - EDGE_PAD
        )
      );
    } else {
      left = Math.max(
        EDGE_PAD,
        Math.min(
          anchor.x + anchor.width / 2 - tip.width / 2,
          windowWidth - tip.width - EDGE_PAD
        )
      );
      top = Math.max(EDGE_PAD, anchor.y - tip.height - GAP);
      placement = 'top';
    }
  }

  return (
    <View
      ref={anchorRef}
      className={cn('relative', className)}
      {...({
        onMouseEnter: scheduleShow,
        onMouseLeave: hide,
        onPointerEnter: scheduleShow,
        onPointerLeave: hide,
      } as object)}
    >
      {children}
      {anchor ? (
        <Portal name={`hover-tooltip-${portalName}`}>
          <View
            pointerEvents="none"
            style={
              {
                position: 'fixed',
                left,
                top,
                zIndex: 100,
                maxWidth: Math.min(220, windowWidth - EDGE_PAD * 2),
                opacity: entered ? 1 : 0,
                transform: entered ? [{ scale: 1 }] : [{ scale: 0.96 }],
                // RN web maps this to CSS transition
                transitionProperty: 'opacity, transform',
                transitionDuration: '120ms',
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              } as object
            }
          >
            <View className="relative rounded-md bg-primary px-3 py-1.5 shadow-md shadow-black/25">
              <TooltipArrow placement={placement} color={primaryColor} />
              <Text className="text-xs font-medium text-primary-foreground">{label}</Text>
              {description ? (
                <Text className="mt-0.5 text-[11px] leading-snug text-primary-foreground/80">
                  {description}
                </Text>
              ) : null}
            </View>
          </View>
        </Portal>
      ) : null}
    </View>
  );
}

/** Fixed square slot for toolbar glyphs so icons and spinners share the same box. */
export function ToolbarIconSlot({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={cn('items-center justify-center overflow-hidden', className)}
      style={{ width: TOOLBAR_ICON_SIZE, height: TOOLBAR_ICON_SIZE }}
    >
      {children}
    </View>
  );
}
