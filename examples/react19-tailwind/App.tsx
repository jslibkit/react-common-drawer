import { CommonDrawer } from '@jslibkit/react-common-drawer/react19'
import { drawer } from './drawerRegistry'
import { drawerTheme } from './drawerTheme'

function BillingPanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="font-medium text-slate-900">Current plan</p>
        <p className="text-sm text-slate-600">Pro monthly</p>
      </div>
      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="font-medium text-slate-900">Payment method</p>
        <p className="text-sm text-slate-600">Visa ending in 4242</p>
      </div>
    </div>
  )
}

export function App() {
  return (
    <>
      <button
        type="button"
        className="rounded-xl bg-slate-900 px-4 py-2 text-white"
        onClick={() => {
          drawer.open({
            title: 'Billing',
            size: 'md',
            content: <BillingPanel />,
            footer: (
              <div className="flex justify-end gap-2">
                <button type="button" className="rounded-xl border border-slate-300 px-4 py-2">Close</button>
                <button type="button" className="rounded-xl bg-slate-900 px-4 py-2 text-white">Update</button>
              </div>
            ),
          })
        }}
      >
        Open billing drawer
      </button>

      <CommonDrawer ref={drawer.ref} cssMode="tailwind" classNames={drawerTheme} />
    </>
  )
}
