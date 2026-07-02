import { notFound } from 'next/navigation';
import storiesData from '../../../public/stories.json';
import DetailClient from './DetailClient';

export async function generateStaticParams() {
  return storiesData
    .filter(s => s.path)
    .map(s => ({ path: encodeURIComponent(s.path) }));
}

export async function generateMetadata({ params }) {
  const p = decodeURIComponent(params.path);
  const story = storiesData.find(s => s.path === p);
  if (!story) return {};
  return {
    title: `${story.titulo} · Fabada Musical`,
    description: story.description ?? `Cuento FABA · ${story.path}`,
  };
}

export default function DetailPage({ params }) {
  const p = decodeURIComponent(params.path);
  const story = storiesData.find(s => s.path === p);
  if (!story) notFound();
  return <DetailClient story={story} />;
}
