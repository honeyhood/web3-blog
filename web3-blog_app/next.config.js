/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  exportTrailingSlash: true,
  exportPathMap: function () {
    return {
      '/': { page: '/' },
    };
  },
};

module.exports = nextConfig;
