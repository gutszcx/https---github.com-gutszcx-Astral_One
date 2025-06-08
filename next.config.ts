
import type {NextConfig} from 'next';
import NextPWAPlugin from '@ducanh2912/next-pwa';

const withPWA = NextPWAPlugin({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline', // Fallback for document/navigation
    // image: '/static/images/fallback.png', // Example: if you want a fallback image
    // font: '/static/fonts/fallback.woff2', // Example: if you want a fallback font
  },
  // You can add more caching strategies here if needed
  // If you want your PWA service worker to import the FCM service worker:
  // workboxOptions: {
  //   importScripts: ['/firebase-messaging-sw.js'], // Path relative to public directory
  // },
  // However, firebase/messaging typically handles its own SW registration.
  // So, explicit importScripts might not be needed unless you want a single SW.
});

const nextConfig: NextConfig = {
  output: 'export', // Adicionado para habilitar a exportação estática
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Necessário para `output: 'export'` se não estiver usando um loader de imagem customizado compatível
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'chatgpt.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Added for Google profile pictures
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default withPWA(nextConfig);
