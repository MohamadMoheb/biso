import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Web-only root HTML. Injected before React mounts so the page is never blank white
 * while Metro compiles/serves the dev bundle.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#06080A" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: shellBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const shellBackground = `
html, body, #root {
  background-color: #06080A;
}
`;
