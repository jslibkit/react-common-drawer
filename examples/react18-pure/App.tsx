import '@jslibkit/react-common-drawer/drawer.css'
import { CommonDrawer } from '@jslibkit/react-common-drawer/react18'
import { drawer } from './drawerRegistry'

function ProfileForm() {
  return (
    <form className="grid gap-4">
      <label className="grid gap-1">
        <span>Name</span>
        <input className="border px-3 py-2" defaultValue="Ankit" />
      </label>
      <label className="grid gap-1">
        <span>Email</span>
        <input className="border px-3 py-2" defaultValue="ankit@example.com" />
      </label>
    </form>
  )
}

function SaveActions() {
  return (
    <div className="flex justify-end gap-2">
      <button type="button">Cancel</button>
      <button type="button">Save</button>
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
            title: 'Edit profile',
            size: 'lg',
            content: <ProfileForm />,
            footer: <SaveActions />,
          })
        }}
      >
        Open drawer
      </button>

      <CommonDrawer ref={drawer.ref} cssMode="pure" />
    </>
  )
}
