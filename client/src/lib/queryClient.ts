import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string = 'GET',
  body?: any,
  options: RequestInit = {},
): Promise<any> {
  try {
    // Get Supabase session
    const { supabase } = await import('@/lib/supabase');
    const session = supabase ? await supabase.auth.getSession().then(res => res.data.session) : null;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    };

    const res = await fetch(url, {
      method,
      ...(body && { body: JSON.stringify(body) }),
      ...options,
      headers,
    });

    await throwIfResNotOk(res);
    return await res.json();
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
