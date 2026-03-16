import { useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintsApi } from '../api/complaintsApi';
import { complaintsKeys } from './useComplaints';

export function useSubmitComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => complaintsApi.submit(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintsKeys.all });
    },
  });
}
