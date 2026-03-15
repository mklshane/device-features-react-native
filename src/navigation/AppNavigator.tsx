import React from "react";
import {
	DarkTheme,
	DefaultTheme,
	NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import ThemeToggle from "../components/Base/ThemeToggle";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { RootStackParamList } from "./props";

const Stack = createNativeStackNavigator<RootStackParamList>();

const HomeScreen = () => {
	const { colors } = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<Text style={[styles.title, { color: colors.text }]}>Welcome</Text>
			<Text style={[styles.subtitle, { color: colors.textSecondary }]}> 
				Device features app is ready.
			</Text>
		</View>
	);
};

const NavigatorContent = () => {
	const { colors, isDarkMode, toggleTheme } = useTheme();

	return (
		<NavigationContainer
			theme={{
				...(isDarkMode ? DarkTheme : DefaultTheme),
				colors: {
					...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
					background: colors.background,
					card: colors.surface,
					text: colors.text,
					border: colors.border,
					primary: colors.primary,
				},
			}}
		>
			<Stack.Navigator
				screenOptions={{
					headerStyle: { backgroundColor: colors.surface },
					headerTintColor: colors.text,
					headerRight: () => (
						<ThemeToggle
							isDarkMode={isDarkMode}
							color={colors.text}
							onToggle={toggleTheme}
						/>
					),
					contentStyle: { backgroundColor: colors.background },
				}}
			>
				<Stack.Screen
					name="Home"
					component={HomeScreen}
					options={{ title: "Device Features" }}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
};

const AppNavigator = () => {
	return (
		<ThemeProvider>
			<NavigatorContent />
		</ThemeProvider>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 24,
		justifyContent: "center",
	},
	title: {
		fontSize: 30,
		fontWeight: "700",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		lineHeight: 24,
	},
});

export default AppNavigator;
