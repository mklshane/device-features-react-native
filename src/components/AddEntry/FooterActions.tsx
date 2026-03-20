import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface FooterActionsProps {
  canSave: boolean;
  loading: boolean;
  primaryColor: string;
  borderColor: string;
  cardColor: string;
  textColor: string;
  textSecondaryColor: string;
  onCancel: () => void;
  onSave: () => void;
}

export const FooterActions = ({
  canSave,
  loading,
  primaryColor,
  borderColor,
  cardColor,
  textColor,
  textSecondaryColor,
  onCancel,
  onSave,
}: FooterActionsProps) => {
  return (
    <View style={styles.footerActions}>
      <TouchableOpacity
        style={[styles.cancelButton, { borderColor, backgroundColor: cardColor }]}
        onPress={onCancel}
        disabled={loading}
      >
        <Text style={[styles.cancelButtonText, { color: textColor }]}>Cancel</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: canSave ? primaryColor : borderColor }]}
        onPress={onSave}
        disabled={!canSave || loading}
      >
        <Text style={[styles.saveButtonText, { color: canSave ? '#FFF' : textSecondaryColor }]}>Save Entry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footerActions: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
