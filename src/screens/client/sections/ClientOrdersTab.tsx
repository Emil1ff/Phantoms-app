import React from 'react';
import { Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export function ClientOrdersTab({ styles }: { styles: any }) {
  return (
    <View style={styles.ordersCard}>
      <Ionicons name="receipt-outline" size={26} color="#10233F" />
      <Text style={styles.ordersTitle}>Orders are coming next</Text>
      <Text style={styles.ordersText}>Order API qoşulanda burani da real data ilə bağlayırıq.</Text>
    </View>
  );
}
