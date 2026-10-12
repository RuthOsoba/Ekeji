import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { FiltersPanel } from "@/components/ekeji/FiltersPanel";
import { ListingCard } from "@/components/ekeji/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFitProfile, useSaved } from "@/hooks/useEkejiUser";
import { FIT_DISCLAIMER } from "@/lib/fit";
import type { Unit } from "@/lib/format";
import {
  applyFilters,
  CATEGORIES,
  countActiveFilters,
  DEPARTMENTS,
  emptyFilters,
  fetchListings,
} from "@/lib/ekeji";

export function MarketplaceBrowser({ initialQuery = "" }: { initialQuery?: string }) {
  const [filters, setFilters] = useState({ ...emptyFilters, q: initialQuery });
  const [unit, setUnit] = useState<Unit>("cm");
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings"],
    queryFn: fetchListings,
  });
  const navigate = useNavigate();
  const { isSaved, toggle, signedIn } = useSaved();
  const fitProfile = useFitProfile();

  const results = useMemo(() => applyFilters(listings, filters), [listings, filters]);
  const activeCount = countActiveFilters(filters);

  function handleToggleSave(id: string) {
    if (!signedIn) {
      void navigate({ to: "/auth", search: { mode: "signin" } });
      return;
    }
    void toggle(id);
  }

  function toggleCategory(category: string) {
    setFilters((previous) => ({
      ...previous,
      categories: previous.categories.includes(category)
        ? previous.categories.filter((value) => value !== category)
        : [...previous.categories, category],
    }));
  }

  return (
    <div>
      <div className="border-b border-border bg-card py-4 md:py-5">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-center gap-2.5">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                aria-label="Search outfits"
                placeholder="Search dresses, fabrics, colours…"
                value={filters.q}
                onChange={(event) =>
                  setFilters((previous) => ({ ...previous, q: event.target.value }))
                }
                className="h-11 rounded-md bg-muted pl-10 focus-visible:border-ring"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 shrink-0" aria-label="Open filters">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">Filters</span>
                  {activeCount > 0 && <span aria-label={`${activeCount} active filters`}>{activeCount}</span>}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[88vh] max-w-xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">Filters</DialogTitle>
                </DialogHeader>
                <div className="mt-6">
                  <FiltersPanel
                    filters={filters}
                    onChange={setFilters}
                    unit={unit}
                    onUnitChange={setUnit}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {DEPARTMENTS.map((department) => (
              <Button
                key={department.value}
                type="button"
                size="sm"
                variant={filters.department === department.value ? "default" : "outline"}
                onClick={() =>
                  setFilters((previous) => ({ ...previous, department: department.value }))
                }
                aria-pressed={filters.department === department.value}
                className="shrink-0 rounded-full"
              >
                {department.label}
              </Button>
            ))}
            <span className="mx-1 h-8 w-px shrink-0 bg-border" aria-hidden />
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                type="button"
                size="sm"
                variant={filters.categories.includes(category) ? "secondary" : "ghost"}
                onClick={() => toggleCategory(category)}
                aria-pressed={filters.categories.includes(category)}
                className="shrink-0 rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 md:px-8 lg:py-10">
        <section aria-label="Outfits">
          {fitProfile && <p className="mb-3 text-xs text-muted-foreground">{FIT_DISCLAIMER}</p>}
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {results.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                fitProfile={fitProfile}
                {...(signedIn ? { saved: isSaved(listing.id) } : {})}
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>
          {!isLoading && results.length === 0 && (
            <div className="mt-8 border border-border bg-card p-8 text-center">
              <h3 className="font-display text-xl">No outfits match those filters yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try widening your measurement range or clearing a filter.
              </p>
              <Button className="mt-5" variant="outline" onClick={() => setFilters({ ...emptyFilters })}>
                Clear filters
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}