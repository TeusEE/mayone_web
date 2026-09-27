import Image from "next/image";
import type { ImageAsset } from "@/types/content";
import { isValidImageSource } from "@/lib/image";
import styles from "@/app/content-pages.module.css";

interface ContentImageProps {
  image: ImageAsset | undefined;
  sizes?: string;
  preload?: boolean;
}

export function ContentImage({ image, sizes = "(max-width: 44rem) 100vw, 40vw", preload = false }: ContentImageProps) {
  if (!image?.alt.trim() || !isValidImageSource(image.src)) return null;

  const src = image.src.trim();
  const remote = /^https:\/\//i.test(src);
  return (
    <div className={styles.media}>
      <Image
        fill
        src={src}
        alt={image.alt.trim()}
        sizes={sizes}
        preload={preload}
        unoptimized={remote}
      />
    </div>
  );
}
