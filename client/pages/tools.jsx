import ToolLibrary from '../src/pages/ToolLibrary';
import { ProtectedPage } from '../src/components/PageGuards';

export default function ToolsPage() {
  return (
    <ProtectedPage>
      <ToolLibrary />
    </ProtectedPage>
  );
}
