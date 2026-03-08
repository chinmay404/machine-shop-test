import Dashboard from '../src/pages/Dashboard';
import { ProtectedPage } from '../src/components/PageGuards';

export default function HomePage() {
  return (
    <ProtectedPage>
      <Dashboard />
    </ProtectedPage>
  );
}
