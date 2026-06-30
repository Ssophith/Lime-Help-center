// Database surface — re-exports the Postgres backend.
//
// We used to switch between Postgres and a JSON-file backend at runtime;
// only Postgres is supported in production, so the file backend was removed
// (see git history if you need to revive it).
export {
  // Categories
  getCategories,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  // Articles
  getArticle,
  getArticleById,
  incrementArticleViews,
  createArticle,
  updateArticle,
  deleteArticle,
  // FAQs
  getFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  // Search + stats
  searchArticles,
  getMostReadArticles,
} from './db-pg';
