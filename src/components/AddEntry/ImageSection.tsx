import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImageSectionProps {
  imageUri: string | null;
  cardColor: string;
  borderColor: string;
  primaryColor: string;
  textSecondaryColor: string;
  onOpenCamera: () => void;
}

export const ImageSection = ({
  imageUri,
  cardColor,
  borderColor,
  primaryColor,
  textSecondaryColor,
  onOpenCamera,
}: ImageSectionProps) => {
  if (!imageUri) {
    return (
      <TouchableOpacity
        style={[styles.cameraPlaceholder, { backgroundColor: cardColor, borderColor }]}
        onPress={onOpenCamera}
      >
        <Ionicons name="camera" size={48} color={primaryColor} />
        <Text style={[styles.cameraText, { color: textSecondaryColor }]}>Capture Memory</Text>
        <Text style={[styles.cameraSubtext, { color: textSecondaryColor }]}>Tap to add a photo</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.imageContainer}>
      <Image source={{ uri: imageUri }} style={styles.previewImage} />
      <TouchableOpacity style={styles.retakeButton} onPress={onOpenCamera}>
        <Ionicons name="refresh" size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraPlaceholder: {
    height: 350,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraText: { fontFamily: 'Inter_600SemiBold', marginTop: 16, fontSize: 16 },
  cameraSubtext: { fontFamily: 'Inter_400Regular', marginTop: 6, fontSize: 13 },
  imageContainer: {
    height: 350,
    borderRadius: 24,
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  retakeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
});
