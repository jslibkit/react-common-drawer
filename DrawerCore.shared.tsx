import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
  type RefCallback,
} from 'react'

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface DrawerLayerBase<TSize = DrawerSize, TMeta = unknown> {
  title: string
  content: ReactNode
  size?: TSize
  footer?: ReactNode
  showHeader?: boolean
  /**
   * Called once when this layer is dismissed for any reason:
   * popped, removed by breadcrumb navigation, replaced by `open()`,
   * or when the whole drawer closes.
   */
  onClose?: () => void
  /**
   * CSS selector resolved inside the panel. When this layer becomes the
   * top layer, focus moves to the first element matching this selector
   * (falling back to the first focusable element, then the panel itself).
   */
  initialFocus?: string
  /** Free slot for app-specific data attached to a layer. */
  meta?: TMeta
}

export interface DrawerHandle<TLayer> {
  open: (layer: TLayer) => void
  push: (layer: TLayer) => void
  pop: () => void
  close: () => void
}

export interface DrawerRegistry<TLayer> {
  ref: (handle: DrawerHandle<TLayer> | null) => void
  getHandle: () => DrawerHandle<TLayer> | null
  open: (layer: TLayer) => void
  push: (layer: TLayer) => void
  pop: () => void
  close: () => void
}

export interface DialogA11yProps {
  role: 'dialog'
  'aria-modal': true
  'aria-labelledby'?: string
  'aria-label'?: string
  'aria-describedby': string
  tabIndex: number
}

export interface DrawerControllerOptions {
  /** When false, Escape no longer pops/closes the drawer. Default true. */
  closeOnEscape?: boolean
}

export interface DrawerController<TLayer extends DrawerLayerBase<any, any>> {
  stack: TLayer[]
  visible: boolean
  shouldRender: boolean
  top: TLayer | null
  canGoBack: boolean
  titleId: string
  contentId: string
  panelRef: RefCallback<HTMLElement>
  dialogProps: DialogA11yProps
  close: () => void
  pop: () => void
  navigateTo: (index: number) => void
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

let bodyScrollLockCount = 0
let previousBodyOverflow = ''
let previousBodyPaddingRight = ''

/**
 * Escape/Tab coordination between multiple mounted drawers: only the most
 * recently opened drawer reacts to Escape and traps Tab.
 */
const activeKeyboardOwners: object[] = []

/**
 * Refcounted `inert` bookkeeping so overlapping drawers (or other callers)
 * do not clobber each other's background state.
 */
const inertRegistry = new Map<Element, { count: number; hadInert: boolean }>()

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function lockBodyScroll() {
  if (!isBrowser()) {
    return () => {}
  }

  if (bodyScrollLockCount === 0) {
    const body = document.body
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    previousBodyOverflow = body.style.overflow
    previousBodyPaddingRight = body.style.paddingRight
    body.style.overflow = 'hidden'

    if (scrollbarWidth > 0) {
      const currentPadding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0
      body.style.paddingRight = `${currentPadding + scrollbarWidth}px`
    }
  }

  bodyScrollLockCount += 1

  return () => {
    bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1)

    if (bodyScrollLockCount === 0) {
      document.body.style.overflow = previousBodyOverflow
      document.body.style.paddingRight = previousBodyPaddingRight
      previousBodyOverflow = ''
      previousBodyPaddingRight = ''
    }
  }
}

/**
 * Makes every sibling of `exclude` inside `container` inert while the drawer
 * is open, restoring previous state on release. Refcounted so multiple
 * drawers can overlap safely.
 */
export function applyBackgroundInert(container: Element, exclude: Element | null) {
  if (!isBrowser()) {
    return () => {}
  }

  const affected: Element[] = []

  for (const child of Array.from(container.children)) {
    if (child === exclude || child.tagName === 'SCRIPT' || child.tagName === 'STYLE') {
      continue
    }

    const entry = inertRegistry.get(child)
    if (entry) {
      entry.count += 1
    } else {
      inertRegistry.set(child, { count: 1, hadInert: child.hasAttribute('inert') })
      child.setAttribute('inert', '')
    }

    affected.push(child)
  }

  return () => {
    for (const child of affected) {
      const entry = inertRegistry.get(child)
      if (!entry) {
        continue
      }

      entry.count -= 1
      if (entry.count === 0) {
        inertRegistry.delete(child)
        if (!entry.hadInert) {
          child.removeAttribute('inert')
        }
      }
    }
  }
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => {
      if (element.tabIndex < 0 || element.hasAttribute('disabled')) {
        return false
      }

      if (element.getAttribute('aria-hidden') === 'true') {
        return false
      }

      if (window.getComputedStyle(element).visibility === 'hidden') {
        return false
      }

      return element.getClientRects().length > 0
    },
  )
}

function focusInitialTarget(container: HTMLElement, initialFocus?: string) {
  if (initialFocus) {
    const preferred = container.querySelector<HTMLElement>(initialFocus)
    if (preferred) {
      preferred.focus({ preventScroll: true })
      return
    }
  }

  const focusable = getFocusableElements(container)
  const target = focusable[0] ?? container
  target.focus({ preventScroll: true })
}

function trapFocusWithin(container: HTMLElement, event: KeyboardEvent) {
  const focusable = getFocusableElements(container)

  if (focusable.length === 0) {
    event.preventDefault()
    container.focus({ preventScroll: true })
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const activeElement = document.activeElement as HTMLElement | null

  if (!activeElement || !container.contains(activeElement)) {
    event.preventDefault()
    first.focus({ preventScroll: true })
    return
  }

  if (event.shiftKey && activeElement === first) {
    event.preventDefault()
    last.focus({ preventScroll: true })
    return
  }

  if (!event.shiftKey && activeElement === last) {
    event.preventDefault()
    first.focus({ preventScroll: true })
  }
}

function restoreFocus(target: HTMLElement | null) {
  if (!target || !target.isConnected) {
    return
  }

  target.focus({ preventScroll: true })
}

function getActiveElement() {
  if (!isBrowser()) {
    return null
  }

  const activeElement = document.activeElement
  return activeElement instanceof HTMLElement ? activeElement : null
}

export function useDrawerController<TLayer extends DrawerLayerBase<any, any>>(
  transitionMs: number,
  ref?: Ref<DrawerHandle<TLayer>>,
  options?: DrawerControllerOptions,
): DrawerController<TLayer> {
  const [stack, setStack] = useState<TLayer[]>([])
  const [visible, setVisible] = useState(false)
  const stackRef = useRef<TLayer[]>([])
  const visibleRef = useRef(false)
  const closingRef = useRef(false)
  const panelNodeRef = useRef<HTMLElement | null>(null)
  const timeoutIdsRef = useRef<number[]>([])
  const animationFrameIdsRef = useRef<number[]>([])
  const operationIdRef = useRef(0)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const pendingRestoreRef = useRef<HTMLElement | null>(null)
  const prevTopRef = useRef<TLayer | null>(null)
  const closeOnEscapeRef = useRef(true)
  const titleId = useId()
  const contentId = useId()

  closeOnEscapeRef.current = options?.closeOnEscape ?? true

  // stackRef/visibleRef are kept in sync SYNCHRONOUSLY (not in an effect) so
  // that sequential imperative calls in the same tick see fresh state.
  const updateStack = useCallback((next: TLayer[]) => {
    stackRef.current = next
    setStack(next)
  }, [])

  const updateVisible = useCallback((next: boolean) => {
    visibleRef.current = next
    setVisible(next)
  }, [])

  const panelRef = useCallback<RefCallback<HTMLElement>>((node) => {
    panelNodeRef.current = node
  }, [])

  const clearScheduledWork = useCallback(() => {
    if (!isBrowser()) {
      timeoutIdsRef.current = []
      animationFrameIdsRef.current = []
      return
    }

    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    animationFrameIdsRef.current.forEach((frameId) => window.cancelAnimationFrame(frameId))
    timeoutIdsRef.current = []
    animationFrameIdsRef.current = []
  }, [])

  const beginOperation = useCallback(() => {
    clearScheduledWork()
    operationIdRef.current += 1
    return operationIdRef.current
  }, [clearScheduledWork])

  const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((id) => id !== timeoutId)
      callback()
    }, delay)

    timeoutIdsRef.current.push(timeoutId)
  }, [])

  const scheduleAnimationFrame = useCallback((callback: FrameRequestCallback) => {
    const frameId = window.requestAnimationFrame((time) => {
      animationFrameIdsRef.current = animationFrameIdsRef.current.filter((id) => id !== frameId)
      callback(time)
    })

    animationFrameIdsRef.current.push(frameId)
  }, [])

  /** Fires onClose for every layer in `layers`, top-most first. */
  const dismissLayers = useCallback((layers: TLayer[]) => {
    for (let index = layers.length - 1; index >= 0; index -= 1) {
      layers[index].onClose?.()
    }
  }, [])

  const revealPanel = useCallback(
    (operationId: number) => {
      if (!isBrowser()) {
        updateVisible(true)
        return
      }

      scheduleAnimationFrame(() => {
        scheduleAnimationFrame(() => {
          if (operationId !== operationIdRef.current) {
            return
          }

          updateVisible(true)

          scheduleAnimationFrame(() => {
            if (operationId !== operationIdRef.current) {
              return
            }

            const panel = panelNodeRef.current
            if (panel) {
              const topLayer = stackRef.current[stackRef.current.length - 1]
              focusInitialTarget(panel, topLayer?.initialFocus)
            }
          })
        })
      })
    },
    [scheduleAnimationFrame, updateVisible],
  )

  const finalizeClose = useCallback(
    (layers: TLayer[]) => {
      closingRef.current = false
      // Focus is restored from an effect AFTER the closed drawer commits, so
      // that background `inert` has already been lifted by then.
      pendingRestoreRef.current = restoreFocusRef.current
      restoreFocusRef.current = null
      updateStack([])
      dismissLayers(layers)
    },
    [dismissLayers, updateStack],
  )

  const close = useCallback(() => {
    if (closingRef.current || stackRef.current.length === 0) {
      return
    }

    const layers = stackRef.current
    const operationId = beginOperation()
    closingRef.current = true
    updateVisible(false)

    if (!isBrowser()) {
      finalizeClose(layers)
      return
    }

    scheduleTimeout(() => {
      if (operationId !== operationIdRef.current) {
        return
      }

      finalizeClose(layers)
    }, transitionMs)
  }, [beginOperation, finalizeClose, scheduleTimeout, transitionMs, updateVisible])

  /**
   * Reopens with `nextStack` while a close transition is in flight: the old
   * layers are considered dismissed, the original focus-restore target is
   * kept, and the panel is revealed again.
   */
  const reopenDuringClose = useCallback(
    (nextStack: TLayer[]) => {
      const previousLayers = stackRef.current
      const operationId = beginOperation()
      closingRef.current = false
      dismissLayers(previousLayers)
      updateStack(nextStack)
      revealPanel(operationId)
    },
    [beginOperation, dismissLayers, revealPanel, updateStack],
  )

  const open = useCallback(
    (layer: TLayer) => {
      const currentStack = stackRef.current

      if (currentStack.length === 0) {
        const operationId = beginOperation()
        restoreFocusRef.current = getActiveElement()
        updateStack([layer])
        revealPanel(operationId)
        return
      }

      if (closingRef.current) {
        reopenDuringClose([layer])
        return
      }

      // Drawer is open: animate half-way out, swap the stack, animate back in.
      const operationId = beginOperation()
      updateVisible(false)

      if (!isBrowser()) {
        dismissLayers(currentStack)
        updateStack([layer])
        updateVisible(true)
        return
      }

      scheduleTimeout(() => {
        if (operationId !== operationIdRef.current) {
          return
        }

        dismissLayers(currentStack)
        updateStack([layer])
        revealPanel(operationId)
      }, Math.round(transitionMs / 2))
    },
    [
      beginOperation,
      dismissLayers,
      reopenDuringClose,
      revealPanel,
      scheduleTimeout,
      transitionMs,
      updateStack,
      updateVisible,
    ],
  )

  const push = useCallback(
    (layer: TLayer) => {
      const currentStack = stackRef.current

      if (currentStack.length === 0) {
        const operationId = beginOperation()
        restoreFocusRef.current = getActiveElement()
        updateStack([layer])
        revealPanel(operationId)
        return
      }

      if (closingRef.current) {
        reopenDuringClose([layer])
        return
      }

      if (!visibleRef.current) {
        // The panel is mid-reveal (or mid-replace). Restart the reveal so the
        // drawer cannot end up mounted but invisible.
        const operationId = beginOperation()
        updateStack([...currentStack, layer])
        revealPanel(operationId)
        return
      }

      updateStack([...currentStack, layer])
    },
    [beginOperation, reopenDuringClose, revealPanel, updateStack],
  )

  const pop = useCallback(() => {
    if (closingRef.current) {
      return
    }

    const currentStack = stackRef.current

    if (currentStack.length <= 1) {
      close()
      return
    }

    const popped = currentStack[currentStack.length - 1]
    updateStack(currentStack.slice(0, -1))
    popped.onClose?.()
  }, [close, updateStack])

  const navigateTo = useCallback(
    (index: number) => {
      if (closingRef.current) {
        return
      }

      const currentStack = stackRef.current
      if (index < 0 || index >= currentStack.length - 1) {
        return
      }

      const removed = currentStack.slice(index + 1)
      updateStack(currentStack.slice(0, index + 1))
      dismissLayers(removed)
    },
    [dismissLayers, updateStack],
  )

  useImperativeHandle(
    ref,
    () => ({
      open,
      push,
      pop,
      close,
    }),
    [open, push, pop, close],
  )

  const isOpen = stack.length > 0

  useEffect(() => {
    if (!isBrowser() || !isOpen) {
      return
    }

    const keyboardOwner = {}
    activeKeyboardOwners.push(keyboardOwner)

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only the top-most open drawer responds to keyboard events.
      if (activeKeyboardOwners[activeKeyboardOwners.length - 1] !== keyboardOwner) {
        return
      }

      if (event.key === 'Escape') {
        if (!closeOnEscapeRef.current || event.defaultPrevented || event.isComposing) {
          return
        }

        event.preventDefault()
        pop()
        return
      }

      if (event.key === 'Tab' && panelNodeRef.current) {
        trapFocusWithin(panelNodeRef.current, event)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      const ownerIndex = activeKeyboardOwners.indexOf(keyboardOwner)
      if (ownerIndex >= 0) {
        activeKeyboardOwners.splice(ownerIndex, 1)
      }
    }
  }, [isOpen, pop])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    return lockBodyScroll()
  }, [isOpen])

  // Runs after the "drawer closed" commit: every effect cleanup (including
  // background inert removal) has run by the time this setup executes.
  useEffect(() => {
    if (isOpen || !pendingRestoreRef.current) {
      return
    }

    restoreFocus(pendingRestoreRef.current)
    pendingRestoreRef.current = null
  }, [isOpen])

  const top = stack[stack.length - 1] ?? null

  // Move focus into the newly revealed top layer after push/pop/navigateTo.
  // (The initial open is handled by revealPanel.)
  useEffect(() => {
    const previousTop = prevTopRef.current
    prevTopRef.current = top

    if (!isBrowser() || !top || previousTop === null || previousTop === top) {
      return
    }

    if (!visibleRef.current) {
      return
    }

    const panel = panelNodeRef.current
    if (panel) {
      focusInitialTarget(panel, top.initialFocus)
    }
  }, [top])

  useEffect(() => {
    return () => {
      operationIdRef.current += 1
      clearScheduledWork()
      // Unmounting while open: put focus back where it came from. Deferred a
      // microtask so it runs after the whole unmount commit (and after any
      // background `inert` has been removed).
      const target = restoreFocusRef.current
      restoreFocusRef.current = null
      if (target && isBrowser()) {
        queueMicrotask(() => restoreFocus(target))
      }
    }
  }, [clearScheduledWork])

  const headerShown = top ? (top.showHeader ?? true) : true

  return {
    stack,
    visible,
    shouldRender: stack.length > 0 || visible,
    top,
    canGoBack: stack.length > 1,
    titleId,
    contentId,
    panelRef,
    dialogProps: {
      role: 'dialog',
      'aria-modal': true,
      // With a hidden header the title element does not exist, so labelling
      // falls back to aria-label instead of a dangling aria-labelledby id.
      ...(headerShown ? { 'aria-labelledby': titleId } : { 'aria-label': top?.title }),
      'aria-describedby': contentId,
      tabIndex: -1,
    },
    close,
    pop,
    navigateTo,
  }
}

export function resolvePortalTarget(target?: Element | null) {
  if (target) {
    return target
  }

  if (!isBrowser()) {
    return null
  }

  return document.body
}

export function createDrawerRegistry<TLayer>(): DrawerRegistry<TLayer> {
  let handle: DrawerHandle<TLayer> | null = null

  return {
    ref(nextHandle) {
      handle = nextHandle
    },
    getHandle() {
      return handle
    },
    open(layer) {
      handle?.open(layer)
    },
    push(layer) {
      handle?.push(layer)
    },
    pop() {
      handle?.pop()
    },
    close() {
      handle?.close()
    },
  }
}
