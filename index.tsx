import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import App from './App';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Map Clerk's useAuth to Convex's expected shape
function useAuthFromClerk() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  return {
    isLoading: !isLoaded,
    isAuthenticated: isSignedIn ?? false,
    fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      return (await getToken({ template: 'convex', skipCache: forceRefreshToken })) ?? null;
    },
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find root element to mount to');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}>
      <ConvexProviderWithAuth client={convex} useAuth={useAuthFromClerk}>
        <App />
      </ConvexProviderWithAuth>
    </ClerkProvider>
  </React.StrictMode>
);
