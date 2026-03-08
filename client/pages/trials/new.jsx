import ToolTrialForm from '../../src/pages/ToolTrialForm';
import { ProtectedPage } from '../../src/components/PageGuards';

export default function NewTrialPage() {
  return (
    <ProtectedPage>
      <ToolTrialForm />
    </ProtectedPage>
  );
}
