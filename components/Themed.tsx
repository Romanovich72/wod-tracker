import { Text as DefaultText, View as DefaultView } from 'react-native';
import type { ComponentProps } from 'react';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';

type ThemeProps = { lightColor?: string; darkColor?: string };
export type TextProps = ThemeProps & ComponentProps<typeof DefaultText>;
export type ViewProps = ThemeProps & ComponentProps<typeof DefaultView>;

export function useThemeColor(props:{light?:string;dark?:string},colorName:keyof typeof Colors.light & keyof typeof Colors.dark) {
  const theme=useColorScheme();return props[theme]??Colors[theme][colorName];
}
export function Text(props:TextProps) {
  const {style,lightColor,darkColor,...other}=props;const color=useThemeColor({light:lightColor,dark:darkColor},'text');
  return <DefaultText style={[{color},style]} {...other}/>;
}
export function View(props:ViewProps) {
  const {style,lightColor,darkColor,...other}=props;const backgroundColor=useThemeColor({light:lightColor,dark:darkColor},'background');
  return <DefaultView style={[{backgroundColor},style]} {...other}/>;
}
