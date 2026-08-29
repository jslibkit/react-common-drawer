// Regression tests for bugs found (and fixed) in v1.0.2.
// Each test asserts the CORRECT behaviour and passes on the fixed code.
import React, { createRef } from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommonDrawer, type DrawerLayer } from './Drawer'
import { type DrawerHandle } from './DrawerCore.shared'

const TRANSITION_MS = 280

describe('v1.0.2 bug regressions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      return window.setTimeout(() => cb(Date.now()), 0)
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((h: number) => {
      window.clearTimeout(h)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  // v1.0.2: stackRef was only synced to state in a useEffect, so a push() in
  // the same tick as open() saw a stale empty stack and replaced instead of
  // stacking.
  it('BUG 1: open() then push() in the same tick produces a 2-layer stack', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()
    render(<CommonDrawer ref={ref} />)

    act(() => {
      ref.current?.open({ title: 'Root', content: <span>root</span> })
      ref.current?.push({ title: 'Child', content: <span>child</span> })
      vi.runAllTimers()
    })

    expect(document.querySelector('[data-drawer-breadcrumb]')).not.toBeNull()
    expect(document.querySelector('[data-drawer-title]')?.textContent).toBe('Child')
  })

  // v1.0.2: push() during the close transition cancelled the pending
  // stack-clear timeout, appended to the old stack, and never re-revealed the
  // panel — leaving an invisible full-screen overlay that blocked all clicks.
  it('BUG 2: push() while the drawer is closing reopens it visibly', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()
    render(<CommonDrawer ref={ref} />)

    act(() => {
      ref.current?.open({ title: 'Root', content: <span>root</span> })
      vi.runAllTimers()
    })

    act(() => {
      ref.current?.close()
    })

    act(() => {
      vi.advanceTimersByTime(100) // mid close-transition
      ref.current?.push({ title: 'New', content: <span>new</span> })
      vi.runAllTimers()
    })

    const panel = document.querySelector('[data-drawer-panel]')
    expect(panel?.getAttribute('data-visible')).toBe('true')
    expect(document.querySelector('[data-drawer-title]')?.textContent).toBe('New')
  })

  // v1.0.2: with showHeader:false the title element did not exist but
  // aria-labelledby still pointed at its id, so the dialog had no accessible
  // name. Now it falls back to aria-label.
  it('BUG 3: showHeader:false still gives the dialog an accessible name', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()
    render(<CommonDrawer ref={ref} />)

    act(() => {
      ref.current?.open({ title: 'Preview', showHeader: false, content: <span>body</span> })
      vi.runAllTimers()
    })

    const dialog = screen.getByRole('dialog', { name: 'Preview' })
    expect(dialog.getAttribute('aria-labelledby')).toBeNull()
    expect(dialog.getAttribute('aria-label')).toBe('Preview')
  })

  // v1.0.2: only the top layer's onClose fired when the drawer closed; layers
  // beneath it never heard they were dismissed.
  it('BUG 4: closing a stacked drawer fires onClose for every layer', () => {
    const ref = createRef<DrawerHandle<DrawerLayer>>()
    const rootClose = vi.fn()
    const childClose = vi.fn()
    render(<CommonDrawer ref={ref} />)

    act(() => {
      ref.current?.open({ title: 'Root', content: <span>root</span>, onClose: rootClose })
      vi.runAllTimers()
    })
    act(() => {
      ref.current?.push({ title: 'Child', content: <span>child</span>, onClose: childClose })
      vi.runAllTimers()
    })
    act(() => {
      ref.current?.close()
      vi.advanceTimersByTime(TRANSITION_MS)
    })

    expect(childClose).toHaveBeenCalledTimes(1)
    expect(rootClose).toHaveBeenCalledTimes(1)
  })
})
