import type { Metadata } from "next";
import { Outfit, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fontOutfit = Outfit({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-outfit',
    weight: ['300', '400', '500', '600', '700', '800'],
});

const fontSpaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-space-grotesk',
    weight: ['300', '400', '500', '600', '700'],
});

const fontJetBrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-jetbrains-mono',
    weight: ['400', '500'],
});

export const metadata: Metadata = {
    title: "RepoMind",
    description: "Your advanced AI code intelligence hub.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className={`${fontOutfit.variable} ${fontSpaceGrotesk.variable} ${fontJetBrainsMono.variable}`}>
            <head>
                <link rel="icon" type="image/png" href="/favicon.png" />
            </head>
            <body className="antialiased selection:bg-cyan-primary/30" suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
