import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

interface CameraCaptureModalProps {
  visible: boolean;
  cameraRef: React.RefObject<React.ElementRef<typeof CameraView> | null>;
  cameraFacing: 'front' | 'back';
  torchEnabled: boolean;
  onToggleTorch: () => void;
  onSwitchCamera: () => void;
  onClose: () => void;
  onPickFromGallery: () => void;
  onCapture: () => void;
}

export const CameraCaptureModal = ({
  visible,
  cameraRef,
  cameraFacing,
  torchEnabled,
  onToggleTorch,
  onSwitchCamera,
  onClose,
  onPickFromGallery,
  onCapture,
}: CameraCaptureModalProps) => {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.cameraModalContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.cameraView}
          facing={cameraFacing}
          enableTorch={torchEnabled}
        >
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraTitle}>New Memory</Text>
            <View style={styles.cameraHeaderActions}>
              <Pressable
                style={[styles.cameraIconButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                onPress={onToggleTorch}
                hitSlop={10}
              >
                <Ionicons name={torchEnabled ? 'flash' : 'flash-off'} size={22} color="#FFF" />
              </Pressable>

              <Pressable
                style={[styles.cameraIconButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                onPress={onSwitchCamera}
                hitSlop={10}
              >
                <Ionicons name="camera-reverse" size={22} color="#FFF" />
              </Pressable>

              <Pressable
                style={[styles.cameraIconButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                onPress={onClose}
                hitSlop={10}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </Pressable>
            </View>
          </View>

          <View style={styles.cameraFooter}>
            <View style={styles.cameraActionColumn}>
              <Pressable
                style={[styles.cameraIconButton, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                onPress={onPickFromGallery}
                hitSlop={10}
              >
                <Ionicons name="images" size={22} color="#FFF" />
              </Pressable>
              <Text style={styles.cameraActionLabel}>Gallery</Text>
            </View>

            <View style={styles.captureColumn}>
              <Pressable style={styles.captureButtonOuter} onPress={onCapture} hitSlop={10}>
                <View style={styles.captureButtonInner} />
              </Pressable>
              <Text style={styles.captureLabel}>Capture</Text>
            </View>

            <View style={styles.cameraIconSpacer} />
          </View>
        </CameraView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cameraModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraHeader: {
    paddingTop: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cameraHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cameraTitle: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  cameraFooter: {
    paddingHorizontal: 28,
    paddingBottom: 34,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cameraActionColumn: {
    alignItems: 'center',
    width: 64,
  },
  captureColumn: {
    alignItems: 'center',
  },
  cameraIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraActionLabel: {
    marginTop: 8,
    color: '#FFF',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  cameraIconSpacer: {
    width: 64,
    height: 64,
  },
  captureButtonOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF',
  },
  captureLabel: {
    marginTop: 10,
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
