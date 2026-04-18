"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Image from "next/image";

interface ImageParallaxProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ImageParallax({ 
  src, 
  alt, 
  className = "h-96 w-full" 
}: ImageParallaxProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, restDelta: 0.001 };
  const yProgressSpring = useSpring(scrollYProgress, springConfig);

  const y = useTransform(yProgressSpring, (value: number) => {
    const percentage = -15 + (value * 30);
    return `${percentage}%`;
  });

  // Astuce : On s'assure qu'il y a toujours une position (relative par défaut, ou absolute si fournie dans className)
  const positionClass = className?.includes("absolute") || className?.includes("fixed") ? "" : "relative";

  return (
    <div 
      ref={containerRef} 
      className={`${positionClass} overflow-hidden rounded-2xl ${className}`}
    >
      <motion.div 
        style={{ y }} 
        className="absolute top-[-15%] left-0 w-full h-[130%]"
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </motion.div>
    </div>
  );
}