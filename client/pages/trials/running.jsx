import RunningTrials from '../../src/pages/RunningTrials';
import { ProtectedPage } from '../../src/components/PageGuards';

export default function RunningTrialsPage() {
  return (
    <ProtectedPage>
      <RunningTrials />
    </ProtectedPage>
  );
}
