This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# DOL-E - Daejeon Local Guide

AI 기반 대전 지역 맛집·여행지 추천 챗봇 서비스

## 🎨 Color Palette

**DOL-E**는 대전의 마스코트 **꿈돌이(Kkumdoli)**에서 영감을 받은 노란색 컬러 팔레트를 사용합니다.

- **Primary Yellow**: `#EAB308` (Tailwind: `yellow-500`) - 주요 버튼, 로고, 강조 요소
  - Hover: `yellow-600`
  
- **Secondary Orange**: `#FF8C42` (rgb: 255, 140, 66) - 보조 강조 색상
  - Tailwind: `orange-500`
  
- **Accent Teal**: `#4ECDC4` (rgb: 78, 205, 196) - 배지, 특별 강조 요소
  - Tailwind: `teal-400`

- **Background Amber**: `amber-50` - 히어로 섹션 배경

### Design Guidelines
- **그라데이션 사용하지 않음** - 모든 요소는 단색으로 표현
- 호버 효과: `yellow-500` → `yellow-600`
- 주요 CTA 버튼: `bg-yellow-500 hover:bg-yellow-600`
- 사용자 메시지 버블: `bg-yellow-500`
- 로고 배경: `bg-yellow-500`
- 텍스트 그림자: 노란색 배경의 흰색 텍스트에 `drop-shadow` 적용

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
