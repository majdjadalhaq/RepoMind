/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';
const isGitHubPages = !isVercel && isProd;

const nextConfig = {
    reactStrictMode: true,
    output: 'export',
    basePath: isGitHubPages ? '/RepoMind' : '',
    assetPrefix: isGitHubPages ? '/RepoMind/' : '',
    images: {
        unoptimized: true,
    },
    // في إصدارات Next.js الحديثة، يتم وضع إعدادات Turbopack هنا
    turbopack: {
        resolveAlias: {
            canvas: './empty-module.js',
        },
    },
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        return config;
    },
};

export default nextConfig;
