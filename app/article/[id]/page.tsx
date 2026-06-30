import { notFound, redirect } from 'next/navigation';
import { getArticleById } from '@/lib/db';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ArticleRedirectPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getArticleById(id);

  if (!result) {
    notFound();
  }

  // Redirect to the proper URL structure
  redirect(`/${result.categorySlug}/${result.article.slug}`);
}
