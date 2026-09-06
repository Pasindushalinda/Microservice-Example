import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/endpoints';
import { qk } from '@/lib/query';
import { useSession } from '@/lib/auth/useSession';
import type { RegisterUserRequest, UpdateProfileRequest } from '@/lib/api/types';

export function useProfile() {
  const { isAuthenticated } = useSession();
  return useQuery({
    queryKey: qk.profile.me,
    queryFn: usersApi.profile,
    enabled: isAuthenticated,
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (body: RegisterUserRequest) => usersApi.register(body),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => usersApi.updateProfile(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.profile.me }),
  });
}
