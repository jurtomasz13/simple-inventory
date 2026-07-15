import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import * as ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import Routes from './app/routes';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  },
});

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient} >
      <BrowserRouter>
        <Routes />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
