import "./globals.css";

export const metadata = {
  title: "Sunbeat",
  description: "Premium music infrastructure",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0b0f1a] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}