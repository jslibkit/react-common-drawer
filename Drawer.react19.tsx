import React, { type Ref } from 'react'
import {
  DrawerView,
  type CommonDrawerProps as CommonDrawerBaseProps,
  type DrawerLayer,
} from './DrawerView.shared'
import { type DrawerHandle } from './DrawerCore.shared'

export {
  PURE_DRAWER_CLASS_NAMES,
  TAILWIND_DRAWER_CLASS_NAMES,
  createDrawerClasses,
  resolveDrawerPlacement,
  type CommonDrawerClassNames,
  type DrawerCssMode,
  type DrawerLayer,
  type DrawerPlacement,
  type ResolvedDrawerPlacement,
} from './DrawerView.shared'

export interface CommonDrawerProps extends CommonDrawerBaseProps {
  ref?: Ref<DrawerHandle<DrawerLayer>>
}

/**
 * React 19 entrypoint: `ref` is a regular prop (no `forwardRef`).
 */
export function CommonDrawer({ ref, ...props }: CommonDrawerProps) {
  return <DrawerView {...props} handleRef={ref} />
}
