import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { useProfile, useUpdateProfile } from '@/features/users/queries';
import { Api } from '@/components/api-annotation';
import { Field } from '@/components/form-field';
import { ErrorState, PageLoader } from '@/components/feedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const schema = z.object({
  firstName: z.string().min(1, 'Required').max(100),
  lastName: z.string().min(1, 'Required').max(100),
});
type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '' },
  });

  const { reset } = form;
  useEffect(() => {
    if (profileQuery.data) {
      reset({
        firstName: profileQuery.data.firstName,
        lastName: profileQuery.data.lastName,
      });
    }
  }, [profileQuery.data, reset]);

  if (profileQuery.isLoading) return <PageLoader label="Loading your profile…" />;
  if (profileQuery.isError)
    return <ErrorState error={profileQuery.error} onRetry={() => profileQuery.refetch()} />;

  const profile = profileQuery.data!;

  const onSubmit = form.handleSubmit((values) => {
    updateProfile.mutate(values, {
      onSuccess: () =>
        toast.success('Saved — updating everywhere', {
          description: 'Name changes propagate to the customer and attendee copies asynchronously.',
        }),
      onError: (e) => toast.error((e as Error).message),
    });
  });

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <p className="text-xs text-muted-foreground">signed in</p>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full border bg-muted text-sm font-semibold uppercase text-muted-foreground">
              {profile.firstName.slice(0, 1)}
              {profile.lastName.slice(0, 1)}
            </span>
            <div>
              <p className="font-medium">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="First name" htmlFor="firstName" error={form.formState.errors.firstName?.message}>
              <Input id="firstName" {...form.register('firstName')} />
            </Field>
            <Field label="Last name" htmlFor="lastName" error={form.formState.errors.lastName?.message}>
              <Input id="lastName" {...form.register('lastName')} />
            </Field>
            <p className="text-xs text-muted-foreground">Email is managed in Keycloak.</p>

            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <Api>GET users/profile</Api>
                <Api>PUT users/profile</Api>
              </div>
              <Button type="submit" loading={updateProfile.isPending} disabled={!form.formState.isDirty}>
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
