import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { ProtectedRoute } from "./components/protectedRoute";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { MyChamas } from "./pages/MyChamas";
import { CreateChama } from "./pages/CreateChama";
import { JoinChama } from "./pages/JoinChama";
import { Contributions } from "./pages/Contributions";
import { Loans } from "./pages/Loans";
import { Meetings } from "./pages/Meetings";
import { Members } from "./pages/Members"
import { Analytics } from "./pages/Analytics";
import { Settings } from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth route */}
          <Route path="/" element={<Auth />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<Navigate to="/" replace />} />

          {/* Protected routes */}
          <Route
            path="/my-chamas"
            element={
              <ProtectedRoute>
                <MyChamas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
  path="/settings"
  element={
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  }
/>
<Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <Analytics />
    </ProtectedRoute>
  }
/>
          <Route
            path="/create-chama"
            element={
              <ProtectedRoute>
                <CreateChama />
              </ProtectedRoute>
            }
          />
          <Route
            path="/join-chama"
            element={
              <ProtectedRoute>
                <JoinChama />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contributions"
            element={
              <ProtectedRoute>
                <Contributions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans"
            element={
              <ProtectedRoute>
                <Loans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings"
            element={
              <ProtectedRoute>
                <Meetings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <Members />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
