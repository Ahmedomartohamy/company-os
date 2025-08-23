import QueryProvider from './providers/QueryProvider';
import AppRouter from './Router';
import ToasterProvider from '../components/common/ToasterProvider';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { AuthProvider } from './auth/AuthProvider';

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToasterProvider />
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </AuthProvider>
    </QueryProvider>
  );
}
