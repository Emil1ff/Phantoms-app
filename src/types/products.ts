export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  thumbnailUrl: string;
  imageUrls?: string[];
  isActive?: boolean;
};

export type ProductsQuery = {
  page?: number;
  pageSize?: number;
  category?: string;
};

export type CreateProductRequest = {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  thumbnailUrl: string;
  imageUrls: string[];
};

export type UpdateProductRequest = {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  thumbnailUrl: string;
  isActive: boolean;
};

export type PagedProducts = {
  items: Product[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
};
