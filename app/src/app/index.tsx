import { Redirect } from 'expo-router';

import { useAuth } from '@/context/auth-context';

export default function IndexRoute() {
  const { token } = useAuth();
  return <Redirect href={token ? '/dashboard' : '/login'} />;
}
