import { useState, useEffect } from "react";

export function useHoverCapable() {
  const [capable, setCapable] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCapable(media.matches);
    const listener = (e) => setCapable(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return capable;
}
