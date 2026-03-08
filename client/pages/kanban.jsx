import KanbanStore from '../src/pages/KanbanStore';
import { ProtectedPage } from '../src/components/PageGuards';

export default function KanbanPage() {
  return (
    <ProtectedPage>
      <KanbanStore />
    </ProtectedPage>
  );
}
