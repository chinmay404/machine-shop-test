import { ProtectedRedirect } from '../src/components/PageGuards';

export default function PlanningPage() {
  return <ProtectedRedirect to="/kanban" />;
}
