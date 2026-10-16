import { useEffect } from 'react';

export function useSiteMeta({ title, description, themeColor, background }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = description;
    }
    if (themeColor) {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = themeColor;
    }
    if (background) {
      document.documentElement.style.backgroundColor = background;
    }
  }, [title, description, themeColor, background]);
}
