/**
 * Tooltip - Accessible tooltip component
 * 
 * Shows helpful text on hover/focus with keyboard support.
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  shortcut?: string | undefined;
  disabled?: boolean;
}

export function Tooltip({
  children,
  content,
  position = 'top',
  delay = 300,
  shortcut,
  disabled = false,
}: TooltipProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay, disabled]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  // Update position when visible
  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const offset = 8;

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = trigger.left + trigger.width / 2 - tooltip.width / 2;
        y = trigger.top - tooltip.height - offset;
        break;
      case 'bottom':
        x = trigger.left + trigger.width / 2 - tooltip.width / 2;
        y = trigger.bottom + offset;
        break;
      case 'left':
        x = trigger.left - tooltip.width - offset;
        y = trigger.top + trigger.height / 2 - tooltip.height / 2;
        break;
      case 'right':
        x = trigger.right + offset;
        y = trigger.top + trigger.height / 2 - tooltip.height / 2;
        break;
    }

    // Keep within viewport
    x = Math.max(8, Math.min(x, window.innerWidth - tooltip.width - 8));
    y = Math.max(8, Math.min(y, window.innerHeight - tooltip.height - 8));

    setCoords({ x, y });
  }, [isVisible, position]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-flex"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-[9999] pointer-events-none"
          style={{ left: coords.x, top: coords.y }}
        >
          <div className="bg-gray-900 text-white text-xs px-2 py-1.5 rounded-md shadow-lg border border-gray-700 whitespace-nowrap max-w-xs">
            <span>{content}</span>
            {shortcut && (
              <kbd className="ml-2 px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 font-mono text-[10px]">
                {shortcut}
              </kbd>
            )}
          </div>
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 border-gray-700 transform rotate-45 ${getArrowPosition(position)}`}
          />
        </div>
      )}
    </>
  );
}

function getArrowPosition(position: TooltipPosition): string {
  switch (position) {
    case 'top':
      return 'bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r';
    case 'bottom':
      return 'top-[-4px] left-1/2 -translate-x-1/2 border-t border-l';
    case 'left':
      return 'right-[-4px] top-1/2 -translate-y-1/2 border-t border-r';
    case 'right':
      return 'left-[-4px] top-1/2 -translate-y-1/2 border-b border-l';
  }
}

/**
 * TooltipButton - Button with integrated tooltip
 */
interface TooltipButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string;
  shortcut?: string;
  tooltipPosition?: TooltipPosition;
}

export function TooltipButton({
  tooltip,
  shortcut,
  tooltipPosition = 'top',
  children,
  ...props
}: TooltipButtonProps): JSX.Element {
  return (
    <Tooltip content={tooltip} shortcut={shortcut} position={tooltipPosition}>
      <button {...props}>{children}</button>
    </Tooltip>
  );
}
