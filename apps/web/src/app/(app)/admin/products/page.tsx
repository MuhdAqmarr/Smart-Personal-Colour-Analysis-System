"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import {
  createAdminProduct,
  listAdminProducts,
  listAdminStores,
  updateAdminProduct,
} from "@/lib/api/admin";

const CATEGORIES = [
  "tops",
  "shirts",
  "dresses",
  "outerwear",
  "trousers",
  "skirts",
  "scarves",
  "hijabs",
  "accessories",
  "shoes",
  "bags",
  "cosmetics",
];

function CreateProductDialog() {
  const queryClient = useQueryClient();
  const stores = useQuery({ queryKey: ["admin-stores"], queryFn: listAdminStores });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    storeSlug: "",
    name: "",
    category: "tops",
    productUrl: "",
    price: "",
    colourName: "",
    colourHex: "#c66b3d",
    seasonTags: "autumn",
  });

  const create = useMutation({
    mutationFn: () =>
      createAdminProduct({
        storeSlug: form.storeSlug,
        name: form.name,
        category: form.category,
        productUrl: form.productUrl,
        price: form.price ? Number(form.price) : null,
        colourName: form.colourName,
        colourHex: form.colourHex,
        seasonTags: form.seasonTags
          .split(/[|,]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success("Product created");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setOpen(false);
    },
    onError: (error) =>
      toast.error("Could not create product", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  function update(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus aria-hidden="true" data-icon="inline-start" />
        New product
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create product</DialogTitle>
          <DialogDescription>
            Manually add a product to the directory. For bulk data use the CSV import.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="np-name">Name</Label>
            <Input id="np-name" required value={form.name} onChange={update("name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-store">Store</Label>
            <select
              id="np-store"
              required
              value={form.storeSlug}
              onChange={update("storeSlug")}
              className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm"
            >
              <option value="" disabled>
                Select a store…
              </option>
              {stores.data?.map((store) => (
                <option key={store.id} value={store.slug}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-category">Category</Label>
            <select
              id="np-category"
              value={form.category}
              onChange={update("category")}
              className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm capitalize"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="np-url">Product URL (http/https)</Label>
            <Input
              id="np-url"
              type="url"
              required
              value={form.productUrl}
              onChange={update("productUrl")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-price">Price (MYR)</Label>
            <Input
              id="np-price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={update("price")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-colour-name">Colour name</Label>
            <Input id="np-colour-name" value={form.colourName} onChange={update("colourName")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-hex">Colour hex</Label>
            <Input
              id="np-hex"
              required
              pattern="#[0-9a-fA-F]{6}"
              value={form.colourHex}
              onChange={update("colourHex")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-seasons">Season tags (| separated)</Label>
            <Input id="np-seasons" value={form.seasonTags} onChange={update("seasonTags")} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full" disabled={create.isPending}>
              Create product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState("");

  const query = useQuery({
    queryKey: ["admin-products", page, submitted],
    queryFn: () => listAdminProducts(page, submitted || undefined),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateAdminProduct(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
    onError: (error) =>
      toast.error("Could not update", {
        description: error instanceof ApiError ? error.message : undefined,
      }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Products</h1>
        <div className="flex items-center gap-2">
          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(search.trim());
              setPage(1);
            }}
          >
            <Input
              aria-label="Search products"
              placeholder="Search name or brand…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-56"
            />
          </form>
          <CreateProductDialog />
        </div>
      </div>

      {query.isPending ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : query.isError ? (
        <p className="text-muted-foreground">Products could not be loaded.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left text-xs">
                  <th scope="col" className="p-3 font-medium">
                    Product
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Store
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Category
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Price
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Availability
                  </th>
                  <th scope="col" className="p-3 font-medium">
                    Active
                  </th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="p-3">
                      <span className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="size-6 shrink-0 rounded-md border border-black/5"
                          style={{ backgroundColor: product.hex ?? "#ddd" }}
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{product.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {product.brand || "—"}
                            {product.isDemo ? " · demo" : ""}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="text-muted-foreground p-3">{product.storeName}</td>
                    <td className="p-3 capitalize">{product.category}</td>
                    <td className="p-3 tabular-nums">
                      {product.price != null
                        ? `${product.currency} ${product.price.toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px]">
                        {product.availability.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Switch
                        checked={product.isActive}
                        onCheckedChange={(checked) =>
                          toggle.mutate({ id: product.id, isActive: checked === true })
                        }
                        aria-label={`${product.isActive ? "Deactivate" : "Activate"} ${product.name}`}
                        disabled={toggle.isPending}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {query.data.pagination.totalItems} products ·{" "}
              <Link href="/admin/imports" className="text-primary underline underline-offset-4">
                bulk import via CSV
              </Link>
            </p>
            {query.data.pagination.totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </Button>
                <span className="text-muted-foreground text-sm">
                  {page}/{query.data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= query.data.pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
