"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import { createStore, listAdminStores, updateStore } from "@/lib/api/admin";

export default function AdminStoresPage() {
  const queryClient = useQueryClient();
  const stores = useQuery({ queryKey: ["admin-stores"], queryFn: listAdminStores });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ slug: "", name: "", websiteUrl: "" });

  const create = useMutation({
    mutationFn: () =>
      createStore({
        slug: form.slug,
        name: form.name,
        websiteUrl: form.websiteUrl || null,
      }),
    onSuccess: () => {
      toast.success("Store created");
      queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
      setOpen(false);
      setForm({ slug: "", name: "", websiteUrl: "" });
    },
    onError: (error) =>
      toast.error("Could not create store", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateStore(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-stores"] }),
    onError: (error) =>
      toast.error("Could not update store", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title-3">Stores</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Deactivating a store hides all of its products from the public directory.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus aria-hidden="true" data-icon="inline-start" />
            New store
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create store</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                create.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="ns-name">Name</Label>
                <Input
                  id="ns-name"
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ns-slug">Slug (lowercase, hyphens)</Label>
                <Input
                  id="ns-slug"
                  required
                  pattern="[a-z0-9-]{2,60}"
                  value={form.slug}
                  onChange={(event) => setForm({ ...form, slug: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ns-url">Website URL (optional)</Label>
                <Input
                  id="ns-url"
                  type="url"
                  value={form.websiteUrl}
                  onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>
                Create store
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stores.isPending ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : stores.isError ? (
        <p className="text-muted-foreground">Stores could not be loaded.</p>
      ) : (
        <div className="bg-card ring-border overflow-x-auto rounded-xl ring-1">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-muted-foreground bg-surface border-b text-left text-xs">
                <th scope="col" className="p-3 font-medium">
                  Store
                </th>
                <th scope="col" className="p-3 font-medium">
                  Slug
                </th>
                <th scope="col" className="p-3 font-medium">
                  Website
                </th>
                <th scope="col" className="p-3 font-medium">
                  Active
                </th>
              </tr>
            </thead>
            <tbody>
              {stores.data.map((store) => (
                <tr key={store.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{store.name}</td>
                  <td className="text-muted-foreground p-3 font-mono text-xs">{store.slug}</td>
                  <td className="text-muted-foreground p-3 text-xs">{store.websiteUrl ?? "—"}</td>
                  <td className="p-3">
                    <Switch
                      checked={store.isActive}
                      onCheckedChange={(checked) =>
                        toggle.mutate({ id: store.id, isActive: checked === true })
                      }
                      aria-label={`${store.isActive ? "Deactivate" : "Activate"} ${store.name}`}
                      disabled={toggle.isPending}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
