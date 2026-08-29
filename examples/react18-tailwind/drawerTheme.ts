import { createDrawerClasses } from '@jslibkit/react-common-drawer'

export const drawerTheme = createDrawerClasses('tailwind', {
  panelLg: 'max-w-3xl',
  header: 'flex items-center gap-3 border-b border-slate-200 px-6 py-5',
  title: 'm-0 flex-1 text-lg font-semibold text-slate-950',
  content: 'flex-1 overflow-y-auto px-6 py-5',
  footer: 'border-t border-slate-200 bg-slate-50 px-6 py-4',
})
