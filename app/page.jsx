import HomePageClient from '../src/components/public/HomePageClient';

export const revalidate = 300;

export default function HomePage() {
  return (
    <HomePageClient
      initialAppMode={false}
      initialAppTab="home"
    />
  );
}
