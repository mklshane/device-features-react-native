import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type ConfirmDeleteModalProps = {
  visible: boolean;
  title: string;
  message: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  secondaryTextColor: string;
  borderColor: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmDeleteModal = ({
  visible,
  title,
  message,
  accentColor,
  backgroundColor,
  textColor,
  secondaryTextColor,
  borderColor,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) => {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.container, { borderColor, backgroundColor }]}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          <Text style={[styles.message, { color: secondaryTextColor }]}>{message}</Text>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={[styles.buttonText, { color: textColor }]}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.button, { backgroundColor: accentColor }]} onPress={onConfirm}>
              <Text style={[styles.buttonText, styles.confirmText]}>Delete</Text>
            </Pressable>
          </View>
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
    backgroundColor: '#FFFFFF',
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
    marginBottom: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    minWidth: 96,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#EFEFEF',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  confirmText: {
    color: '#FFFFFF',
  },
});
