import { useEffect } from 'react';

interface UsePageTitleOptions {
  title: string;
  includeBrand?: boolean;
  separator?: string;
}

export function usePageTitle(options: UsePageTitleOptions | string) {
  const config =
    typeof options === 'string'
      ? { title: options, includeBrand: true, separator: ' | ' }
      : { includeBrand: true, separator: ' | ', ...options };

  useEffect(() => {
    const brandName = 'ReSeich';
    const fullTitle = config.includeBrand ? `${config.title}${config.separator}${brandName}` : config.title;

    // Update the document title
    document.title = fullTitle;

    // Cleanup function to restore default title when component unmounts
    return () => {
      document.title = `${brandName} - Sei Research & DeSci Platform`;
    };
  }, [config.title, config.includeBrand, config.separator]);
}

// Convenience function for simple titles
export function useSimplePageTitle(title: string) {
  usePageTitle({ title, includeBrand: false });
}
