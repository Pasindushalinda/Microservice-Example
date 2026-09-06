import { useState } from 'react';
import { toast } from 'sonner';
import { Archive, Check, Pencil } from 'lucide-react';
import {
  useArchiveCategory,
  useCategories,
  useCreateCategory,
  useRenameCategory,
} from '@/features/events/queries';
import { Api } from '@/components/api-annotation';
import { ErrorState, PageLoader } from '@/components/feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Category } from '@/lib/api/types';

export function CategoriesPage() {
  const categoriesQuery = useCategories();
  const createCategory = useCreateCategory();
  const [name, setName] = useState('');

  if (categoriesQuery.isLoading) return <PageLoader label="Loading categories…" />;
  if (categoriesQuery.isError)
    return <ErrorState error={categoriesQuery.error} onRetry={() => categoriesQuery.refetch()} />;

  const categories = categoriesQuery.data ?? [];

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createCategory.mutate(trimmed, {
      onSuccess: () => {
        toast.success(`Added “${trimmed}”`);
        setName('');
      },
      onError: (e) => toast.error((e as Error).message),
    });
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <Api>GET categories</Api>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <Button onClick={add} loading={createCategory.isPending}>
          Add
        </Button>
      </div>
      <p className="-mt-3">
        <Api>POST categories</Api>
      </p>

      <Card className="divide-y divide-dashed">
        {categories.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No categories yet.</p>
        )}
        {categories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Api>PUT categories/{'{id}'}</Api>
        <Api>PUT categories/{'{id}'}/archive</Api>
      </div>
      <p className="text-xs text-muted-foreground">
        10.5 has no un-archive endpoint, so archived categories stay archived here.
      </p>
    </div>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const rename = useRenameCategory();
  const archive = useArchiveCategory();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(category.name);

  return (
    <div className="flex items-center gap-3 p-3">
      {editing ? (
        <Input
          className="h-8 flex-1"
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditing(false);
            if (e.key === 'Enter') {
              rename.mutate(
                { id: category.id, name: value.trim() },
                {
                  onSuccess: () => {
                    toast.success('Renamed');
                    setEditing(false);
                  },
                  onError: (err) => toast.error((err as Error).message),
                },
              );
            }
          }}
        />
      ) : (
        <span className="flex-1 font-medium">
          {category.name}
          {category.isArchived && (
            <Badge variant="neutral" className="ml-2">
              archived
            </Badge>
          )}
        </span>
      )}

      {editing ? (
        <Button
          size="sm"
          loading={rename.isPending}
          onClick={() =>
            rename.mutate(
              { id: category.id, name: value.trim() },
              {
                onSuccess: () => {
                  toast.success('Renamed');
                  setEditing(false);
                },
                onError: (err) => toast.error((err as Error).message),
              },
            )
          }
        >
          <Check className="size-4" />
        </Button>
      ) : (
        <>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
            Rename
          </Button>
          {!category.isArchived && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              loading={archive.isPending}
              onClick={() =>
                archive.mutate(category.id, {
                  onSuccess: () => toast.success('Archived'),
                  onError: (err) => toast.error((err as Error).message),
                })
              }
            >
              <Archive className="size-4" />
              Archive
            </Button>
          )}
        </>
      )}
    </div>
  );
}
