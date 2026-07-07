import { useEffect, useState } from "react";

export const useScroll = () => {
  const [scrolled, setScrolled] = useState(false);

  // Collapse the full-width bar into a floating, container-width pill on scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return scrolled;
};
