import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { articles } from "./content";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
});

function BlogIndex() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            JobAI Blog
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Practical career guidance for job seekers. Real strategies, not
            platitudes.
          </p>
          <div className="space-y-6">
            {articles.map((article) => (
              <motion.article
                key={article.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : 20 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
                  <time>{article.date}</time>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  <Link
                    to="/blog/$slug"
                    params={{ slug: article.slug }}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {article.title}
                  </Link>
                </h2>
                <p className="text-gray-600">{article.excerpt}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
