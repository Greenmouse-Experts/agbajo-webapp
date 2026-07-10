import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/contributor/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/contributor/settings"!</div>
}
