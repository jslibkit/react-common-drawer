import React, { createRef } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommonDrawer, type DrawerLayer } from './Drawer'
import { createDrawerRegistry, type DrawerHandle } from './DrawerCore.shared'

const TRANSITION_MS = 280

function openDrawer(ref: React.RefObject<DrawerHandle<DrawerLayer> | null>, layer: DrawerLayer) {
  act(() => {
    ref.current?.open(layer)
  })

  act(() => {
    vi.runAllTimers()
  })
}

describe('CommonDrawer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      return window.setTimeout(() => callback(Date.now()), 0)
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((handle: number) => {
      window.clearTimeout(handle)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('fires onClose exactly once when root pop closes the drawer', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()
    const onClose = vi.fn()

    render(<CommonDrawer ref={ref} />)
    openDrawer(ref, {
      title: 'Profile',
      content: <button type="button">Save</button>,
      onClose,
    })

    act(() => {
      ref.current?.pop()
      vi.advanceTimersByTime(TRANSITION_MS)
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('keeps the latest layer after a rapid close then open', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()

    render(<CommonDrawer ref={ref} />)
    openDrawer(ref, {
      title: 'First',
      content: <button type="button">One</button>,
    })

    act(() => {
      ref.current?.close()
      ref.current?.open({
        title: 'Second',
        content: <button type="button">Two</button>,
      })
      vi.runAllTimers()
    })

    expect(screen.getByRole('dialog', { name: 'Second' })).not.toBeNull()
    expect(screen.queryByRole('dialog', { name: 'First' })).toBeNull()
  })

  it('traps focus inside the drawer and restores focus on close', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()

    render(
      <>
        <button type="button">Open trigger</button>
        <CommonDrawer ref={ref} />
      </>,
    )

    const trigger = screen.getByRole('button', { name: 'Open trigger' })
    trigger.focus()

    openDrawer(ref, {
      title: 'Focus test',
      content: <button type="button">Primary action</button>,
    })

    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)

    const primaryAction = screen.getByRole('button', { name: 'Primary action' })
    primaryAction.focus()

    act(() => {
      fireEvent.keyDown(document, { key: 'Tab' })
    })

    expect(dialog.contains(document.activeElement)).toBe(true)

    act(() => {
      ref.current?.close()
      vi.advanceTimersByTime(TRANSITION_MS)
    })

    expect(document.activeElement).toBe(trigger)
  })

  it('can be controlled through a saved registry from outside the tree', () => {
    const drawer = createDrawerRegistry<DrawerLayer>()

    render(<CommonDrawer ref={drawer.ref} />)

    act(() => {
      drawer.open({
        title: 'Registry drawer',
        content: <button type="button">Open from registry</button>,
      })
      vi.runAllTimers()
    })

    expect(screen.getByRole('dialog', { name: 'Registry drawer' })).not.toBeNull()
  })

  it('applies tailwind mode classes with animated state selectors', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()

    render(<CommonDrawer ref={ref} cssMode="tailwind" />)
    openDrawer(ref, {
      title: 'Tailwind drawer',
      content: <button type="button">Animated</button>,
    })

    const panel = screen.getByRole('dialog', { name: 'Tailwind drawer' })
    expect(panel.className).toContain('translate-x-full')
    expect(panel.className).toContain('data-[visible=true]:translate-x-0')
  })

  it('can render without a header', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()

    render(<CommonDrawer ref={ref} />)
    openDrawer(ref, {
      title: 'No header',
      showHeader: false,
      content: <button type="button">Body only</button>,
    })

    expect(screen.queryByText('No header')).toBeNull()
    expect(screen.getByText('Body only')).not.toBeNull()
  })

  it('closes on Escape by default', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()

    render(<CommonDrawer ref={ref} />)
    openDrawer(ref, { title: 'Esc', content: <button type="button">Body</button> })

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' })
      vi.advanceTimersByTime(TRANSITION_MS)
    })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('ignores Escape when closeOnEscape is false or during IME composition', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()

    const { rerender } = render(<CommonDrawer ref={ref} closeOnEscape={false} />)
    openDrawer(ref, { title: 'Esc off', content: <button type="button">Body</button> })

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' })
      vi.advanceTimersByTime(TRANSITION_MS)
    })

    expect(screen.getByRole('dialog')).not.toBeNull()

    rerender(<CommonDrawer ref={ref} />)

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape', isComposing: true })
      vi.advanceTimersByTime(TRANSITION_MS)
    })

    expect(screen.getByRole('dialog')).not.toBeNull()
  })

  it('closes on backdrop click unless closeOnBackdrop is false', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()

    const { rerender } = render(<CommonDrawer ref={ref} closeOnBackdrop={false} />)
    openDrawer(ref, { title: 'Backdrop', content: <button type="button">Body</button> })

    act(() => {
      fireEvent.click(document.querySelector('[data-drawer-backdrop]')!)
      vi.advanceTimersByTime(TRANSITION_MS)
    })

    expect(screen.getByRole('dialog')).not.toBeNull()

    rerender(<CommonDrawer ref={ref} />)

    act(() => {
      fireEvent.click(document.querySelector('[data-drawer-backdrop]')!)
      vi.advanceTimersByTime(TRANSITION_MS)
    })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('supports two pops in the same tick', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()

    render(<CommonDrawer ref={ref} />)
    openDrawer(ref, { title: 'Root', content: <span>root</span> })
    act(() => {
      ref.current?.push({ title: 'Second', content: <span>second</span> })
      ref.current?.push({ title: 'Third', content: <span>third</span> })
      vi.runAllTimers()
    })

    act(() => {
      ref.current?.pop()
      ref.current?.pop()
      vi.runAllTimers()
    })

    expect(screen.getByRole('dialog', { name: 'Root' })).not.toBeNull()
    expect(document.querySelector('[data-drawer-breadcrumb]')).toBeNull()
  })

  it('fires onClose for a popped layer and for layers removed by breadcrumb navigation', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()
    const secondClose = vi.fn()
    const thirdClose = vi.fn()

    render(<CommonDrawer ref={ref} />)
    openDrawer(ref, { title: 'Root', content: <span>root</span> })
    act(() => {
      ref.current?.push({ title: 'Second', content: <span>second</span>, onClose: secondClose })
      ref.current?.push({ title: 'Third', content: <span>third</span>, onClose: thirdClose })
      vi.runAllTimers()
    })

    act(() => {
      ref.current?.pop()
      vi.runAllTimers()
    })

    expect(thirdClose).toHaveBeenCalledTimes(1)
    expect(secondClose).not.toHaveBeenCalled()

    act(() => {
      ref.current?.push({ title: 'Third again', content: <span>third</span>, onClose: thirdClose })
      vi.runAllTimers()
    })

    // Jump back to root: both remaining upper layers are dismissed.
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Root' }))
      vi.runAllTimers()
    })

    expect(thirdClose).toHaveBeenCalledTimes(2)
    expect(secondClose).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('dialog', { name: 'Root' })).not.toBeNull()
  })

  it('renders placement on root and panel, defaulting to right in LTR', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()

    const { rerender } = render(<CommonDrawer ref={ref} />)
    openDrawer(ref, { title: 'Placement', content: <span>body</span> })

    expect(document.querySelector('[data-drawer-panel]')?.getAttribute('data-placement')).toBe('right')

    rerender(<CommonDrawer ref={ref} placement="bottom" />)
    expect(document.querySelector('[data-drawer-panel]')?.getAttribute('data-placement')).toBe('bottom')
    expect(document.querySelector('[data-drawer-root]')?.getAttribute('data-placement')).toBe('bottom')
  })

  it('marks background content inert while open and restores it after close', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()

    const { container } = render(
      <>
        <button type="button">Background</button>
        <CommonDrawer ref={ref} />
      </>,
    )

    openDrawer(ref, { title: 'Inert', content: <button type="button">Body</button> })

    // The app container (sibling of the portalled drawer root) becomes inert.
    expect(container.hasAttribute('inert')).toBe(true)

    act(() => {
      ref.current?.close()
      vi.runAllTimers()
    })

    expect(container.hasAttribute('inert')).toBe(false)
  })

  it('moves focus into the new top layer after push', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()

    render(<CommonDrawer ref={ref} />)
    openDrawer(ref, { title: 'Root', content: <button type="button">Root action</button> })

    act(() => {
      ref.current?.push({
        title: 'Child',
        content: (
          <div>
            <p>Some text first</p>
            <button type="button">Child action</button>
          </div>
        ),
      })
      vi.runAllTimers()
    })

    expect(document.activeElement?.textContent).toContain('Child action')
  })

  it('honors a layer initialFocus selector', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()

    render(<CommonDrawer ref={ref} />)
    openDrawer(ref, {
      title: 'Initial focus',
      initialFocus: '[data-autofocus]',
      content: (
        <div>
          <button type="button">First</button>
          <button type="button" data-autofocus="">
            Preferred
          </button>
        </div>
      ),
    })

    expect(document.activeElement?.textContent).toBe('Preferred')
  })

  it('compensates body padding for the scrollbar while locked', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()

    const clientWidthSpy = vi
      .spyOn(document.documentElement, 'clientWidth', 'get')
      .mockReturnValue(window.innerWidth - 17)

    render(<CommonDrawer ref={ref} />)
    openDrawer(ref, { title: 'Scroll lock', content: <span>body</span> })

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.paddingRight).toBe('17px')

    act(() => {
      ref.current?.close()
      vi.runAllTimers()
    })

    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.paddingRight).toBe('')

    clientWidthSpy.mockRestore()
  })
})
