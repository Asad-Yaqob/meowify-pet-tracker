import { RouterProvider } from 'react-router';
import router from './routes/Router';
import { ThemeProvider } from './portal/components/provider/theme-provider';
import ReactQueryProvider from './portal/components/provider/queryClientProvider';
import { Toaster } from './portal/components/ui/sonner';
import { AuthProvider } from './portal/context/auth/AuthContext';
import 'simplebar-react/dist/simplebar.min.css';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <ReactQueryProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AuthProvider>
      </ReactQueryProvider>
    </ThemeProvider>
  );
}

export default App;
