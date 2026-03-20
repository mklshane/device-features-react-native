import React from 'react';
import { View, Text, TextInput, StyleSheet, LayoutChangeEvent } from 'react-native';

interface DescriptionSectionProps {
  value: string;
  maxLength: number;
  textColor: string;
  textSecondaryColor: string;
  borderColor: string;
  cardColor: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

export const DescriptionSection = ({
  value,
  maxLength,
  textColor,
  textSecondaryColor,
  borderColor,
  cardColor,
  onChangeText,
  onFocus,
  onBlur,
  onLayout,
}: DescriptionSectionProps) => {
  return (
    <View style={styles.descriptionSection} onLayout={onLayout}>
      <Text style={[styles.descriptionLabel, { color: textColor }]}>Description (optional)</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Add a short note about this memory"
        placeholderTextColor={textSecondaryColor}
        multiline
        maxLength={maxLength}
        style={[
          styles.descriptionInput,
          {
            color: textColor,
            borderColor,
            backgroundColor: cardColor,
          },
        ]}
        textAlignVertical="top"
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <Text style={[styles.descriptionCount, { color: textSecondaryColor }]}>
        {value.length}/{maxLength}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  descriptionSection: {
    marginTop: 20,
  },
  descriptionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  descriptionInput: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  descriptionCount: {
    marginTop: 6,
    textAlign: 'right',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
});
