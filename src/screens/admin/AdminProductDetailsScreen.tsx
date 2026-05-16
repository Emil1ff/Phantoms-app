import { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/types';
import type { Product } from '../../types/products';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { deleteProductThunk, fetchProductById } from '../../redux/slices/productsSlice';
import { hasPermission } from '../../utils/session';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminProductDetails'>;

export function AdminProductDetailsScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = width >= 768 ? Math.min(width - 64, 860) : width - 40;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const session = useAppSelector(state => state.auth.session);
  const { productId } = route.params;
  const product = useAppSelector(state => state.products.detail) as Product | null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canUpdateProduct = hasPermission(session, 'Permissions.Products.Update');
  const canDeleteProduct = hasPermission(session, 'Permissions.Products.Delete');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await dispatch(fetchProductById(productId)).unwrap();
        if (active) {
          if (!data.id) {
            throw new Error('Product not found.');
          }
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : 'Failed to load product.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [productId, dispatch]);

  async function handleDelete() {
    if (!canDeleteProduct) {
      setError('You do not have permission to delete products.');
      return;
    }

    try {
      await dispatch(deleteProductThunk(productId)).unwrap();
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
      ]}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={{ width: contentWidth, alignSelf: 'center' }}>
      {loading ? (
        <ActivityIndicator style={styles.loader} color="#10233F" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : product ? (
        <View style={styles.card}>
          <Image source={{ uri: product.thumbnailUrl }} style={styles.image} />
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.meta}>
            {product.category} | ${product.price.toFixed(2)} | stock {product.stock}
          </Text>
          <Text style={styles.desc}>{product.description}</Text>

          {canUpdateProduct ? (
            <Pressable
              style={styles.actionBtn}
              onPress={() =>
                navigation.navigate('AdminProductEditor', {
                  mode: 'edit',
                  productId,
                })
              }>
              <Text style={styles.actionText}>Edit Product</Text>
            </Pressable>
          ) : null}
          {canDeleteProduct ? (
            <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
              <Text style={styles.actionText}>Delete Product</Text>
            </Pressable>
          ) : null}
          {!canUpdateProduct && !canDeleteProduct ? (
            <Text style={styles.meta}>No product actions available for this account.</Text>
          ) : null}
        </View>
      ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    backgroundColor: '#F4F1EA',
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E5DED0',
  },
  backText: { color: '#111827', fontWeight: '700' },
  loader: { marginTop: 30 },
  error: { marginTop: 24, color: '#B91C1C', fontWeight: '600' },
  card: { marginTop: 14, backgroundColor: '#FFF', borderRadius: 18, padding: 14 },
  image: { width: '100%', height: 220, borderRadius: 14, backgroundColor: '#E5E7EB' },
  title: { marginTop: 10, fontSize: 22, color: '#0F172A', fontWeight: '800' },
  meta: { marginTop: 6, color: '#475569' },
  desc: { marginTop: 10, color: '#374151', lineHeight: 20 },
  actionBtn: {
    marginTop: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#101826',
    paddingVertical: 12,
  },
  deleteBtn: { backgroundColor: '#B91C1C' },
  actionText: { color: '#F4F1EA', fontWeight: '800' },
});
