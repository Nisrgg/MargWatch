import { useState, useCallback } from 'react';
import type { User } from '@margwatch/shared-types';
import { authApi } from '../api/authApi';
import type { Result } from '../types/result';

interface UseProfileFormOptions {
  user?: User | null;
}

export function useProfileForm({ user }: UseProfileFormOptions) {
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async (): Promise<Result> => {
    setLoading(true);
    try {
      await authApi.updateProfile({
        firstName,
        lastName,
        phone: phone || undefined,
      });
      return { ok: true as const };
    } catch (error) {
      return { ok: false as const, error };
    } finally {
      setLoading(false);
    }
  }, [firstName, lastName, phone]);

  return {
    fields: {
      firstName,
      lastName,
      phone,
    },
    setters: {
      setFirstName,
      setLastName,
      setPhone,
    },
    loading,
    submit,
  };
}

