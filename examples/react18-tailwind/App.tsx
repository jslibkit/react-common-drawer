import { CommonDrawer } from '@jslibkit/common-drawer/react18'
import { drawer } from './drawerRegistry'
import { drawerTheme } from './drawerTheme'

function TeamView() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Open a nested layer from inside the drawer.</p>
      <button
        type="button"
        className="rounded-lg bg-slate-900 px-4 py-2 text-white"
        onClick={() => {
          drawer.push({
            title: 'Invite member',
            content: (
              <div className="space-y-3">
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Email address" />
                <select className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option>Admin</option>
                  <option>Editor</option>
                  <option>Viewer</option>
                </select>
              </div>
            ),
            footer: (
              <div className="flex justify-end gap-2">
                <button type="button" className="rounded-lg border border-slate-300 px-4 py-2">Cancel</button>
                <button type="button" className="rounded-lg bg-slate-900 px-4 py-2 text-white">Invite</button>
              </div>
            ),
          })
        }}
      >
        Invite member
      </button>
    </div>
  )
}

export function App() {
  return (
    <>
      <button
        type="button"
        className="rounded-lg bg-slate-900 px-4 py-2 text-white"
        onClick={() => {
          drawer.open({
            title: 'Team settings',
            size: 'lg',
            content: <TeamView />,
          })
        }}
      >
        Open drawer
      </button>

      <CommonDrawer ref={drawer.ref} cssMode="tailwind" theme={drawerTheme} />
    </>
  )
}
