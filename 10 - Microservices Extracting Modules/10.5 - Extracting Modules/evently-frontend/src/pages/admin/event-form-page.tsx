import { useState, type ReactNode } from 'react';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import {
  useCategories,
  useCreateEvent,
  useCreateTicketType,
  useChangeTicketTypePrice,
  useEvent,
  usePublishEvent,
  useTicketTypes,
} from '@/features/events/queries';
import { fromLocalInputValue } from '@/lib/datetime-input';
import { formatMoney } from '@/lib/format';
import { Api } from '@/components/api-annotation';
import { BackButton } from '@/components/back-button';
import { Field } from '@/components/form-field';
import { ErrorState, PageLoader } from '@/components/feedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TicketType } from '@/lib/api/types';

const eventSchema = z.object({
  title: z.string().min(3, 'At least 3 characters').max(200),
  categoryId: z.string().uuid('Pick a category'),
  location: z.string().min(1, 'Required').max(200),
  startsAtUtc: z.string().min(1, 'Required'),
  endsAtUtc: z.string().optional(),
  description: z.string().min(1, 'Required').max(4000),
});
type EventFormValues = z.infer<typeof eventSchema>;

const editRouteApi = getRouteApi('/admin/events/$eventId/edit');

export function EventCreatePage() {
  return <EventForm mode="create" />;
}

export function EventEditPage() {
  const { eventId } = editRouteApi.useParams();
  return <EventForm mode="edit" eventId={eventId} />;
}

function EventForm({ mode, eventId }: { mode: 'create' | 'edit'; eventId?: string }) {
  const navigate = useNavigate();
  const categoriesQuery = useCategories();
  const eventQuery = useEvent(mode === 'edit' ? eventId : undefined);
  const createEvent = useCreateEvent();
  const publish = usePublishEvent();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      categoryId: '',
      location: '',
      startsAtUtc: '',
      endsAtUtc: '',
      description: '',
    },
  });

  if (mode === 'edit' && eventQuery.isLoading) return <PageLoader label="Loading event…" />;
  if (mode === 'edit' && eventQuery.isError)
    return <ErrorState error={eventQuery.error} onRetry={() => eventQuery.refetch()} />;

  const event = eventQuery.data;

  const onCreate = form.handleSubmit((values) => {
    createEvent.mutate(
      {
        title: values.title,
        categoryId: values.categoryId,
        location: values.location,
        description: values.description,
        startsAtUtc: fromLocalInputValue(values.startsAtUtc),
        endsAtUtc: values.endsAtUtc ? fromLocalInputValue(values.endsAtUtc) : null,
      },
      {
        onSuccess: (id) => {
          toast.success('Event created as a draft');
          navigate({ to: '/admin/events/$eventId/edit', params: { eventId: id } });
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  });

  const activeCategories = (categoriesQuery.data ?? []).filter((c) => !c.isArchived);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackButton fallbackTo="/admin/events" label="All events" />
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">{mode === 'create' ? 'New event' : event?.title}</h1>
        <Api>{mode === 'create' ? 'POST events' : 'GET events/{id}'}</Api>
      </div>

      {mode === 'create' ? (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2" noValidate>
              <div className="sm:col-span-2">
                <Field label="Title" htmlFor="title" error={form.formState.errors.title?.message}>
                  <Input id="title" {...form.register('title')} />
                </Field>
              </div>
              <Field
                label="Category"
                htmlFor="categoryId"
                error={form.formState.errors.categoryId?.message}
                hint={<Api>GET categories (non-archived)</Api>}
              >
                <Select id="categoryId" {...form.register('categoryId')}>
                  <option value="">choose…</option>
                  {activeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Location"
                htmlFor="location"
                error={form.formState.errors.location?.message}
              >
                <Input id="location" placeholder="venue, city" {...form.register('location')} />
              </Field>
              <Field
                label="Starts (UTC)"
                htmlFor="startsAtUtc"
                error={form.formState.errors.startsAtUtc?.message}
              >
                <Input id="startsAtUtc" type="datetime-local" {...form.register('startsAtUtc')} />
              </Field>
              <Field label="Ends (UTC) — optional" htmlFor="endsAtUtc">
                <Input id="endsAtUtc" type="datetime-local" {...form.register('endsAtUtc')} />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  label="Description"
                  htmlFor="description"
                  error={form.formState.errors.description?.message}
                >
                  <Textarea id="description" rows={4} {...form.register('description')} />
                </Field>
              </div>
              <div className="flex justify-end sm:col-span-2">
                <Button type="submit" loading={createEvent.isPending}>
                  Save draft
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ReadRow label="Category">
              {activeCategories.find((c) => c.id === event?.categoryId)?.name ?? event?.categoryId}
            </ReadRow>
            <ReadRow label="Location">{event?.location}</ReadRow>
            <ReadRow label="Starts">{event?.startsAtUtc}</ReadRow>
            <ReadRow label="Description">{event?.description}</ReadRow>
            <p className="text-muted-foreground pt-2 text-xs">
              10.5 has no general update-event endpoint — title, category, location and description
              are fixed after creation. Times change via{' '}
              <span className="font-mono">Reschedule</span> on the events list.
            </p>
          </CardContent>
        </Card>
      )}

      {mode === 'edit' && eventId && <TicketTypesEditor eventId={eventId} />}

      {mode === 'edit' && eventId && (
        <div className="flex items-center justify-between">
          <Api>PUT events/{'{id}'}/publish</Api>
          <Button
            loading={publish.isPending}
            onClick={() =>
              publish.mutate(eventId, {
                onSuccess: () => toast.success('Publish requested'),
                onError: (e) => toast.error((e as Error).message),
              })
            }
          >
            Publish event
          </Button>
        </div>
      )}
    </div>
  );
}

function ReadRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}

const ticketTypeSchema = z.object({
  name: z.string().min(1, 'Required').max(100),
  price: z.coerce.number().nonnegative('Must be ≥ 0'),
  currency: z.string().length(3, '3-letter code').toUpperCase(),
  quantity: z.coerce.number().int().positive('Must be > 0'),
});
type TicketTypeFormValues = z.input<typeof ticketTypeSchema>;

function TicketTypesEditor({ eventId }: { eventId: string }) {
  const ticketTypesQuery = useTicketTypes(eventId);
  const createTicketType = useCreateTicketType(eventId);
  const changePrice = useChangeTicketTypePrice(eventId);
  const [adding, setAdding] = useState(false);

  const form = useForm<TicketTypeFormValues>({
    resolver: zodResolver(ticketTypeSchema),
    defaultValues: { name: '', price: 0, currency: 'EUR', quantity: 100 },
  });

  const onAdd = form.handleSubmit((values) => {
    const parsed = ticketTypeSchema.parse(values);
    createTicketType.mutate(
      { eventId, ...parsed },
      {
        onSuccess: () => {
          toast.success(`Added ${parsed.name}`);
          form.reset({ name: '', price: 0, currency: 'EUR', quantity: 100 });
          setAdding(false);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Ticket types</CardTitle>
        <Api>POST ticket-types</Api>
      </CardHeader>
      <CardContent className="space-y-4">
        {ticketTypesQuery.isLoading ? (
          <PageLoader label="Loading ticket types…" />
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">&nbsp;</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(ticketTypesQuery.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-6 text-center">
                      No ticket types yet.
                    </TableCell>
                  </TableRow>
                )}
                {ticketTypesQuery.data?.map((tt) => (
                  <TicketTypeRow
                    key={tt.id}
                    ticketType={tt}
                    onChangePrice={(price) =>
                      changePrice.mutate(
                        { id: tt.id, price },
                        {
                          onSuccess: () => toast.success('Price change requested'),
                          onError: (e) => toast.error((e as Error).message),
                        },
                      )
                    }
                    pending={changePrice.isPending}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {adding ? (
          <form
            onSubmit={onAdd}
            className="bg-muted/30 grid gap-3 rounded-lg border p-4 sm:grid-cols-4"
            noValidate
          >
            <Field label="Name" htmlFor="tt-name" error={form.formState.errors.name?.message}>
              <Input id="tt-name" {...form.register('name')} />
            </Field>
            <Field label="Price" htmlFor="tt-price" error={form.formState.errors.price?.message}>
              <Input id="tt-price" type="number" step="0.01" {...form.register('price')} />
            </Field>
            <Field
              label="Currency"
              htmlFor="tt-currency"
              error={form.formState.errors.currency?.message}
            >
              <Input id="tt-currency" maxLength={3} {...form.register('currency')} />
            </Field>
            <Field
              label="Quantity"
              htmlFor="tt-qty"
              error={form.formState.errors.quantity?.message}
            >
              <Input id="tt-qty" type="number" {...form.register('quantity')} />
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-4">
              <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createTicketType.isPending}>
                Add ticket type
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Add ticket type
          </Button>
        )}

        <p className="border-warning/50 bg-warning/5 text-warning rounded-md border border-dashed p-3 text-xs">
          Changing a price on a live event publishes a price-changed event that Ticketing consumes —
          its copy of the ticket type updates a moment later.{' '}
          <span className="font-mono">PUT ticket-types/{'{id}'}/price</span>
        </p>
      </CardContent>
    </Card>
  );
}

function TicketTypeRow({
  ticketType,
  onChangePrice,
  pending,
}: {
  ticketType: TicketType;
  onChangePrice: (price: number) => void;
  pending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(ticketType.price));

  return (
    <TableRow>
      <TableCell className="font-medium">{ticketType.name}</TableCell>
      <TableCell>
        {editing ? (
          <Input
            type="number"
            step="0.01"
            className="h-8 w-24"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        ) : (
          formatMoney(ticketType.price, ticketType.currency)
        )}
      </TableCell>
      <TableCell>{ticketType.currency}</TableCell>
      <TableCell>{Number(ticketType.quantity)}</TableCell>
      <TableCell className="text-right">
        {editing ? (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={pending}
              onClick={() => {
                onChangePrice(Number(price));
                setEditing(false);
              }}
            >
              Save price
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="text-primary text-sm hover:underline"
            onClick={() => setEditing(true)}
          >
            edit
          </button>
        )}
      </TableCell>
    </TableRow>
  );
}
