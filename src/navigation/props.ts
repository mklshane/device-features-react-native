import type { RouteProp } from '@react-navigation/native';
import type {
	NativeStackNavigationProp,
	NativeStackScreenProps,
} from '@react-navigation/native-stack';

export type RootStackParamList = {
	Home: undefined;
	AddEntry: undefined;
};

export type HomeScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'Home'
>;

export type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export type AddEntryScreenNavigationProp = NativeStackNavigationProp<
	RootStackParamList,
	'AddEntry'
>;

export type AddEntryScreenRouteProp = RouteProp<RootStackParamList, 'AddEntry'>;

export type AddEntryScreenProps = NativeStackScreenProps<
	RootStackParamList,
	'AddEntry'
>;
