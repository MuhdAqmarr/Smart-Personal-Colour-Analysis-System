"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackageSearch } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { ApiError } from "@/lib/api/client";
import {
  favouriteProduct,
  listProducts,
  unfavouriteProduct,
  type Product,
} from "@/lib/api/products";

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
const SEASONS = ["spring", "summer", "autumn", "winter"];
const ALL = "all";

export default function ProductsPage() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(ALL);
  const [season, setSeason] = useState(ALL);
  const [gender, setGender] = useState(ALL);
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [page, setPage] = useState(1);

  const filters = {
    category: category === ALL ? undefined : category,
    season: season === ALL ? undefined : season,
    gender: gender === ALL ? undefined : gender,
    q: submittedSearch || undefined,
    sort,
    page,
  };

  const query = useQuery({
    queryKey: ["products", filters],
    queryFn: () => listProducts(filters),
  });

  const toggleFavourite = useMutation({
    mutationFn: async (product: Product) => {
      if (product.isFavourite) await unfavouriteProduct(product.id);
      else await favouriteProduct(product.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    onError: (error) =>
      toast.error("Could not update favourites", {
        description:
          error instanceof ApiError && error.status === 401
            ? "Sign in to save favourite products."
            : error instanceof ApiError
              ? error.message
              : undefined,
      }),
  });

  function updateFilter(setter: (value: string) => void) {
    return (value: string | null) => {
      if (value !== null) setter(value);
      setPage(1);
    };
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Product directory</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Colour-tagged pieces from the demonstration catalogue. Run an analysis to see them ranked
          against your personal palette.
        </p>
      </div>

      <form
        role="search"
        aria-label="Filter products"
        className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmittedSearch(search.trim());
          setPage(1);
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="filter-search">Search</Label>
          <Input
            id="filter-search"
            placeholder="Name or brand…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-category">Category</Label>
          <Select value={category} onValueChange={updateFilter(setCategory)}>
            <SelectTrigger id="filter-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {CATEGORIES.map((value) => (
                <SelectItem key={value} value={value} className="capitalize">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-season">Season</Label>
          <Select value={season} onValueChange={updateFilter(setSeason)}>
            <SelectTrigger id="filter-season" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All seasons</SelectItem>
              {SEASONS.map((value) => (
                <SelectItem key={value} value={value} className="capitalize">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-gender">For</Label>
          <Select value={gender} onValueChange={updateFilter(setGender)}>
            <SelectTrigger id="filter-gender" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Everyone</SelectItem>
              <SelectItem value="women">Women</SelectItem>
              <SelectItem value="men">Men</SelectItem>
              <SelectItem value="unisex">Unisex</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-sort">Sort</Label>
          <Select value={sort} onValueChange={updateFilter(setSort)}>
            <SelectTrigger id="filter-sort" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price: low to high</SelectItem>
              <SelectItem value="price_desc">Price: high to low</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <button type="submit" className="sr-only">
          Apply search
        </button>
      </form>

      {query.isPending ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-label="Loading products"
        >
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
            <Skeleton key={index} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Products could not be loaded</EmptyTitle>
            <EmptyDescription>
              {query.error instanceof ApiError ? query.error.message : "Something went wrong."}
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => query.refetch()}>
            Try again
          </Button>
        </Empty>
      ) : query.data.items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageSearch aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No products match these filters</EmptyTitle>
            <EmptyDescription>Try removing a filter or searching differently.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {query.data.items.map((product) => (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  interactive={Boolean(session)}
                  onToggleFavourite={(target) => toggleFavourite.mutate(target)}
                  favouriteBusy={toggleFavourite.isPending}
                />
              </li>
            ))}
          </ul>
          {query.data.pagination.totalPages > 1 ? (
            <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {page} of {query.data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= query.data.pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
