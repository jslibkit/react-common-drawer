import React, { type Ref } from 'react'
import { createPortal } from 'react-dom'
import {
  resolvePortalTarget,
  useDrawerController,
  type DrawerHandle,
  type DrawerLayerBase,
  type DrawerSize,
} from './DrawerCore.shared'

function IconChevronLeft({ size = 16 }: { size?: number }) {
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

function IconX({ size = 16 }: { size?: number }) {
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
  ref?: Ref<DrawerHandle<DrawerLayer>>
  transitionMs?: number
  portalTarget?: Element | null
  cssMode?: DrawerCssMode
  classNames?: Partial<CommonDrawerClassNames>
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
  root: 'fixed inset-0 z-[1000] flex items-stretch justify-end',
  backdrop: 'absolute inset-0 bg-slate-950/45 backdrop-blur-sm opacity-0 transition-opacity ease-out data-[visible=true]:opacity-100',
  panel: 'relative z-10 flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl outline-none translate-x-full transition-transform ease-out data-[visible=true]:translate-x-0',
  panelSm: 'max-w-[380px]',
  panelMd: 'max-w-[480px]',
  panelLg: 'max-w-[600px]',
  panelXl: 'max-w-[760px]',
  panelFull: 'max-w-full',
  breadcrumb: 'flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-5 py-2 text-xs text-slate-600',
  breadcrumbItem: 'inline-flex items-center gap-1',
  breadcrumbButton: 'bg-transparent p-0 text-slate-500 transition-colors hover:text-slate-900 focus-visible:text-slate-900',
  breadcrumbCurrent: 'font-semibold text-slate-900',
  header: 'flex items-center gap-3 border-b border-slate-200 px-5 py-4',
  title: 'm-0 flex-1 text-base font-semibold text-slate-950',
  iconButton: 'inline-flex items-center justify-center rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900',
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

export function CommonDrawer({
  ref,
  transitionMs = 280,
  portalTarget,
  cssMode = 'pure',
  classNames,
}: CommonDrawerProps) {
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
  } = useDrawerController<DrawerLayer>(transitionMs, ref)

  const resolvedClassNames = getClassNames(cssMode, classNames)
  const mountTarget = resolvePortalTarget(portalTarget)
  if (!shouldRender || !top || !mountTarget) {
    return null
  }

  const sizeClassKey = SIZE_TO_CLASS_KEY[top.size ?? 'md']
  const transitionStyles = { transitionDuration: `${transitionMs}ms` }

  const panel = (
    <div
      className={resolvedClassNames.root}
      data-drawer-root=""
      data-visible={String(visible)}
      role="presentation"
    >
      <div
        aria-hidden="true"
        className={resolvedClassNames.backdrop}
        data-drawer-backdrop=""
        data-visible={String(visible)}
        style={transitionStyles}
        onClick={close}
      />

      <div
        {...dialogProps}
        ref={panelRef}
        className={joinClasses(resolvedClassNames.panel, resolvedClassNames[sizeClassKey])}
        data-drawer-panel=""
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
