import React, { useEffect, useRef, type Ref } from 'react'
import { createPortal } from 'react-dom'
import {
  applyBackgroundInert,
  resolvePortalTarget,
  useDrawerController,
  type DrawerHandle,
  type DrawerLayerBase,
  type DrawerSize,
} from './DrawerCore.shared'

export function IconChevronLeft({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export function IconX({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export interface DrawerLayer extends DrawerLayerBase<DrawerSize> {}

export type DrawerCssMode = 'pure' | 'tailwind'

/**
 * `start`/`end` resolve against the document's text direction:
 * `end` is right in LTR and left in RTL.
 */
export type DrawerPlacement = 'start' | 'end' | 'left' | 'right' | 'top' | 'bottom'

export type ResolvedDrawerPlacement = 'left' | 'right' | 'top' | 'bottom'

export interface CommonDrawerClassNames {
  root: string
  backdrop: string
  panel: string
  panelSm: string
  panelMd: string
  panelLg: string
  panelXl: string
  panelFull: string
  breadcrumb: string
  breadcrumbItem: string
  breadcrumbButton: string
  breadcrumbCurrent: string
  header: string
  title: string
  iconButton: string
  content: string
  footer: string
}

export interface CommonDrawerProps {
  transitionMs?: number
  portalTarget?: Element | null
  cssMode?: DrawerCssMode
  classNames?: Partial<CommonDrawerClassNames>
  /** Which edge the drawer slides in from. Default 'end' (right in LTR, left in RTL). */
  placement?: DrawerPlacement
  /** Close (pop) when Escape is pressed. Default true. */
  closeOnEscape?: boolean
  /** Close when the backdrop is clicked. Default true. */
  closeOnBackdrop?: boolean
  /** Apply `inert` to background content while open. Default true. */
  inertBackground?: boolean
  /** Overrides the z-index of the drawer root. */
  zIndex?: number
}

export const PURE_DRAWER_CLASS_NAMES: CommonDrawerClassNames = {
  root: 'common-drawer',
  backdrop: 'common-drawer__backdrop',
  panel: 'common-drawer__panel',
  panelSm: 'common-drawer__panel--sm',
  panelMd: 'common-drawer__panel--md',
  panelLg: 'common-drawer__panel--lg',
  panelXl: 'common-drawer__panel--xl',
  panelFull: 'common-drawer__panel--full',
  breadcrumb: 'common-drawer__breadcrumb',
  breadcrumbItem: 'common-drawer__breadcrumb-item',
  breadcrumbButton: 'common-drawer__breadcrumb-button',
  breadcrumbCurrent: 'common-drawer__breadcrumb-current',
  header: 'common-drawer__header',
  title: 'common-drawer__title',
  iconButton: 'common-drawer__icon-button',
  content: 'common-drawer__content',
  footer: 'common-drawer__footer',
}

export const TAILWIND_DRAWER_CLASS_NAMES: CommonDrawerClassNames = {
  root: [
    'fixed inset-0 z-[1000] flex',
    'data-[placement=right]:items-stretch data-[placement=right]:justify-end',
    'data-[placement=left]:items-stretch data-[placement=left]:justify-start',
    'data-[placement=top]:flex-col data-[placement=top]:justify-start',
    'data-[placement=bottom]:flex-col data-[placement=bottom]:justify-end',
  ].join(' '),
  backdrop:
    'absolute inset-0 bg-slate-950/45 backdrop-blur-sm opacity-0 transition-opacity ease-out motion-reduce:transition-none data-[visible=true]:opacity-100',
  panel: [
    'relative z-10 flex flex-col overflow-hidden bg-white shadow-2xl outline-none transition-transform ease-out motion-reduce:transition-none',
    'data-[placement=right]:h-full data-[placement=right]:w-full data-[placement=right]:translate-x-full data-[placement=right]:data-[visible=true]:translate-x-0',
    'data-[placement=left]:h-full data-[placement=left]:w-full data-[placement=left]:-translate-x-full data-[placement=left]:data-[visible=true]:translate-x-0',
    'data-[placement=top]:w-full data-[placement=top]:-translate-y-full data-[placement=top]:data-[visible=true]:translate-y-0',
    'data-[placement=bottom]:w-full data-[placement=bottom]:translate-y-full data-[placement=bottom]:data-[visible=true]:translate-y-0',
  ].join(' '),
  panelSm:
    'max-w-[380px] data-[placement=top]:max-w-full data-[placement=top]:h-[min(100%,380px)] data-[placement=bottom]:max-w-full data-[placement=bottom]:h-[min(100%,380px)]',
  panelMd:
    'max-w-[480px] data-[placement=top]:max-w-full data-[placement=top]:h-[min(100%,480px)] data-[placement=bottom]:max-w-full data-[placement=bottom]:h-[min(100%,480px)]',
  panelLg:
    'max-w-[600px] data-[placement=top]:max-w-full data-[placement=top]:h-[min(100%,600px)] data-[placement=bottom]:max-w-full data-[placement=bottom]:h-[min(100%,600px)]',
  panelXl:
    'max-w-[760px] data-[placement=top]:max-w-full data-[placement=top]:h-[min(100%,760px)] data-[placement=bottom]:max-w-full data-[placement=bottom]:h-[min(100%,760px)]',
  panelFull:
    'max-w-full data-[placement=top]:h-full data-[placement=bottom]:h-full',
  breadcrumb:
    'flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-5 py-2 text-xs text-slate-600',
  breadcrumbItem: 'inline-flex items-center gap-1',
  breadcrumbButton:
    'bg-transparent p-0 text-slate-500 transition-colors hover:text-slate-900 focus-visible:text-slate-900',
  breadcrumbCurrent: 'font-semibold text-slate-900',
  header: 'flex items-center gap-3 border-b border-slate-200 px-5 py-4',
  title: 'm-0 flex-1 text-base font-semibold text-slate-950',
  iconButton:
    'inline-flex items-center justify-center rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900',
  content: 'flex-1 overflow-y-auto p-5',
  footer: 'border-t border-slate-200 bg-slate-50 px-5 py-4',
}

const SIZE_TO_CLASS_KEY: Record<DrawerSize, keyof CommonDrawerClassNames> = {
  sm: 'panelSm',
  md: 'panelMd',
  lg: 'panelLg',
  xl: 'panelXl',
  full: 'panelFull',
}

function joinClasses(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(' ')
}

function getPresetClassNames(cssMode: DrawerCssMode) {
  return cssMode === 'tailwind' ? TAILWIND_DRAWER_CLASS_NAMES : PURE_DRAWER_CLASS_NAMES
}

function getClassNames(
  cssMode: DrawerCssMode,
  classNames: Partial<CommonDrawerClassNames> | undefined,
) {
  return {
    ...getPresetClassNames(cssMode),
    ...classNames,
  }
}

export function createDrawerClasses(
  cssMode: DrawerCssMode,
  overrides?: Partial<CommonDrawerClassNames>,
) {
  return getClassNames(cssMode, overrides)
}

export function resolveDrawerPlacement(placement: DrawerPlacement): ResolvedDrawerPlacement {
  if (placement === 'left' || placement === 'right' || placement === 'top' || placement === 'bottom') {
    return placement
  }

  let isRtl = false
  if (typeof document !== 'undefined') {
    isRtl = window.getComputedStyle(document.documentElement).direction === 'rtl'
  }

  if (placement === 'start') {
    return isRtl ? 'right' : 'left'
  }

  return isRtl ? 'left' : 'right'
}

export interface DrawerViewProps extends CommonDrawerProps {
  handleRef?: Ref<DrawerHandle<DrawerLayer>>
}

export function DrawerView({
  handleRef,
  transitionMs = 280,
  portalTarget,
  cssMode = 'pure',
  classNames,
  placement = 'end',
  closeOnEscape = true,
  closeOnBackdrop = true,
  inertBackground = true,
  zIndex,
}: DrawerViewProps) {
  const {
    stack,
    visible,
    shouldRender,
    top,
    canGoBack,
    titleId,
    contentId,
    panelRef,
    dialogProps,
    close,
    pop,
    navigateTo,
  } = useDrawerController<DrawerLayer>(transitionMs, handleRef, { closeOnEscape })

  const rootNodeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!inertBackground || !shouldRender) {
      return
    }

    const rootNode = rootNodeRef.current
    if (!rootNode || !rootNode.parentElement) {
      return
    }

    return applyBackgroundInert(rootNode.parentElement, rootNode)
  }, [inertBackground, shouldRender])

  const resolvedClassNames = getClassNames(cssMode, classNames)
  const mountTarget = resolvePortalTarget(portalTarget)
  if (!shouldRender || !top || !mountTarget) {
    return null
  }

  const resolvedPlacement = resolveDrawerPlacement(placement)
  const sizeClassKey = SIZE_TO_CLASS_KEY[top.size ?? 'md']
  const transitionStyles = { transitionDuration: `${transitionMs}ms` }
  const rootStyles = zIndex !== undefined ? { zIndex } : undefined

  const panel = (
    <div
      ref={rootNodeRef}
      className={resolvedClassNames.root}
      data-drawer-root=""
      data-placement={resolvedPlacement}
      data-visible={String(visible)}
      style={rootStyles}
      role="presentation"
    >
      <div
        aria-hidden="true"
        className={resolvedClassNames.backdrop}
        data-drawer-backdrop=""
        data-visible={String(visible)}
        style={transitionStyles}
        onClick={closeOnBackdrop ? close : undefined}
      />

      <div
        {...dialogProps}
        ref={panelRef}
        className={joinClasses(resolvedClassNames.panel, resolvedClassNames[sizeClassKey])}
        data-drawer-panel=""
        data-placement={resolvedPlacement}
        data-size={top.size ?? 'md'}
        data-visible={String(visible)}
        style={transitionStyles}
      >
        {stack.length > 1 && (
          <nav
            className={resolvedClassNames.breadcrumb}
            data-drawer-breadcrumb=""
            aria-label="Drawer history"
          >
            {stack.map((layer, index) => {
              const isActive = index === stack.length - 1

              return (
                <span
                  key={`${layer.title}-${index}`}
                  className={resolvedClassNames.breadcrumbItem}
                  data-drawer-breadcrumb-item=""
                >
                  {index > 0 && <IconChevronLeft size={10} />}
                  {isActive ? (
                    <span
                      className={resolvedClassNames.breadcrumbCurrent}
                      data-active=""
                      aria-current="page"
                    >
                      {layer.title}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={resolvedClassNames.breadcrumbButton}
                      onClick={() => navigateTo(index)}
                    >
                      {layer.title}
                    </button>
                  )}
                </span>
              )
            })}
          </nav>
        )}

        {(top.showHeader ?? true) && (
          <div className={resolvedClassNames.header} data-drawer-header="">
            {canGoBack && (
              <button
                type="button"
                onClick={pop}
                className={resolvedClassNames.iconButton}
                data-drawer-back-btn=""
                aria-label="Go back"
              >
                <IconChevronLeft size={16} />
              </button>
            )}
            <h2 id={titleId} className={resolvedClassNames.title} data-drawer-title="">
              {top.title}
            </h2>
            <button
              type="button"
              onClick={close}
              className={resolvedClassNames.iconButton}
              data-drawer-close-btn=""
              aria-label="Close"
            >
              <IconX size={16} />
            </button>
          </div>
        )}

        <div id={contentId} className={resolvedClassNames.content} data-drawer-content="">
          {top.content}
        </div>

        {top.footer && (
          <div className={resolvedClassNames.footer} data-drawer-footer="">
            {top.footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(panel, mountTarget)
}
