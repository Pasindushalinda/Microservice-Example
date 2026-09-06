import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
import { useRegister } from '@/features/users/queries';
import { useSession } from '@/lib/auth/useSession';
import { ApiError, problemErrors } from '@/lib/api/client';
import { Api } from '@/components/api-annotation';
import { Field } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const schema = z.object({
  firstName: z.string().min(1, 'Required').max(100),
  lastName: z.string().min(1, 'Required').max(100),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const register = useRegister();
  const { signIn } = useSession();
  const [done, setDone] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerErrors([]);
    register.mutate(values, {
      onSuccess: () => setDone(true),
      onError: (err) => {
        if (err instanceof ApiError) {
          setServerErrors(problemErrors(err.problem).length ? problemErrors(err.problem) : [err.message]);
        } else {
          setServerErrors([(err as Error).message]);
        }
      },
    });
  });

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <p className="text-xs text-muted-foreground">our API, anonymous route</p>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-success/40 bg-success/5 p-4">
                <CheckCircle2 className="mt-0.5 size-5 text-success" />
                <div className="text-sm">
                  <p className="font-medium">Account created</p>
                  <p className="text-muted-foreground">
                    Registration created the Keycloak user and our user, then a
                    user-registered event fanned out to Ticketing and Attendance. You can
                    sign in now.
                  </p>
                </div>
              </div>
              <Button className="w-full" onClick={signIn}>
                Sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name" htmlFor="firstName" error={form.formState.errors.firstName?.message}>
                  <Input id="firstName" autoComplete="given-name" {...form.register('firstName')} />
                </Field>
                <Field label="Last name" htmlFor="lastName" error={form.formState.errors.lastName?.message}>
                  <Input id="lastName" autoComplete="family-name" {...form.register('lastName')} />
                </Field>
              </div>
              <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
                <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
              </Field>
              <Field
                label="Password"
                htmlFor="password"
                error={form.formState.errors.password?.message}
                hint="At least 8 characters."
              >
                <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
              </Field>

              {serverErrors.length > 0 && (
                <ul className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  {serverErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}

              <Button type="submit" className="w-full" loading={register.isPending}>
                Register
              </Button>
              <p className="text-center">
                <Api>POST users/register</Api>
              </p>
              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{' '}
                <button type="button" onClick={signIn} className="text-primary hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
