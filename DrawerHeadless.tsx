import React, { forwardRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  resolvePortalTarget,
  useDrawerController,
  type DialogA11yProps,
  type DrawerHandle,
  type DrawerLayerBase,
} from './DrawerCore.shared'

export interface HeadlessDrawerLayer extends DrawerLayerBase<string> {}

export interface BackdropRenderProps {
  visible: boolean
  onClick: () => void
  transitionMs: number
}

export interface PanelRenderProps {
  visible: boolean
  layer: HeadlessDrawerLayer
  transitionMs: number
  children: ReactNode
  panelRef: (node: HTMLElement | null) => void
  dialogProps: DialogA11yProps
}

export interface HeaderRenderProps {
  title: string
  titleId: string
  canGoBack: boolean
  onBack: () => void
  onClose: () => void
  BackIcon: ReactNode
  CloseIcon: ReactNode
}

export interface BreadcrumbRenderProps {
  stack: HeadlessDrawerLayer[]
  onNavigateTo: (index: number) => void
  BreadcrumbSeparator: ReactNode
}

export interface FooterRenderProps {
  footer: ReactNode
}

export interface ContentRenderProps {
  content: ReactNode
  contentId: string
}

export interface HeadlessDrawerProps {
  transitionMs?: number
  renderBackdrop?: (props: BackdropRenderProps) => ReactNode
  renderPanel?: (props: PanelRenderProps) => ReactNode
  renderHeader?: (props: HeaderRenderProps) => ReactNode
  renderBreadcrumb?: (props: BreadcrumbRenderProps) => ReactNode
  renderFooter?: (props: FooterRenderProps) => ReactNode
  renderContent?: (props: ContentRenderProps) => ReactNode
  BackIcon?: ReactNode
  CloseIcon?: ReactNode
  BreadcrumbSeparator?: ReactNode
  portalTarget?: Element | null
}

const DefaultBackIcon = (
  <svg
    width={16}
    height={16}
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

const DefaultCloseIcon = (
  <svg
    width={16}
    height={16}
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

const DefaultBreadcrumbSeparator = (
  <svg
    width={10}
    height={10}
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

function DefaultBackdrop({ visible, onClick, transitionMs }: BackdropRenderProps) {
  return (
    <div
      data-drawer-backdrop=""
      data-visible={String(visible)}
      aria-hidden="true"
      style={{ transition: `opacity ${transitionMs}ms` }}
      onClick={onClick}
    />
  )
}

function DefaultPanel({
  visible,
  layer,
  transitionMs,
  children,
  panelRef,
  dialogProps,
}: PanelRenderProps) {
  return (
    <div
      {...dialogProps}
      ref={panelRef}
      data-drawer-panel=""
      data-size={layer.size ?? 'md'}
      data-visible={String(visible)}
      style={{ transition: `translate ${transitionMs}ms` }}
    >
      {children}
    </div>
  )
}

function DefaultHeader({
  title,
  titleId,
  canGoBack,
  onBack,
  onClose,
  BackIcon,
  CloseIcon,
}: HeaderRenderProps) {
  return (
    <div data-drawer-header="">
      {canGoBack && (
        <button type="button" onClick={onBack} data-drawer-back-btn="" aria-label="Go back">
          {BackIcon}
        </button>
      )}
      <h2 id={titleId} data-drawer-title="">
        {title}
      </h2>
      <button type="button" onClick={onClose} data-drawer-close-btn="" aria-label="Close">
        {CloseIcon}
      </button>
    </div>
  )
}

function DefaultBreadcrumb({
  stack,
  onNavigateTo,
  BreadcrumbSeparator,
}: BreadcrumbRenderProps) {
  return (
    <nav data-drawer-breadcrumb="" aria-label="Drawer history">
      {stack.map((layer, index) => {
        const isActive = index === stack.length - 1

        return (
          <span
            key={`${layer.title}-${index}`}
            data-drawer-breadcrumb-item=""
            {...(isActive ? { 'aria-current': 'page' } : {})}
          >
            {index > 0 && BreadcrumbSeparator}
            {isActive ? (
              <span data-active="">{layer.title}</span>
            ) : (
              <button type="button" onClick={() => onNavigateTo(index)}>
                {layer.title}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}

function DefaultFooter({ footer }: FooterRenderProps) {
  return <div data-drawer-footer="">{footer}</div>
}

function DefaultContent({ content, contentId }: ContentRenderProps) {
  return <div id={contentId} data-drawer-content="">{content}</div>
}

export const HeadlessDrawer = forwardRef<DrawerHandle<HeadlessDrawerLayer>, HeadlessDrawerProps>(
  function HeadlessDrawer(
    {
      transitionMs = 280,
      renderBackdrop,
      renderPanel,
      renderHeader,
      renderBreadcrumb,
      renderFooter,
      renderContent,
      BackIcon = DefaultBackIcon,
      CloseIcon = DefaultCloseIcon,
      BreadcrumbSeparator = DefaultBreadcrumbSeparator,
      portalTarget,
    },
    ref,
  ) {
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
    } = useDrawerController<HeadlessDrawerLayer>(transitionMs, ref)

    const mountTarget = resolvePortalTarget(portalTarget)
    if (!shouldRender || !top || !mountTarget) {
      return null
    }

    const backdropElement = renderBackdrop
      ? renderBackdrop({ visible, onClick: close, transitionMs })
      : <DefaultBackdrop visible={visible} onClick={close} transitionMs={transitionMs} />

    const headerElement = renderHeader
      ? renderHeader({
          title: top.title,
          titleId,
          canGoBack,
          onBack: pop,
          onClose: close,
          BackIcon,
          CloseIcon,
        })
      : (
          <DefaultHeader
            title={top.title}
            titleId={titleId}
            canGoBack={canGoBack}
            onBack={pop}
            onClose={close}
            BackIcon={BackIcon}
            CloseIcon={CloseIcon}
          />
        )

    const breadcrumbElement = stack.length > 1
      ? (
          renderBreadcrumb
            ? renderBreadcrumb({
                stack,
                onNavigateTo: navigateTo,
                BreadcrumbSeparator,
              })
            : (
                <DefaultBreadcrumb
                  stack={stack}
                  onNavigateTo={navigateTo}
                  BreadcrumbSeparator={BreadcrumbSeparator}
                />
              )
        )
      : null

    const contentElement = renderContent
      ? renderContent({ content: top.content, contentId })
      : <DefaultContent content={top.content} contentId={contentId} />

    const footerElement = top.footer
      ? renderFooter
        ? renderFooter({ footer: top.footer })
        : <DefaultFooter footer={top.footer} />
      : null

    const panelChildren = (
      <>
        {breadcrumbElement}
        {headerElement}
        {contentElement}
        {footerElement}
      </>
    )

    const panelElement = renderPanel
      ? renderPanel({
          visible,
          layer: top,
          transitionMs,
          children: panelChildren,
          panelRef,
          dialogProps,
        })
      : (
          <DefaultPanel
            visible={visible}
            layer={top}
            transitionMs={transitionMs}
            panelRef={panelRef}
            dialogProps={dialogProps}
          >
            {panelChildren}
          </DefaultPanel>
        )

    return createPortal(
      <div data-drawer-root="">{backdropElement}{panelElement}</div>,
      mountTarget,
    )
  },
)
