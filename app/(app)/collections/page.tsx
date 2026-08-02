import { getCollections } from "@/lib/queries/collections";
import { getCategories } from "@/lib/queries/categories";
import { CollectionsView } from "@/components/collections/collections-view";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const [collections, groups] = await Promise.all([
    getCollections(),
    getCategories(),
  ]);

  return (
    <main className="flex flex-1 flex-col items-center px-4 pt-8 pb-36 sm:px-6 sm:pt-12">
      <div className="w-full max-w-3xl">
        <header className="mb-6">
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
            Collections
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Games to play, things to watch, things to buy.
          </p>
        </header>

        <CollectionsView
          byKind={collections.byKind}
          groups={groups}
          allTags={collections.tags}
          ready={collections.ready}
        />
      </div>
    </main>
  );
}
