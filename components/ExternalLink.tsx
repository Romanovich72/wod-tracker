import { Link, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

export function ExternalLink(props: Omit<ComponentProps<typeof Link>, 'href'> & { href: Href }) {
  return <Link target="_blank" {...props} onPress={(event) => {
    if (Platform.OS !== 'web') {
      event.preventDefault();
      WebBrowser.openBrowserAsync(String(props.href));
    }
  }} />;
}
