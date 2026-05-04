<<<<<<< HEAD
import { Link } from 'expo-router';
=======
import { Href, Link } from 'expo-router';
>>>>>>> main
import { openBrowserAsync } from 'expo-web-browser';
import { type ComponentProps } from 'react';
import { Platform } from 'react-native';

<<<<<<< HEAD
type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };
=======
type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };
>>>>>>> main

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (Platform.OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href);
        }
      }}
    />
  );
}
