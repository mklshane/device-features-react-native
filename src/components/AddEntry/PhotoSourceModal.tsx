import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type PhotoSourceModalProps = {
  visible: boolean;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  secondaryTextColor: string;
  borderColor: string;
  onClose: () => void;
  onChooseCamera: () => void;
  onChooseUpload: () => void;
};

export const PhotoSourceModal = ({
  visible,
  accentColor,
  backgroundColor,
  textColor,
  secondaryTextColor,
  borderColor,
  onClose,
  onChooseCamera,
  onChooseUpload,
}: PhotoSourceModalProps) => {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { borderColor, backgroundColor }]}>
          <Text style={[styles.title, { color: textColor }]}>Add Photo</Text>
          <Text style={[styles.message, { color: secondaryTextColor }]}>Choose how you want to add your memory photo.</Text>

          <Pressable style={[styles.primaryButton, { backgroundColor: accentColor }]} onPress={onChooseCamera}>
            <Text style={styles.primaryButtonText}>Open Camera</Text>
          </Pressable>

          <Pressable style={[styles.secondaryButton, { borderColor }]} onPress={onChooseUpload}>
            <Text style={[styles.secondaryButtonText, { color: textColor }]}>Upload from Gallery</Text>
          </Pressable>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={[styles.closeText, { color: secondaryTextColor }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 22,
    marginBottom: 8,
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  closeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
});
