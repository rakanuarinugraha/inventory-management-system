import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { User, CreateUserInput, UpdateUserInput } from "@/types/user";

interface UsersResponse {
  users: User[];
}

interface UserResponse {
  message: string;
  user: User;
}

export function useUsers() {
  return useQuery<User[], ApiError>({
    queryKey: ["users"],
    queryFn: () => api.get<UsersResponse>("/api/auth/users").then((res) => res.users),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<UserResponse, ApiError, CreateUserInput>({
    mutationFn: (data) => api.post<UserResponse>("/api/auth/register", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<UserResponse, ApiError, { id: string; data: UpdateUserInput }>({
    mutationFn: ({ id, data }) => api.put<UserResponse>(`/api/auth/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation<UserResponse, ApiError, { id: string; isActive: boolean }>({
    mutationFn: ({ id, isActive }) => {
      if (!isActive) {
        return api.patch<UserResponse>(`/api/auth/users/${id}/deactivate`);
      }
      return api.put<UserResponse>(`/api/auth/users/${id}`, { isActive: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
