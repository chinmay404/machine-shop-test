import Login from '../src/pages/Login';
import { PublicOnlyPage } from '../src/components/PageGuards';

export default function LoginPage() {
  return (
    <PublicOnlyPage>
      <Login />
    </PublicOnlyPage>
  );
}
