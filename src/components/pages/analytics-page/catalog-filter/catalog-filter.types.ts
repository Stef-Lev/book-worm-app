export type CatalogStats = {
  name: string;
  total: number;
  read: number;
  percentage: number;
};

export type CatalogFilterProps = {
  catalogs: CatalogStats[];
};
