import BookLibrary from "@/components/book-library/book-library";

type SearchPageProps = { initialQuery?: string };

export default function SearchPage({ initialQuery = "" }: SearchPageProps) {
  return <BookLibrary initialQuery={initialQuery} />;
}
