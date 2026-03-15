import React from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ThemeToggleProps = {
  isDarkMode: boolean;
  color: string;
  onToggle: () => void;
};

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDarkMode,
  color,
  onToggle,
}) => {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={12}
      style={{
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name={isDarkMode ? "sunny-outline" : "moon-outline"}
        size={24}
        color={color}
      />
    </Pressable>
  );
};

export default ThemeToggle;
