import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { t } from '../../../i18n';
import { DonutChart } from '../../../components/common/DonutChart';

type Props = {
  styles: any;
  cardStyle: any;
  titleStyle: any;
  subtitleStyle: any;
  chartBgStyle: any;
  progressBarStyle: (count: number) => any;
  productsDisplayCount: number;
  usersCount: number;
  rolesCount: number;
  headerActionStyle: any;
  headerActionTextStyle: any;
  onReload: () => void;
  language: any;
};

export function AdminOverviewTab(props: Props) {
  const {
    styles,
    cardStyle,
    titleStyle,
    subtitleStyle,
    chartBgStyle,
    progressBarStyle,
    productsDisplayCount,
    usersCount,
    rolesCount,
    headerActionStyle,
    headerActionTextStyle,
    onReload,
    language,
  } = props;

  const kpi = [
    { label: t(language, 'kpi_revenue'), value: '$128.4K', ratio: 74 },
    { label: t(language, 'kpi_conversion'), value: '6.8%', ratio: 68 },
    { label: t(language, 'kpi_retention'), value: '82%', ratio: 82 },
  ];

  return (
    <>
      <View style={[styles.itemCard, cardStyle]}>
        <Text style={[styles.itemTitle, titleStyle]}>{t(language, 'dashboard_kpis')}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          {kpi.map(item => (
            <DonutChart
              key={`ring-${item.label}`}
              value={item.ratio}
              label={item.label}
              color="#D4B483"
              trackColor="#E5E7EB"
              textColor={titleStyle.color}
            />
          ))}
        </View>
        {kpi.map(item => (
          <View key={item.label} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[styles.itemMeta, subtitleStyle]}>{item.label}</Text>
              <Text style={[styles.itemMeta, titleStyle]}>{item.value}</Text>
            </View>
            <View style={[styles.chartBarBg, chartBgStyle]}>
              <View style={[styles.chartBarFill, { width: `${item.ratio}%` }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.itemCard, cardStyle]}>
        <Text style={[styles.itemTitle, titleStyle]}>{t(language, 'system_snapshot')}</Text>
        <Text style={[styles.itemMeta, subtitleStyle]}>{t(language, 'products')}: {productsDisplayCount}</Text>
        <Text style={[styles.itemMeta, subtitleStyle]}>{t(language, 'users')}: {usersCount}</Text>
        <Text style={[styles.itemMeta, subtitleStyle]}>{t(language, 'roles')}: {rolesCount}</Text>

        <View style={styles.chartBlock}>
          <View style={[styles.chartBarBg, chartBgStyle]}>
            <View style={[styles.chartBarFill, progressBarStyle(productsDisplayCount * 3)]} />
          </View>
          <View style={[styles.chartBarBg, chartBgStyle]}>
            <View style={[styles.chartBarFill, progressBarStyle(usersCount * 3)]} />
          </View>
          <View style={[styles.chartBarBg, chartBgStyle]}>
            <View style={[styles.chartBarFill, progressBarStyle(rolesCount * 8)]} />
          </View>
        </View>
      </View>

      <Pressable onPress={onReload} style={[styles.primaryBtn, headerActionStyle]}>
        <Text style={[styles.primaryBtnText, headerActionTextStyle]}>{t(language, 'reload_data')}</Text>
      </Pressable>
    </>
  );
}
