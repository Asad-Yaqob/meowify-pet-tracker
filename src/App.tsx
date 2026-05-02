import { RouterProvider } from 'react-router';
import router from './routes/Router';
import { ThemeProvider } from './portal/components/provider/theme-provider';
import ReactQueryProvider from './portal/components/provider/queryClientProvider';
import { Toaster } from './portal/components/ui/sonner';
import { AuthProvider } from './portal/context/auth/AuthContext';
import 'simplebar-react/dist/simplebar.min.css';
import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <ReactQueryProvider>
        <AuthProvider>
          <HelmetProvider>
            <RouterProvider router={router} />
            <Toaster />
          </HelmetProvider>
        </AuthProvider>
      </ReactQueryProvider>
    </ThemeProvider>
  );
}

export default App;
