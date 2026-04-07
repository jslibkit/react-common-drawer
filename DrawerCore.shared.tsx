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

export interface DrawerLayerBase<TSize = DrawerSize> {
  title: string
  content: ReactNode
  size?: TSize
  footer?: ReactNode
  showHeader?: boolean
  onClose?: () => void
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
  'aria-labelledby': string
  'aria-describedby': string
  tabIndex: number
}

export interface DrawerController<TLayer extends DrawerLayerBase<any>> {
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

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function lockBodyScroll() {
  if (!isBrowser()) {
    return () => {}
  }

  if (bodyScrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }

  bodyScrollLockCount += 1

  return () => {
    bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1)

    if (bodyScrollLockCount === 0) {
      document.body.style.overflow = previousBodyOverflow
      previousBodyOverflow = ''
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

function focusInitialTarget(container: HTMLElement) {
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

export function useDrawerController<TLayer extends DrawerLayerBase<any>>(
  transitionMs: number,
  ref?: Ref<DrawerHandle<TLayer>>,
): DrawerController<TLayer> {
  const [stack, setStack] = useState<TLayer[]>([])
  const [visible, setVisible] = useState(false)
  const stackRef = useRef<TLayer[]>([])
  const panelNodeRef = useRef<HTMLElement | null>(null)
  const timeoutIdsRef = useRef<number[]>([])
  const animationFrameIdsRef = useRef<number[]>([])
  const operationIdRef = useRef(0)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const contentId = useId()

  useEffect(() => {
    stackRef.current = stack
  }, [stack])

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

  const revealPanel = useCallback(
    (operationId: number) => {
      if (!isBrowser()) {
        setVisible(true)
        return
      }

      scheduleAnimationFrame(() => {
        scheduleAnimationFrame(() => {
          if (operationId !== operationIdRef.current) {
            return
          }

          setVisible(true)

          scheduleAnimationFrame(() => {
            if (operationId !== operationIdRef.current) {
              return
            }

            const panel = panelNodeRef.current
            if (panel) {
              focusInitialTarget(panel)
            }
          })
        })
      })
    },
    [scheduleAnimationFrame],
  )

  const closeLayer = useCallback(
    (layer: TLayer | null | undefined) => {
      const operationId = beginOperation()
      setVisible(false)

      if (!isBrowser()) {
        setStack([])
        layer?.onClose?.()
        restoreFocus(restoreFocusRef.current)
        restoreFocusRef.current = null
        return
      }

      scheduleTimeout(() => {
        if (operationId !== operationIdRef.current) {
          return
        }

        setStack([])
        layer?.onClose?.()
        restoreFocus(restoreFocusRef.current)
        restoreFocusRef.current = null
      }, transitionMs)
    },
    [beginOperation, scheduleTimeout, transitionMs],
  )

  const open = useCallback(
    (layer: TLayer) => {
      const operationId = beginOperation()
      const wasClosed = stackRef.current.length === 0

      if (wasClosed) {
        restoreFocusRef.current = getActiveElement()
        setStack([layer])
        revealPanel(operationId)
        return
      }

      setVisible(false)
      scheduleTimeout(() => {
        if (operationId !== operationIdRef.current) {
          return
        }

        setStack([layer])
        revealPanel(operationId)
      }, Math.round(transitionMs / 2))
    },
    [beginOperation, revealPanel, scheduleTimeout, transitionMs],
  )

  const push = useCallback(
    (layer: TLayer) => {
      const operationId = beginOperation()

      if (stackRef.current.length === 0) {
        restoreFocusRef.current = getActiveElement()
        setStack([layer])
        revealPanel(operationId)
        return
      }

      setStack((currentStack) => [...currentStack, layer])
    },
    [beginOperation, revealPanel],
  )

  const pop = useCallback(() => {
    const currentStack = stackRef.current

    if (currentStack.length <= 1) {
      closeLayer(currentStack[0])
      return
    }

    beginOperation()
    setStack(currentStack.slice(0, -1))
  }, [beginOperation, closeLayer])

  const close = useCallback(() => {
    const currentStack = stackRef.current
    closeLayer(currentStack[currentStack.length - 1])
  }, [closeLayer])

  const navigateTo = useCallback(
    (index: number) => {
      const currentStack = stackRef.current
      if (index < 0 || index >= currentStack.length - 1) {
        return
      }

      beginOperation()
      setStack(currentStack.slice(0, index + 1))
    },
    [beginOperation],
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

  useEffect(() => {
    if (!isBrowser() || stack.length === 0) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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
    }
  }, [stack.length, pop])

  useEffect(() => {
    if (stack.length === 0) {
      return
    }

    return lockBodyScroll()
  }, [stack.length])

  useEffect(() => {
    return () => {
      operationIdRef.current += 1
      clearScheduledWork()
    }
  }, [clearScheduledWork])

  const top = stack[stack.length - 1] ?? null

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
      'aria-labelledby': titleId,
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
