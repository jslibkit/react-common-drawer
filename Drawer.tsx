import React, { forwardRef } from 'react'
import { DrawerView, type CommonDrawerProps, type DrawerLayer } from './DrawerView.shared'
import { type DrawerHandle } from './DrawerCore.shared'

export {
  PURE_DRAWER_CLASS_NAMES,
  TAILWIND_DRAWER_CLASS_NAMES,
  createDrawerClasses,
  resolveDrawerPlacement,
  type CommonDrawerClassNames,
  type CommonDrawerProps,
  type DrawerCssMode,
  type DrawerLayer,
  type DrawerPlacement,
  type ResolvedDrawerPlacement,
} from './DrawerView.shared'

/**
 * React 18 entrypoint: the imperative handle is attached through `forwardRef`.
 */
export const CommonDrawer = forwardRef<DrawerHandle<DrawerLayer>, CommonDrawerProps>(
  function CommonDrawer(props, ref) {
    return <DrawerView {...props} handleRef={ref} />
  },
)
