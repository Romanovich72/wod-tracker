import Ionicons from '@expo/vector-icons/Ionicons';
import { useSyncExternalStore } from 'react';

type IconProps = React.ComponentProps<typeof Ionicons>;
const subscribe = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function AppIcon(props: IconProps) {
  const ready = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  if (!ready) return null;
  return <Ionicons {...props} />;
}
