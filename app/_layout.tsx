import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* headerShown: false hides the default "index" header so our Scorebook header looks better */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}