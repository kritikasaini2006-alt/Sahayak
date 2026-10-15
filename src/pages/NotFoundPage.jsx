import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import Button from '../components/common/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useTranslation } from '../context/LanguageContext';

export default function NotFoundPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.title', 'Page Not Found'));

  return (
    <div className="py-20 text-center space-y-6 max-w-md mx-auto px-4">
      <div className="w-16 h-16 rounded-2xl bg-navy-50 text-navy-800 font-extrabold text-2xl flex items-center justify-center mx-auto border border-navy-100">
        404
      </div>
      <h1 className="text-2xl font-bold text-navy-900">{t('notFound.title')}</h1>
      <p className="text-xs sm:text-sm text-slate-500">
        {t('notFound.desc')}
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link to="/">
          <Button variant="primary" size="sm" icon={Home}>
            {t('notFound.backHome')}
          </Button>
        </Link>
        <Link to="/schemes">
          <Button variant="outline" size="sm" icon={Compass}>
            {t('notFound.discoverSchemes')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

