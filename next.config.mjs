/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.kookdonge.co.kr/api/:path*",
      },
    ]
  },
}

export default nextConfig
