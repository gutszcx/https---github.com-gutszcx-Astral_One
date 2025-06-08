
import type {NextConfig} from 'next';
import NextPWAPlugin from '@ducanh2912/next-pwa';

const withPWA = NextPWAPlugin({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline', // Fallback for document/navigation
  },
});

// Determine basePath e assetPrefix para GitHub Pages
const repoName = process.env.NEXT_PUBLIC_REPO_NAME || '';
const isGithubPages = process.env.GITHUB_ACTIONS === 'true' && repoName;

const basePath = isGithubPages ? `/${repoName}` : '';
const assetPrefix = isGithubPages ? `/${repoName}/` : ''; // assetPrefix precisa terminar com uma barra

const nextConfig: NextConfig = {
  output: 'export',
  basePath: basePath,
  assetPrefix: assetPrefix,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
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
