import { useEffect, useState } from "react";

export const useImages = (prevImages?: { url: string; path: string }[]) => {
  const [images, setPrev] = useState(prevImages);
  const [newImages, setNew] = useState<any[]>();
  useEffect(() => {
    console.log("images changed");
  }, [images]);
  return { images, setPrev, newImages, setNew };
};

export const useImage = (prevImage?: { url: string; path: string }) => {
  const [image, setPrev] = useState(prevImage);
  const [newImage, setNew] = useState<any | File>();
  return { image, setPrev, newImage, setNew };
};

export const useSelectImage = (prev_: string) => {
  const [prev, setPrev] = useState<string>(prev_);
  const [image, setImage] = useState<File | null | undefined>(null);
  const image_link = image ? URL.createObjectURL(image) : undefined;
  return { image, setImage, image_link, prev, setPrev };
};
