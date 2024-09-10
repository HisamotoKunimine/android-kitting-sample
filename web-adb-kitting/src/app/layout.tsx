import React from "react";

export const metadata = {
  title: 'KittingSample',
  description: 'Sample app for kitting with WebADB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='ja'>
      <head ><title>KittingSample</title></head>
      <body>{children}</body>
    </html>
  );
}
