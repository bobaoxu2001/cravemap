import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, View, Text, Pressable } from 'react-native';
// react-native-map-clustering wraps react-native-maps' MapView. It re-exports
// Marker via react-native-maps, which we import directly.
import ClusteredMapView from 'react-native-map-clustering';
import { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
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
  const mapRef = useRef<unknown>(null);
  const valid = useMemo(() => restaurants.filter(isValidCoord), [restaurants]);
  const initialRegion = useMemo(() => computeRegion(restaurants), [restaurants]);

  // Track whether the user has manually interacted with the map. Once they
  // pan/zoom themselves we stop programmatically recentering — feels rude
  // otherwise.
  const userInteractedRef = useRef(false);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);

  // Request location permission once; never blocks the map render.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status !== 'granted') {
          setLocationGranted(false);
          return;
        }
        setLocationGranted(true);
        const pos = await Location.getLastKnownPositionAsync({}).catch(() => null);
        if (pos && !cancelled) {
          setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
        const fresh = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).catch(() => null);
        if (fresh && !cancelled) {
          setUserLocation({ latitude: fresh.coords.latitude, longitude: fresh.coords.longitude });
        }
      } catch {
        // Silently ignore — map still works without user location.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Animate helper that gracefully degrades if the underlying ref doesn't
  // expose animateToRegion (some test/mocked setups).
  const animateToRegion = useCallback((region: Region, duration = 400) => {
    const ref = mapRef.current as { animateToRegion?: (r: Region, d?: number) => void } | null;
    if (ref && typeof ref.animateToRegion === 'function') {
      ref.animateToRegion(region, duration);
    }
  }, []);

  // If we get a user location and the user hasn't taken over the map yet,
  // center on them at a city-block-sized zoom.
  useEffect(() => {
    if (!userLocation || userInteractedRef.current) return;
    animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      500
    );
  }, [animateToRegion, userLocation]);

  // Recenter when the filtered restaurant set changes — unless the user has
  // already manually moved the map.
  useEffect(() => {
    if (userInteractedRef.current) return;
    animateToRegion(computeRegion(restaurants), 400);
  }, [animateToRegion, restaurants]);

  // Pan to selection regardless of interaction state — selection is itself
  // a user action so this is expected.
  useEffect(() => {
    if (!selectedId) return;
    const target = valid.find((r) => r.id === selectedId);
    if (!target) return;
    animateToRegion(
      {
        latitude: target.latitude,
        longitude: target.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      350
    );
  }, [animateToRegion, selectedId, valid]);

  // Recenter FAB — taps reset the interaction flag and fly to user location
  // (or restaurant region if location is unavailable).
  const fabScale = useRef(new Animated.Value(1)).current;
  const handleRecenter = useCallback(() => {
    Animated.sequence([
      Animated.spring(fabScale, { toValue: 0.88, useNativeDriver: true, tension: 300, friction: 5 }),
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, tension: 220, friction: 6 }),
    ]).start();
    userInteractedRef.current = false;
    if (userLocation) {
      animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        450
      );
    } else {
      animateToRegion(computeRegion(restaurants), 450);
    }
  }, [animateToRegion, fabScale, restaurants, userLocation]);

  if (valid.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No spots match these filters yet.</Text>
        <Text style={styles.emptySubtitle}>Try a different city or sort option.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <ClusteredMapView
      mapRef={(ref) => {
        mapRef.current = ref;
      }}
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      initialRegion={initialRegion}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      showsUserLocation={locationGranted}
      // Clustering controls — tuned for ~20–200 restaurants per city.
      clusteringEnabled
      radius={48}
      minPoints={3}
      clusterColor={Colors.primary}
      clusterTextColor="#FFFFFF"
      onPanDrag={() => {
        userInteractedRef.current = true;
      }}
      onRegionChangeComplete={(_region, details) => {
        // `details.isGesture` is true on RN Maps when the change came from a
        // user gesture. Guard for older versions where details may be missing.
        if (details && (details as { isGesture?: boolean }).isGesture) {
          userInteractedRef.current = true;
        }
      }}
    >
      {valid.map((r) => (
        <Marker
          key={r.id}
          identifier={r.id}
          coordinate={{ latitude: r.latitude, longitude: r.longitude }}
          title={r.name}
          description={`${r.neighborhood} · ${r.cuisine}`}
          onPress={() => onSelect(r.id)}
          pinColor={selectedId === r.id ? Colors.primary : undefined}
          tracksViewChanges={false}
        />
      ))}
    </ClusteredMapView>
    <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
      <Pressable
        onPress={handleRecenter}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.fabInner}
      >
        <Ionicons
          name={locationGranted ? 'locate' : 'map-outline'}
          size={20}
          color={Colors.primary}
        />
      </Pressable>
    </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fabInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
