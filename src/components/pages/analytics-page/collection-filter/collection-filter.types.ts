export type CollectionStats = {
  id: string;
  name: string;
  total: number;
  read: number;
  percentage: number;
};

export type CollectionFilterProps = {
  collections: CollectionStats[];
};
