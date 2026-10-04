import HomePageClient from '../src/components/public/HomePageClient';

export const revalidate = 300;

export default async function HomePage(props) {
  const searchParams = props?.searchParams ? await props.searchParams : {};
  const isApp = searchParams?.app === 'true' || searchParams?.mode === 'app';
  const tab = searchParams?.tab || 'home';

  return (
    <HomePageClient
      initialAppMode={isApp}
      initialAppTab={tab}
    />
  );
}
