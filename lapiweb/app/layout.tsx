// import type { Metadata } from "next";
// import { Inter, Playfair_Display } from "next/font/google";
// import QueryProvider from "@/context/QueryProvider";
// import "./globals.css";

// const inter = Inter({
//   variable: "--font-inter",
//   subsets: ["latin"],
//   display: "swap",
// });

// const playfair = Playfair_Display({
//   variable: "--font-playfair",
//   subsets: ["latin"],
//   display: "swap",
//   weight: ["400", "500", "600", "700"],
// });

// export const metadata: Metadata = {
//   title: "Saveurs Thaï",
//   description:
//     "Épicerie thaïlandaise en ligne & prestation chef à domicile — Paris",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="fr" suppressHydrationWarning data-scroll-behavior="smooth">
//       <body className={`${inter.variable} ${playfair.variable} antialiased`}>
//         <QueryProvider>{children}</QueryProvider>
//       </body>
//     </html>
//   );
// }


import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import localFont from "next/font/local"; 
import QueryProvider from "@/context/QueryProvider";
import "./globals.css";

const customThai = localFont({
  src: "../public/fonts/thailand.ttf", 
  variable: "--font-custom",
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Saveurs Thaï",
  description:
    "Épicerie thaïlandaise en ligne & prestation chef à domicile — Paris",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning data-scroll-behavior="smooth">
      {/* 3. On ajoute la variable de la nouvelle police ici */}
      <body className={`${inter.variable} ${playfair.variable} ${customThai.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}