"use client";
import { useRef } from "react";
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring 
} from "framer-motion";

interface ParallaxProps {
  children: React.ReactNode;
  distance?: number;
  className?: string;
}

export default function ParallaxSection({ 
  children, 
  distance = 100, 
  className = "" 
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, restDelta: 0.001 };
  const yProgressSpring = useSpring(scrollYProgress, springConfig);
  
  // on utilise une fonction de calcul direct. C'est 100% "TypeScript-proof".
  const y = useTransform(yProgressSpring, (value: number) => {
    // "value" va de 0 (début) à 1 (fin)
    // Si distance = 100 :
    // Quand value = 0 => 100 - (0 * 200) = 100
    // Quand value = 1 => 100 - (1 * 200) = -100
    return distance - (value * distance * 2);
  });

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}