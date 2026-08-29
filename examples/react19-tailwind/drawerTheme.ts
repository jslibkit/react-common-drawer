import { createDrawerClasses } from '@jslibkit/react-common-drawer'

export const drawerTheme = createDrawerClasses('tailwind', {
  panelMd: 'max-w-[560px]',
  panel: 'relative z-10 flex h-full w-full flex-col overflow-hidden bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] outline-none translate-x-full transition-transform ease-out data-[visible=true]:translate-x-0',
  breadcrumb: 'flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-6 py-3 text-xs text-slate-500',
  header: 'flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4',
  content: 'flex-1 overflow-y-auto bg-slate-50 px-6 py-6',
  footer: 'border-t border-slate-200 bg-white px-6 py-4',
})
