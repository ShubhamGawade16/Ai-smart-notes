import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  body?: any,
  options: RequestInit = {},
): Promise<Response> {
  try {
    // Get auth token from localStorage or Supabase session
    let token = localStorage.getItem('auth_token');
    
    // If no token in localStorage, try to get it from Supabase
    // But don't attempt this if we're in the middle of a logout process
    if (!token && !window.location.pathname.includes('/auth') && !localStorage.getItem('logout_in_progress')) {
      try {
        const { supabase } = await import('@/lib/supabase');
        if (supabase) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (session?.access_token && !error) {
            token = session.access_token;
            localStorage.setItem('auth_token', token);
          }
        }
      } catch (sessionError) {
        // Silently handle session errors during logout
        console.log('Session check skipped due to auth state transition');
      }
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    console.log('Making API request:', { method, url, hasToken: !!token });

    const res = await fetch(url, {
      method,
      ...(body && { body: JSON.stringify(body) }),
      ...options,
      headers,
    });

    return res;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Skip queries during logout process
    if (localStorage.getItem('logout_in_progress')) {
      return null;
    }
    
    const token = localStorage.getItem('auth_token');
    
    const res = await fetch(queryKey.join("") as string, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
