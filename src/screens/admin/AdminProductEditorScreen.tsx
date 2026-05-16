import { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  createProductThunk,
  fetchProductById,
  updateProductThunk,
} from '../../redux/slices/productsSlice';
import { hasPermission } from '../../utils/session';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminProductEditor'>;

export function AdminProductEditorScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const contentWidth = width >= 768 ? Math.min(width - 64, 860) : width - 40;
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const session = useAppSelector(state => state.auth.session);
  const isEdit = route.params.mode === 'edit';
  const productId = route.params.mode === 'edit' ? route.params.productId : '';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canCreateProduct = hasPermission(session, 'Permissions.Products.Create');
  const canUpdateProduct = hasPermission(session, 'Permissions.Products.Update');

  useEffect(() => {
    if ((!isEdit && !canCreateProduct) || (isEdit && !canUpdateProduct)) {
      setError('You do not have permission for this action.');
    }
  }, [canCreateProduct, canUpdateProduct, isEdit]);

  useEffect(() => {
    let active = true;
    if (!isEdit) {
      return;
    }

    async function load() {
      if (!canUpdateProduct) {
        setError('You do not have permission to edit products.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await dispatch(fetchProductById(productId)).unwrap();
        if (!active) {
          return;
        }
        setName(data.name);
        setDescription(data.description);
        setPrice(String(data.price));
        setStock(String(data.stock));
        setCategory(data.category);
        setThumbnailUrl(data.thumbnailUrl);
        setImageUrls((data.imageUrls ?? []).join(','));
        setIsActive(data.isActive ?? true);
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
  }, [canUpdateProduct, isEdit, productId, dispatch]);

  async function handleSave() {
    if ((!isEdit && !canCreateProduct) || (isEdit && !canUpdateProduct)) {
      setError('You do not have permission for this action.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (isEdit) {
        await dispatch(
          updateProductThunk({
            id: productId,
            payload: {
            name: name.trim(),
            description: description.trim(),
            price: Number(price),
            stock: Number(stock),
            category: category.trim(),
            thumbnailUrl: thumbnailUrl.trim(),
            isActive,
            },
          }),
        ).unwrap();
      } else {
        await dispatch(
          createProductThunk({
            name: name.trim(),
            description: description.trim(),
            price: Number(price),
            stock: Number(stock),
            category: category.trim(),
            thumbnailUrl: thumbnailUrl.trim(),
            imageUrls: imageUrls
              .split(',')
              .map(item => item.trim())
              .filter(Boolean),
          }),
        ).unwrap();
      }
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
      ]}>
      <View style={[styles.card, { width: contentWidth, alignSelf: 'center' }]}>
        <Text style={styles.title}>{isEdit ? 'Edit Product' : 'Create Product'}</Text>
        {error && error.includes('permission') ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="Price"
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
        />
        <TextInput
          style={styles.input}
          placeholder="Stock"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          value={stock}
          onChangeText={setStock}
        />
        <TextInput
          style={styles.input}
          placeholder="Category"
          placeholderTextColor="#9CA3AF"
          value={category}
          onChangeText={setCategory}
        />
        <TextInput
          style={styles.input}
          placeholder="Thumbnail URL"
          placeholderTextColor="#9CA3AF"
          value={thumbnailUrl}
          onChangeText={setThumbnailUrl}
        />
        {!isEdit ? (
          <TextInput
            style={styles.input}
            placeholder="Image URLs (comma separated)"
            placeholderTextColor="#9CA3AF"
            value={imageUrls}
            onChangeText={setImageUrls}
          />
        ) : (
          <Pressable onPress={() => setIsActive(prev => !prev)} style={styles.toggle}>
            <Text style={styles.toggleText}>
              Active: {isActive ? 'Yes' : 'No'} (tap to toggle)
            </Text>
          </Pressable>
        )}

        {error && !error.includes('permission') ? <Text style={styles.error}>{error}</Text> : null}

        {(isEdit ? canUpdateProduct : canCreateProduct) ? (
          <Pressable onPress={handleSave} style={styles.saveBtn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#F4F1EA" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </Pressable>
        ) : null}
        <Pressable onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
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
  card: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  title: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  input: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#111827',
  },
  toggle: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  toggleText: { color: '#111827', fontWeight: '700' },
  error: { marginTop: 10, color: '#B91C1C', fontWeight: '600' },
  saveBtn: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: '#101826',
    alignItems: 'center',
    paddingVertical: 12,
  },
  saveText: { color: '#F4F1EA', fontWeight: '800' },
  cancelBtn: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: { color: '#111827', fontWeight: '800' },
});
