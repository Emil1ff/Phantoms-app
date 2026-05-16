import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from '../../services/products/productsService';
import { bootstrapAuth, logout } from './authSlice';
import type {
  CreateProductRequest,
  PagedProducts,
  Product,
  ProductsQuery,
  UpdateProductRequest,
} from '../../types/products';
import { mapAuthError } from '../../services/auth/authService';

type ProductsState = {
  status: 'idle' | 'loading';
  error: string | null;
  list: Product[];
  detail: Product | null;
};

const initialState: ProductsState = {
  status: 'idle',
  error: null,
  list: [],
  detail: null,
};

function extractProducts(data: PagedProducts | Product[]) {
  return Array.isArray(data) ? data : data.items ?? [];
}

export const fetchProducts = createAsyncThunk<
  Product[],
  ProductsQuery | undefined,
  { rejectValue: string }
>('products/fetchList', async (params, { rejectWithValue }) => {
  try {
    const data = await getProducts(params);
    return extractProducts(data);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const fetchProductById = createAsyncThunk<
  Product,
  string,
  { rejectValue: string }
>('products/fetchById', async (id, { rejectWithValue }) => {
  try {
    return await getProductById(id);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const createProductThunk = createAsyncThunk<
  void,
  CreateProductRequest,
  { state: { auth: { session: { accessToken?: string } | null } }; rejectValue: string }
>('products/create', async (payload, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.session?.accessToken;
    if (!token) {
      return rejectWithValue('No session token found.');
    }
    await createProduct(payload, token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const updateProductThunk = createAsyncThunk<
  void,
  { id: string; payload: UpdateProductRequest },
  { state: { auth: { session: { accessToken?: string } | null } }; rejectValue: string }
>('products/update', async ({ id, payload }, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.session?.accessToken;
    if (!token) {
      return rejectWithValue('No session token found.');
    }
    await updateProduct(id, payload, token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const deleteProductThunk = createAsyncThunk<
  void,
  string,
  { state: { auth: { session: { accessToken?: string } | null } }; rejectValue: string }
>('products/delete', async (id, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.session?.accessToken;
    if (!token) {
      return rejectWithValue('No session token found.');
    }
    await deleteProduct(id, token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearProductsError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProducts.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'idle';
        state.list = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Failed to load products.';
      })
      .addCase(fetchProductById.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.status = 'idle';
        state.detail = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Failed to load product.';
      })
      .addCase(createProductThunk.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createProductThunk.fulfilled, state => {
        state.status = 'idle';
      })
      .addCase(createProductThunk.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Create product failed.';
      })
      .addCase(updateProductThunk.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateProductThunk.fulfilled, state => {
        state.status = 'idle';
      })
      .addCase(updateProductThunk.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Update product failed.';
      })
      .addCase(deleteProductThunk.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteProductThunk.fulfilled, state => {
        state.status = 'idle';
      })
      .addCase(deleteProductThunk.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Delete product failed.';
      })
      .addCase(logout.fulfilled, () => initialState)
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        if (!action.payload) {
          return initialState;
        }
        return state;
      });
  },
});

export const { clearProductsError } = productsSlice.actions;
export default productsSlice.reducer;
