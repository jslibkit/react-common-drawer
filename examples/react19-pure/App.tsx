import '@jslibkit/react-common-drawer/drawer.css'
import { CommonDrawer } from '@jslibkit/react-common-drawer/react19'
import { drawer } from './drawerRegistry'

function MediaPreview() {
  return (
    <div className="grid gap-4">
      <div className="aspect-video rounded-xl border bg-slate-100" />
      <p className="text-sm text-slate-600">This example hides the header completely.</p>
    </div>
  )
}

export function App() {
  return (
    <>
      <button
        type="button"
        onClick={() => {
          drawer.open({
            title: 'Preview',
            showHeader: false,
            size: 'xl',
            content: <MediaPreview />,
          })
        }}
      >
        Open preview
      </button>

      <CommonDrawer ref={drawer.ref} cssMode="pure" />
    </>
  )
}
