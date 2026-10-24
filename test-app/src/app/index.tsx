import { Redirect } from 'expo-router';
import { LoadingGate } from '../components/ui';
import { useAuth } from '../lib/AuthContext';

export default function Index() {
  const { ready, user } = useAuth();

  if (!ready) return <LoadingGate ready={false} />;

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.status === 'pending' || user.status === 'rejected') {
    return <Redirect href="/pending" />;
  }

  if (user.role === 'employer' || user.role === 'administrator') {
    return <Redirect href="/(employer)/dashboard" />;
  }

  return <Redirect href="/(employee)/home" />;
}
