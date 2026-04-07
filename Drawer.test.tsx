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
})
