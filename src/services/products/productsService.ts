import { apiRequest } from '../api/httpClient';
import type { ApiResponse } from '../../types/auth';
import type {
  CreateProductRequest,
  PagedProducts,
  Product,
  ProductsQuery,
  UpdateProductRequest,
} from '../../types/products';

function buildProductsQuery(params: ProductsQuery = {}) {
  const search = new URLSearchParams();
  search.set('page', String(params.page ?? 1));
  search.set('pageSize', String(params.pageSize ?? 10));

  if (params.category) {
    search.set('category', params.category);
  }

  return search.toString();
}

export async function getProducts(
  params: ProductsQuery = {},
): Promise<PagedProducts | Product[]> {
  const query = buildProductsQuery(params);
  const response = await apiRequest<PagedProducts | Product[]>(
    `/Products?${query}`,
    {
      method: 'GET',
    },
  );

  if (!response.data) {
    throw new Error('Products data is missing.');
  }

  return response.data;
}

export async function createProduct(
  payload: CreateProductRequest,
  token: string,
): Promise<ApiResponse<never>> {
  return apiRequest<never>('/Products', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function getProductById(id: string): Promise<Product> {
  const response = await apiRequest<Product>(`/Products/${id}`, {
    method: 'GET',
  });

  if (!response.data) {
    throw new Error('Product data is missing.');
  }

  return response.data;
}

export async function updateProduct(
  id: string,
  payload: UpdateProductRequest,
  token: string,
): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Products/${id}`, {
    method: 'PUT',
    body: payload,
    token,
  });
}

export async function deleteProduct(
  id: string,
  token: string,
): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Products/${id}`, {
    method: 'DELETE',
    token,
  });
}
