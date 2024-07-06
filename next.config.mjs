/** @type {import('next').NextConfig} */
const nextConfig = {
    headers: () => [
        {
            source: '/widget/:id',
            headers: [
                {
                    key: 'Cache-Control',
                    value: 'no-store',
                },
            ],
        },
    ],
}

export default nextConfig;
