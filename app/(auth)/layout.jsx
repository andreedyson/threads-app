import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";

import "../globals.css";

export const metadata = {
  title: "Threads App",
  description: "Next.js 14 based Threads Application",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={` bg-dark-1`}>
          <div className="flex items-center justify-center w-full h-screen">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
