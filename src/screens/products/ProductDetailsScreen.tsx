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
import { fetchProductById } from '../../redux/slices/productsSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

export function ProductDetailsScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = width >= 768 ? Math.min(width - 64, 820) : width - 40;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { productId } = route.params;
  const product = useAppSelector(state => state.products.detail) as Product | null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await dispatch(fetchProductById(productId)).unwrap();
        if (active) {
          // keep using the store value, no local copy required
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

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
      ]}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={{ width: contentWidth, alignSelf: 'center' }}>
      {loading ? (
        <ActivityIndicator size="large" color="#0F213A" style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : product ? (
        <View style={styles.card}>
          <Image source={{ uri: product.thumbnailUrl }} style={styles.image} />
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>{money(product.price)}</Text>
          <Text style={styles.description}>{product.description}</Text>
          <Text style={styles.stock}>Stock: {product.stock}</Text>
        </View>
      ) : (
        <Text style={styles.error}>Product not found.</Text>
      )}
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
  back: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#E8E0D2',
  },
  backText: {
    color: '#1F2937',
    fontWeight: '700',
  },
  loader: {
    marginTop: 60,
  },
  error: {
    marginTop: 30,
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    marginTop: 14,
    borderRadius: 22,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: '100%',
    height: 260,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
  },
  category: {
    marginTop: 14,
    color: '#9B3D2F',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
    fontSize: 12,
  },
  title: {
    marginTop: 6,
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
  },
  price: {
    marginTop: 8,
    color: '#1E3A5F',
    fontSize: 20,
    fontWeight: '800',
  },
  description: {
    marginTop: 12,
    color: '#374151',
    fontSize: 15,
    lineHeight: 22,
  },
  stock: {
    marginTop: 12,
    color: '#0F213A',
    fontWeight: '700',
  },
});
