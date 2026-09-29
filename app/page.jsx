import HomePageClient from '../src/components/public/HomePageClient';

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const appValue = params?.app;
  const modeValue = params?.mode;
  const initialAppMode = appValue === 'true' || modeValue === 'app';
  const requestedTab = typeof params?.tab === 'string' ? params.tab : 'home';

  return (
    <HomePageClient
      initialAppMode={initialAppMode}
      initialAppTab={requestedTab}
    />
  );
}
