import crypto from 'crypto';
import { query, queryOne, transaction } from './db-connection';
import type { KnowledgeBase, Category, Article, FAQ } from '@/types';

// Format-preserving ID generator: `{prefix}_{epoch}_{12 hex chars}`.
// Was `Math.random().toString(36).substr(2, 9)` — Math.random is not
// cryptographically random, so IDs were guessable by a determined attacker.
// crypto.randomBytes(6) = 48 bits of true randomness, formatted as 12 hex chars
// to preserve the existing column width.
const genId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

// Category operations
export const getCategories = async (includeAllStatuses: boolean = false): Promise<Category[]> => {
  const statusFilter = includeAllStatuses ? '' : "AND (a.status = 'published' OR a.status IS NULL)";

  // Single JOIN query — replaces N+1 pattern (was: 1 query per category)
  const rows = await query<{
    cat_id: string; cat_slug: string; cat_title: string;
    cat_description: string | null; cat_icon: string | null;
    cat_icon_color: string | null; cat_order: number;
    art_id: string | null; art_slug: string | null; art_title: string | null;
    art_content: string | null; art_excerpt: string | null;
    art_order: number | null; art_views: number | null;
    art_helpful: number | null; art_not_helpful: number | null;
    art_created_at: string | null; art_updated_at: string | null;
    art_status: string | null;
  }>(
    `SELECT
       c.id as cat_id, c.slug as cat_slug, c.title as cat_title,
       c.description as cat_description, c.icon as cat_icon,
       c.icon_color as cat_icon_color, c."order" as cat_order,
       a.id as art_id, a.slug as art_slug, a.title as art_title,
       a.content as art_content, a.excerpt as art_excerpt,
       a."order" as art_order, a.views as art_views,
       a.helpful as art_helpful, a.not_helpful as art_not_helpful,
       a.created_at as art_created_at, a.updated_at as art_updated_at,
       a.status as art_status
     FROM categories c
     LEFT JOIN articles a ON a.category_id = c.id ${statusFilter}
     ORDER BY c."order" ASC, c.created_at ASC, a."order" ASC, a.created_at ASC`
  );

  // Group rows by category
  const categoryMap = new Map<string, Category>();
  for (const row of rows) {
    if (!categoryMap.has(row.cat_id)) {
      categoryMap.set(row.cat_id, {
        id: row.cat_id, slug: row.cat_slug, title: row.cat_title,
        description: row.cat_description || undefined,
        icon: row.cat_icon || undefined,
        iconColor: row.cat_icon_color || undefined,
        order: row.cat_order,
        articles: [],
      });
    }
    if (row.art_id) {
      categoryMap.get(row.cat_id)!.articles.push({
        id: row.art_id, slug: row.art_slug!, title: row.art_title!,
        content: row.art_content!, excerpt: row.art_excerpt || undefined,
        order: row.art_order!, views: row.art_views!,
        helpful: row.art_helpful!, notHelpful: row.art_not_helpful!,
        createdAt: row.art_created_at!, updatedAt: row.art_updated_at!,
        status: (row.art_status as 'published' | 'draft' | 'archived') || 'draft',
      });
    }
  }
  return Array.from(categoryMap.values());
};

export const getCategoryBySlug = async (slug: string, includeAllStatuses: boolean = false): Promise<Category | undefined> => {
  const category = await queryOne<{
    id: string;
    slug: string;
    title: string;
    description: string | null;
    icon: string | null;
    icon_color: string | null;
    order: number;
  }>('SELECT * FROM categories WHERE slug = $1', [slug]);
  
  if (!category) return undefined;
  
  const articles = await getArticlesByCategoryId(category.id, includeAllStatuses);
  
  return {
    id: category.id,
    slug: category.slug,
    title: category.title,
    description: category.description || undefined,
    icon: category.icon || undefined,
    order: category.order,
    articles,
  };
};

export const getCategoryById = async (id: string, includeAllStatuses: boolean = true): Promise<Category | undefined> => {
  const category = await queryOne<{
    id: string;
    slug: string;
    title: string;
    description: string | null;
    icon: string | null;
    icon_color: string | null;
    order: number;
  }>('SELECT * FROM categories WHERE id = $1', [id]);
  
  if (!category) return undefined;
  
  const articles = await getArticlesByCategoryId(category.id, includeAllStatuses);
  
  return {
    id: category.id,
    slug: category.slug,
    title: category.title,
    description: category.description || undefined,
    icon: category.icon || undefined,
    order: category.order,
    articles,
  };
};

export const createCategory = async (category: Omit<Category, 'id' | 'articles'>): Promise<Category> => {
  const id = genId('cat');
  
  await query(
    `INSERT INTO categories (id, slug, title, description, icon, icon_color, "order")
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, category.slug, category.title, category.description || null, category.icon || null, category.iconColor || '#FEF3C7', category.order]
  );
  
  return {
    id,
    ...category,
    articles: [],
  };
};

export const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id' | 'articles'>>): Promise<Category | null> => {
  const setParts: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (updates.slug !== undefined) {
    setParts.push(`slug = $${paramIndex++}`);
    values.push(updates.slug);
  }
  if (updates.title !== undefined) {
    setParts.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    setParts.push(`description = $${paramIndex++}`);
    values.push(updates.description || null);
  }
  if (updates.icon !== undefined) {
    setParts.push(`icon = $${paramIndex++}`);
    values.push(updates.icon || null);
  }
  if (updates.iconColor !== undefined) {
    setParts.push(`icon_color = $${paramIndex++}`);
    values.push(updates.iconColor || null);
  }
  if (updates.order !== undefined) {
    setParts.push(`"order" = $${paramIndex++}`);
    values.push(updates.order);
  }
  
  if (setParts.length === 0) {
    const category = await getCategoryById(id);
    return category || null;
  }
  
  values.push(id);
  await query(
    `UPDATE categories SET ${setParts.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
  
  const updatedCategory = await getCategoryById(id);
  return updatedCategory || null;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  const result = await query('DELETE FROM categories WHERE id = $1', [id]);
  return result.length > 0;
};

// Article operations
const getArticlesByCategoryId = async (categoryId: string, includeAllStatuses: boolean = false): Promise<Article[]> => {
  const statusFilter = includeAllStatuses ? '' : "AND (a.status = 'published' OR a.status IS NULL)";
  const rows = await query<{
    id: string;
    category_id: string;
    slug: string;
    title: string;
    content: string;
    excerpt: string | null;
    order: number;
    views: number;
    helpful: number;
    not_helpful: number;
    created_at: string;
    updated_at: string;
    status: string | null;
    publisher_id: string | null;
    last_modified_by: string | null;
    publisher_name: string | null;
    last_modified_by_name: string | null;
  }>(
    `SELECT a.*, 
     pu.name as publisher_name, 
     mu.name as last_modified_by_name
     FROM articles a
     LEFT JOIN users pu ON a.publisher_id = pu.id
     LEFT JOIN users mu ON a.last_modified_by = mu.id
     WHERE a.category_id = $1 ${statusFilter} 
     ORDER BY a."order" ASC, a.created_at ASC`,
    [categoryId]
  );
  
  return rows.map(row => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    excerpt: row.excerpt || undefined,
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    views: row.views,
    helpful: row.helpful,
    notHelpful: row.not_helpful,
    status: (row.status as 'published' | 'draft' | 'archived') || 'draft',
    publisherId: row.publisher_id || undefined,
    lastModifiedBy: row.last_modified_by || undefined,
    publisherName: row.publisher_name || undefined,
    lastModifiedByName: row.last_modified_by_name || undefined,
  }));
};

export const getArticle = async (categorySlug: string, articleSlug: string, includeAllStatuses: boolean = false): Promise<Article | null> => {
  const statusFilter = includeAllStatuses ? '' : "AND (a.status = 'published' OR a.status IS NULL)";
  const row = await queryOne<{
    id: string;
    category_id: string;
    slug: string;
    title: string;
    content: string;
    excerpt: string | null;
    order: number;
    views: number;
    helpful: number;
    not_helpful: number;
    created_at: string;
    updated_at: string;
    status: string | null;
    publisher_id: string | null;
    last_modified_by: string | null;
    publisher_name: string | null;
    last_modified_by_name: string | null;
  }>(
    `SELECT a.*, 
     pu.name as publisher_name, 
     mu.name as last_modified_by_name
     FROM articles a
     JOIN categories c ON a.category_id = c.id
     LEFT JOIN users pu ON a.publisher_id = pu.id
     LEFT JOIN users mu ON a.last_modified_by = mu.id
     WHERE c.slug = $1 AND a.slug = $2 ${statusFilter}`,
    [categorySlug, articleSlug]
  );
  
  if (!row) return null;
  
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    excerpt: row.excerpt || undefined,
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    views: row.views,
    helpful: row.helpful,
    notHelpful: row.not_helpful,
    status: (row.status as 'published' | 'draft' | 'archived') || 'draft',
    publisherId: row.publisher_id || undefined,
    lastModifiedBy: row.last_modified_by || undefined,
    publisherName: row.publisher_name || undefined,
    lastModifiedByName: row.last_modified_by_name || undefined,
  };
};

export const getArticleById = async (articleId: string): Promise<{ article: Article; categorySlug: string } | null> => {
  const row = await queryOne<{
    id: string;
    category_id: string;
    slug: string;
    title: string;
    content: string;
    excerpt: string | null;
    order: number;
    views: number;
    helpful: number;
    not_helpful: number;
    created_at: string;
    updated_at: string;
    status: string | null;
    category_slug: string;
    publisher_id: string | null;
    last_modified_by: string | null;
    publisher_name: string | null;
    last_modified_by_name: string | null;
  }>(
    `SELECT a.*, 
     c.slug as category_slug,
     pu.name as publisher_name, 
     mu.name as last_modified_by_name
     FROM articles a
     JOIN categories c ON a.category_id = c.id
     LEFT JOIN users pu ON a.publisher_id = pu.id
     LEFT JOIN users mu ON a.last_modified_by = mu.id
     WHERE a.id = $1`,
    [articleId]
  );
  
  if (!row) return null;
  
  return {
    article: {
      id: row.id,
      slug: row.slug,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt || undefined,
      order: row.order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      views: row.views,
      helpful: row.helpful,
      notHelpful: row.not_helpful,
      status: (row.status as 'published' | 'draft' | 'archived') || 'draft',
      publisherId: row.publisher_id || undefined,
      lastModifiedBy: row.last_modified_by || undefined,
      publisherName: row.publisher_name || undefined,
      lastModifiedByName: row.last_modified_by_name || undefined,
    },
    categorySlug: row.category_slug,
  };
};

export const incrementArticleViews = async (articleId: string): Promise<void> => {
  await query('UPDATE articles SET views = views + 1 WHERE id = $1', [articleId]);
};

export const createArticle = async (
  categoryId: string,
  article: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'helpful' | 'notHelpful'>,
  userId?: string
): Promise<Article | null> => {
  const category = await getCategoryById(categoryId);
  if (!category) return null;
  
  const id = genId('art');
  const now = new Date().toISOString();
  const status = article.status || 'draft';
  
  await query(
    `INSERT INTO articles (id, category_id, slug, title, content, excerpt, "order", status, publisher_id, last_modified_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, categoryId, article.slug, article.title, article.content, article.excerpt || null, article.order, status, userId || null, userId || null]
  );
  
  // Create article history
  if (userId) {
    try {
      const { createArticleHistory } = await import('./db-users');
      await createArticleHistory(id, categoryId, userId, 'created');
    } catch (error) {
      console.error('Failed to create article history:', error);
      // Continue even if history fails
    }
  }
  
  return {
    id,
    ...article,
    status,
    publisherId: userId,
    lastModifiedBy: userId,
    createdAt: now,
    updatedAt: now,
    views: 0,
    helpful: 0,
    notHelpful: 0,
  };
};

export const updateArticle = async (
  categoryId: string,
  articleId: string,
  updates: Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'helpful' | 'notHelpful'>>,
  userId?: string
): Promise<Article | null> => {
  const setParts: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (updates.slug !== undefined) {
    setParts.push(`slug = $${paramIndex++}`);
    values.push(updates.slug);
  }
  if (updates.title !== undefined) {
    setParts.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    setParts.push(`content = $${paramIndex++}`);
    values.push(updates.content);
  }
  if (updates.excerpt !== undefined) {
    setParts.push(`excerpt = $${paramIndex++}`);
    values.push(updates.excerpt || null);
  }
  if (updates.order !== undefined) {
    setParts.push(`"order" = $${paramIndex++}`);
    values.push(updates.order);
  }
  if (updates.status !== undefined) {
    setParts.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  if (userId) {
    setParts.push(`last_modified_by = $${paramIndex++}`);
    values.push(userId);
  }
  
  if (setParts.length === 0) {
    const row = await queryOne<{
      id: string;
      slug: string;
      title: string;
      content: string;
      excerpt: string | null;
      order: number;
      views: number;
      helpful: number;
      not_helpful: number;
      created_at: string;
      updated_at: string;
      status: string | null;
      publisher_id: string | null;
      last_modified_by: string | null;
      publisher_name: string | null;
      last_modified_by_name: string | null;
    }>(
      `SELECT a.*, 
       pu.name as publisher_name, 
       mu.name as last_modified_by_name
       FROM articles a
       LEFT JOIN users pu ON a.publisher_id = pu.id
       LEFT JOIN users mu ON a.last_modified_by = mu.id
       WHERE a.id = $1 AND a.category_id = $2`,
      [articleId, categoryId]
    );
    
    if (!row) return null;
    
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt || undefined,
      order: row.order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      views: row.views,
      helpful: row.helpful,
      notHelpful: row.not_helpful,
      status: (row.status as 'published' | 'draft' | 'archived') || 'draft',
      publisherId: row.publisher_id || undefined,
      lastModifiedBy: row.last_modified_by || undefined,
      publisherName: row.publisher_name || undefined,
      lastModifiedByName: row.last_modified_by_name || undefined,
    };
  }
  
  values.push(articleId, categoryId);
  await query(
    `UPDATE articles SET ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} AND category_id = $${paramIndex + 1}`,
    values
  );
  
  // Create article history
  if (userId && setParts.length > 0) {
    try {
      const { createArticleHistory } = await import('./db-users');
      const action = updates.status ? (updates.status === 'published' ? 'published' : updates.status === 'archived' ? 'archived' : 'updated') : 'updated';
      await createArticleHistory(articleId, categoryId, userId, action, updates);
    } catch (error) {
      console.error('Failed to create article history:', error);
      // Continue even if history fails
    }
  }
  
  const row = await queryOne<{
    id: string;
    slug: string;
    title: string;
    content: string;
    excerpt: string | null;
    order: number;
    views: number;
    helpful: number;
    not_helpful: number;
    created_at: string;
    updated_at: string;
    status: string | null;
    publisher_id: string | null;
    last_modified_by: string | null;
    publisher_name: string | null;
    last_modified_by_name: string | null;
  }>(
    `SELECT a.*, 
     pu.name as publisher_name, 
     mu.name as last_modified_by_name
     FROM articles a
     LEFT JOIN users pu ON a.publisher_id = pu.id
     LEFT JOIN users mu ON a.last_modified_by = mu.id
     WHERE a.id = $1 AND a.category_id = $2`,
    [articleId, categoryId]
  );
  
  if (!row) return null;
  
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    excerpt: row.excerpt || undefined,
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    views: row.views,
    helpful: row.helpful,
    notHelpful: row.not_helpful,
    status: (row.status as 'published' | 'draft' | 'archived') || 'draft',
  };
};

export const deleteArticle = async (categoryId: string, articleId: string): Promise<boolean> => {
  const result = await query('DELETE FROM articles WHERE id = $1 AND category_id = $2', [articleId, categoryId]);
  return result.length > 0;
};

// FAQ operations
export const getFAQs = async (): Promise<FAQ[]> => {
  const rows = await query<{
    id: string;
    title: string;
    content: string;
    order: number;
    created_at: string;
  }>('SELECT * FROM faqs ORDER BY "order" ASC, created_at ASC');
  
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    order: row.order,
    createdAt: row.created_at,
  }));
};

export const getFAQById = async (id: string): Promise<FAQ | null> => {
  const row = await queryOne<{
    id: string;
    title: string;
    content: string;
    order: number;
    created_at: string;
  }>('SELECT * FROM faqs WHERE id = $1', [id]);
  
  if (!row) return null;
  
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    order: row.order,
    createdAt: row.created_at,
  };
};

export const createFAQ = async (faq: Omit<FAQ, 'id' | 'createdAt'>): Promise<FAQ> => {
  const id = genId('faq');
  const now = new Date().toISOString();
  
  await query(
    `INSERT INTO faqs (id, title, content, "order")
     VALUES ($1, $2, $3, $4)`,
    [id, faq.title, faq.content, faq.order]
  );
  
  return {
    id,
    ...faq,
    createdAt: now,
  };
};

export const updateFAQ = async (id: string, updates: Partial<Omit<FAQ, 'id' | 'createdAt'>>): Promise<FAQ | null> => {
  const setParts: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (updates.title !== undefined) {
    setParts.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    setParts.push(`content = $${paramIndex++}`);
    values.push(updates.content);
  }
  if (updates.order !== undefined) {
    setParts.push(`"order" = $${paramIndex++}`);
    values.push(updates.order);
  }
  
  if (setParts.length === 0) {
    return getFAQById(id);
  }
  
  values.push(id);
  await query(`UPDATE faqs SET ${setParts.join(', ')} WHERE id = $${paramIndex}`, values);
  
  return getFAQById(id);
};

export const deleteFAQ = async (id: string): Promise<boolean> => {
  const result = await query('DELETE FROM faqs WHERE id = $1', [id]);
  return result.length > 0;
};

// Search functionality using PostgreSQL Full-Text Search (FTS)
// Split a free-form question into search tokens.
// - Lowercase
// - Strip punctuation
// - Drop tokens shorter than 2 chars (noise)
// - Drop a small Mongolian/English stopword set
const STOPWORDS = new Set([
  // English connectors
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'to', 'of', 'in', 'on', 'and', 'or', 'how', 'what', 'do', 'i',
  // Mongolian — common question words / particles that don't help retrieval
  'вэ', 'юу', 'тэр', 'энэ', 'би', 'та', 'миний', 'түүний', 'нь', 'ч', 'л', 'ба', 'болон', 'мөн', 'эсвэл',
]);

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ') // keep letters, numbers, hyphens
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

// Build a tsquery joining tokens with `|` (OR) so articles matching ANY term
// surface. Rank then prioritizes articles matching more terms / earlier weights.
function buildOrTsquery(tokens: string[]): string | null {
  if (tokens.length === 0) return null;
  // Escape single quotes inside each token, wrap each in single quotes for safety.
  return tokens.map((t) => `'${t.replace(/'/g, "''")}'`).join(' | ');
}

export const searchArticles = async (
  searchQuery: string,
  includeAllStatuses: boolean = false
): Promise<Array<Article & { categorySlug: string }>> => {
  try {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return [];

    const statusFilter = includeAllStatuses
      ? ''
      : "AND (a.status = 'published' OR a.status IS NULL)";

    const tokens = tokenize(trimmedQuery);
    const orTsquery = buildOrTsquery(tokens);

    type Row = {
      id: string;
      category_id: string;
      slug: string;
      title: string;
      content: string;
      excerpt: string | null;
      order: number;
      views: number;
      helpful: number;
      not_helpful: number;
      created_at: string;
      updated_at: string;
      status: string | null;
      category_slug: string;
      rank?: number;
    };

    let rows: Row[] = [];

    // FTS path — only if we have tokens. Use `to_tsquery` directly so we can
    // control AND/OR; plainto_tsquery always ANDs which is too strict for
    // natural-language questions.
    if (orTsquery) {
      try {
        rows = await query<Row>(
          `SELECT
             a.*,
             c.slug AS category_slug,
             ts_rank_cd(a.search_vector, to_tsquery('simple', $1), 32) AS rank
           FROM articles a
           JOIN categories c ON a.category_id = c.id
           WHERE a.search_vector IS NOT NULL
             AND a.search_vector @@ to_tsquery('simple', $1)
             ${statusFilter}
           ORDER BY rank DESC, a.views DESC, a.created_at DESC
           LIMIT 100`,
          [orTsquery]
        );
      } catch (err: any) {
        // search_vector missing or tsquery syntax error → fall through to ILIKE
        console.log('FTS search failed, falling back to ILIKE:', err.message);
        rows = [];
      }
    }

    // ILIKE fallback: match if ANY token appears in title/excerpt/content.
    // Rank by how many tokens hit, with title hits weighted highest.
    if (rows.length === 0) {
      const fallbackTokens = tokens.length > 0 ? tokens : [trimmedQuery];
      const patterns = fallbackTokens.map((t) => `%${t}%`);
      const placeholders = fallbackTokens.map((_, i) => `$${i + 1}`);

      const titleScore = placeholders.map((p) => `(a.title ILIKE ${p})::int * 3`).join(' + ');
      const excerptScore = placeholders
        .map((p) => `(COALESCE(a.excerpt, '') ILIKE ${p})::int * 2`)
        .join(' + ');
      const contentScore = placeholders.map((p) => `(a.content ILIKE ${p})::int`).join(' + ');
      const whereAnyMatch = placeholders
        .map(
          (p) =>
            `(a.title ILIKE ${p} OR a.content ILIKE ${p} OR COALESCE(a.excerpt, '') ILIKE ${p})`
        )
        .join(' OR ');

      try {
        rows = await query<Row>(
          `SELECT a.*, c.slug AS category_slug,
                  (${titleScore} + ${excerptScore} + ${contentScore}) AS rank
           FROM articles a
           JOIN categories c ON a.category_id = c.id
           WHERE (${whereAnyMatch})
             ${statusFilter}
           ORDER BY rank DESC, a.views DESC, a.created_at DESC
           LIMIT 100`,
          patterns
        );
      } catch (err: any) {
        console.error('ILIKE fallback failed:', err);
        rows = [];
      }
    }

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt || undefined,
      order: row.order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      views: row.views,
      helpful: row.helpful,
      notHelpful: row.not_helpful,
      status: (row.status as 'published' | 'draft' | 'archived') || 'draft',
      categorySlug: row.category_slug,
    }));
  } catch (error: any) {
    console.error('Search function error:', error);
    return [];
  }
};

// Get most read articles
export const getMostReadArticles = async (limit: number = 10, includeAllStatuses: boolean = false): Promise<Array<Article & { categorySlug: string }>> => {
  const statusFilter = includeAllStatuses ? '' : "WHERE (a.status = 'published' OR a.status IS NULL)";
  const rows = await query<{
    id: string;
    category_id: string;
    slug: string;
    title: string;
    content: string;
    excerpt: string | null;
    order: number;
    views: number;
    helpful: number;
    not_helpful: number;
    created_at: string;
    updated_at: string;
    status: string | null;
    category_slug: string;
  }>(
    `SELECT a.*, c.slug as category_slug
     FROM articles a
     JOIN categories c ON a.category_id = c.id
     ${statusFilter}
     ORDER BY a.views DESC
     LIMIT $1`,
    [limit]
  );
  
  return rows.map(row => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    excerpt: row.excerpt || undefined,
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    views: row.views,
    helpful: row.helpful,
    notHelpful: row.not_helpful,
    status: (row.status as 'published' | 'draft' | 'archived') || 'draft',
    categorySlug: row.category_slug,
  }));
};
