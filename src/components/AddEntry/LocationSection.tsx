import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationData } from '../../types';

interface LocationSectionProps {
  loading: boolean;
  location: LocationData | null;
  primaryColor: string;
  textColor: string;
}

export const LocationSection = ({ loading, location, primaryColor, textColor }: LocationSectionProps) => {
  if (loading) {
    return <ActivityIndicator size="large" color={primaryColor} style={styles.loader} />;
  }

  if (!location) {
    return null;
  }

  return (
    <View style={styles.locationContainer}>
      <Ionicons name="location" size={20} color={primaryColor} />
      <Text style={[styles.locationText, { color: textColor }]}>{location.address || 'Unknown Location'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  locationText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    marginLeft: 8,
    flex: 1,
  },
});
