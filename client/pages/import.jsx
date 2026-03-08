import MasterImport from '../src/pages/MasterImport';
import { ProtectedPage } from '../src/components/PageGuards';

export default function ImportPage() {
  return (
    <ProtectedPage>
      <MasterImport />
    </ProtectedPage>
  );
}
