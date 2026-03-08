import { useRouter } from 'next/router';
import ToolTrialForm from '../../../src/pages/ToolTrialForm';
import { ProtectedPage } from '../../../src/components/PageGuards';

export default function EditTrialPage() {
  const router = useRouter();

  if (!router.isReady) {
    return null;
  }

  return (
    <ProtectedPage>
      <ToolTrialForm />
    </ProtectedPage>
  );
}
