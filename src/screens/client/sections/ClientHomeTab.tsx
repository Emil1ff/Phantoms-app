import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import type { Product } from '../../../types/products';
import { t } from '../../../i18n';

type Story = { id: string; title: string; image: string };

type Props = {
  styles: any;
  stories: Story[];
  products: Product[];
  loadingProducts: boolean;
  productsError: string | null;
  language: any;
  onOpenProduct: (id: string) => void;
};

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

export function ClientHomeTab({ styles, stories, products, loadingProducts, productsError, language, onOpenProduct }: Props) {
  return (
    <>
      <View style={styles.banner}>
        <Text style={styles.bannerTag}>{t(language, 'today_only')}</Text>
        <Text style={styles.bannerTitle}>{t(language, 'flat_discount')}</Text>
        <Text style={styles.bannerText}>{t(language, 'discover_drops')}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t(language, 'stories')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesRow}>
        {stories.map(story => (
          <View key={story.id} style={styles.storyCard}>
            <Image source={{ uri: story.image }} style={styles.storyImage} />
            <Text style={styles.storyText}>{story.title}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>{t(language, 'products')}</Text>
      {loadingProducts ? (
        <ActivityIndicator size="large" color="#0F213A" style={styles.loader} />
      ) : productsError ? (
        <Text style={styles.error}>{productsError}</Text>
      ) : (
        <View style={styles.productsGrid}>
          {products.map(product => (
            <Pressable key={product.id} onPress={() => onOpenProduct(product.id)} style={styles.productCard}>
              <Image source={{ uri: product.thumbnailUrl }} style={styles.productImage} />
              <Text numberOfLines={1} style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>{money(product.price)}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}
