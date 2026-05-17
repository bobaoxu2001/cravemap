import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Colors, Spacing, Typography } from '../constants/theme';
import { Restaurant } from '../types';

interface RestaurantMapProps {
  restaurants: Restaurant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const FALLBACK_REGION: Region = {
  latitude: 40.7128,
  longitude: -74.006,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

function isValidCoord(r: Restaurant): boolean {
  return Number.isFinite(r.latitude) && Number.isFinite(r.longitude);
}

function computeRegion(restaurants: Restaurant[]): Region {
  const valid = restaurants.filter(isValidCoord);
  if (valid.length === 0) return FALLBACK_REGION;
  const lats = valid.map((r) => r.latitude);
  const lngs = valid.map((r) => r.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.04, (maxLat - minLat) * 1.6),
    longitudeDelta: Math.max(0.04, (maxLng - minLng) * 1.6),
  };
}

export default function RestaurantMap({ restaurants, selectedId, onSelect }: RestaurantMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const valid = useMemo(() => restaurants.filter(isValidCoord), [restaurants]);
  const initialRegion = useMemo(() => computeRegion(restaurants), [restaurants]);

  // Recenter when the filter changes and the current selection is not part of the new set.
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.animateToRegion(computeRegion(restaurants), 400);
  }, [restaurants]);

  // Pan to selection.
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const target = valid.find((r) => r.id === selectedId);
    if (!target) return;
    mapRef.current.animateToRegion(
      {
        latitude: target.latitude,
        longitude: target.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      350
    );
  }, [selectedId, valid]);

  if (valid.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No spots match these filters yet.</Text>
        <Text style={styles.emptySubtitle}>Try a different city or sort option.</Text>
      </View>
    );
  }

  return (
    <MapView
      ref={(ref) => {
        mapRef.current = ref;
      }}
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      initialRegion={initialRegion}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
    >
      {valid.map((r) => (
        <Marker
          key={r.id}
          coordinate={{ latitude: r.latitude, longitude: r.longitude }}
          title={r.name}
          description={`${r.neighborhood} · ${r.cuisine}`}
          onPress={() => onSelect(r.id)}
          pinColor={selectedId === r.id ? Colors.primary : undefined}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.card,
    gap: Spacing.xs,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
