import React from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';
import type { Product } from '../../../types/products';
import { t } from '../../../i18n';

type Props = {
  styles: any;
  data: Product[];
  pageContentStyle: any;
  cardStyle: any;
  titleStyle: any;
  subtitleStyle: any;
  roleChipSurfaceStyle: any;
  headerActionStyle: any;
  headerActionTextStyle: any;
  canCreateProduct: boolean;
  canUpdateProduct: boolean;
  productsLoading: boolean;
  productsRefreshing: boolean;
  productsLoadingMore: boolean;
  productsHasNextPage: boolean;
  productsError: string | null;
  productsDisplayCount: number;
  onRefresh: () => void;
  onLoadMore: () => void;
  onOpenDetails: (id: string) => void;
  onOpenEditorCreate: () => void;
  onOpenEditorEdit: (id: string) => void;
  language: any;
};

export function AdminProductsTab(props: Props) {
  const {
    styles,
    data,
    pageContentStyle,
    cardStyle,
    titleStyle,
    subtitleStyle,
    roleChipSurfaceStyle,
    headerActionStyle,
    headerActionTextStyle,
    canCreateProduct,
    canUpdateProduct,
    productsLoading,
    productsRefreshing,
    productsLoadingMore,
    productsHasNextPage,
    productsError,
    productsDisplayCount,
    onRefresh,
    onLoadMore,
    onOpenDetails,
    onOpenEditorCreate,
    onOpenEditorEdit,
    language,
  } = props;

  return (
    <FlatList
      data={data}
      keyExtractor={product => product.id}
      refreshing={productsRefreshing}
      onRefresh={onRefresh}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.45}
      contentContainerStyle={[styles.page, pageContentStyle, data.length === 0 ? styles.productsEmptyList : null]}
      ListHeaderComponent={
        <View>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, titleStyle]}>{t(language, 'products')}</Text>
            <Text style={[styles.sectionSubtitle, subtitleStyle]}>{t(language, 'scroll_for_more')}</Text>
          </View>

          <View style={[styles.itemCard, cardStyle]}>
            <Text style={[styles.itemTitle, titleStyle]}>{t(language, 'catalog_overview')}</Text>
            <Text style={[styles.itemMeta, subtitleStyle]}>{t(language, 'total')}: {productsDisplayCount}</Text>
          </View>

          {canCreateProduct ? (
            <Pressable onPress={onOpenEditorCreate} style={[styles.primaryBtn, headerActionStyle]}>
              <Text style={[styles.primaryBtnText, headerActionTextStyle]}>{t(language, 'create_product')}</Text>
            </Pressable>
          ) : null}

          {productsError ? <Text style={[styles.error, styles.productsError]}>{productsError}</Text> : null}
          {productsLoading && data.length === 0 ? <ActivityIndicator style={styles.loader} color="#10233F" /> : null}
        </View>
      }
      ListEmptyComponent={!productsLoading ? <Text style={[styles.emptyText, subtitleStyle]}>{t(language, 'no_products')}</Text> : null}
      ListFooterComponent={
        <View style={styles.productsFooter}>
          {productsLoadingMore ? <ActivityIndicator color="#10233F" /> : null}
          {!productsLoadingMore && productsHasNextPage && data.length > 0 ? <Text style={[styles.productsFooterText, subtitleStyle]}>{t(language, 'keep_scrolling')}</Text> : null}
          {!productsHasNextPage && data.length > 0 ? <Text style={[styles.productsFooterText, subtitleStyle]}>{t(language, 'reached_end')}</Text> : null}
        </View>
      }
      renderItem={({ item: product }) => (
        <Pressable style={[styles.productCard, cardStyle, { borderColor: '#D1D5DB' }]} onPress={() => onOpenDetails(product.id)}>
          <View style={styles.productThumbWrap}><Image source={{ uri: product.thumbnailUrl }} style={styles.productThumb} /></View>
          <View style={styles.productCardBody}>
            <View style={styles.productTitleRow}>
              <Text style={[styles.itemTitle, titleStyle]} numberOfLines={1}>{product.name}</Text>
              <View style={[styles.productBadge, roleChipSurfaceStyle]}><Text style={[styles.productBadgeText, subtitleStyle]}>{product.category}</Text></View>
            </View>
            <Text style={[styles.itemMeta, subtitleStyle]} numberOfLines={2}>{product.description || t(language, 'no_description')}</Text>
            <View style={styles.productMetaRow}>
              <Text style={[styles.productPrice, titleStyle]}>${product.price.toFixed(2)}</Text>
              <Text style={[styles.productStock, subtitleStyle]}>{t(language, 'stock')} {product.stock}</Text>
            </View>
            {canUpdateProduct ? (
              <View style={styles.productActionRow}>
                <Pressable onPress={() => onOpenEditorEdit(product.id)} style={[styles.productActionBtn, headerActionStyle]}>
                  <Text style={[styles.productActionText, headerActionTextStyle]}>{t(language, 'edit')}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </Pressable>
      )}
    />
  );
}
