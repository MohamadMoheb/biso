import { Redirect } from 'expo-router';

/** Old /settings links land back on the home screen. */
export default function SettingsRedirect() {
  return <Redirect href="/" />;
}
