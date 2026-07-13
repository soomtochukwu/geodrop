"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  variant?: "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale-up";
  duration?: number;
  delay?: number;
  threshold?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  variant = "slide-up",
  duration = 0.6,
  delay = 0,
  threshold = 0.1,
  className = "",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [threshold]);

  const baseStyles = "transition-all ease-out";
  const durationStyle = {
    transitionDuration: `${duration}s`,
    transitionDelay: `${delay}s`,
  };

  const variants = {
    fade: "opacity-0",
    "slide-up": "opacity-0 translate-y-8",
    "slide-down": "opacity-0 -translate-y-8",
    "slide-left": "opacity-0 translate-x-8",
    "slide-right": "opacity-0 -translate-x-8",
    "scale-up": "opacity-0 scale-95",
  };

  const activeClasses = isVisible
    ? "opacity-100 translate-y-0 translate-x-0 scale-100"
    : variants[variant];

  return (
    <div ref={ref} className={`${baseStyles} ${className} ${activeClasses}`} style={durationStyle}>
      {children}
    </div>
  );
}

interface ScrollWordRevealProps {
  text: string;
  className?: string;
}

export function ScrollWordReveal({ text, className = "" }: ScrollWordRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Helper to find the scrollable parent container
    const getScrollParent = (node: HTMLElement | null): HTMLElement | Window => {
      if (node === null) return window;
      const overflowY = window.getComputedStyle(node).overflowY;
      const isScrollable = overflowY === "auto" || overflowY === "scroll";
      if (isScrollable && node.scrollHeight > node.clientHeight) {
        return node;
      }
      return getScrollParent(node.parentElement);
    };

    const scrollContainer = getScrollParent(containerRef.current);

    const handleScroll = () => {
      const element = containerRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress based on position in viewport
      // 0 when the top of the element enters the bottom of the viewport
      // 1 when the bottom of the element exits the top of the viewport
      const totalDist = windowHeight + rect.height;
      const currentDist = windowHeight - rect.top;
      
      const rawProgress = currentDist / totalDist;
      const clamped = Math.max(0, Math.min(1, rawProgress));

      // We want to scale the highlight range: 
      // start highlighting when the element is 30% up the viewport
      // finish highlighting when the element is 70% up the viewport
      const start = 0.3;
      const end = 0.7;
      const scaleProgress = (clamped - start) / (end - start);
      setProgress(Math.max(0, Math.min(1, scaleProgress)));
    };

    // Attach to parent container
    if (scrollContainer === window) {
      window.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleScroll);
    } else {
      scrollContainer.addEventListener("scroll", handleScroll);
      (scrollContainer as HTMLElement).addEventListener("resize", handleScroll);
    }

    // Run once on mount
    handleScroll();

    return () => {
      if (scrollContainer === window) {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      } else {
        scrollContainer.removeEventListener("scroll", handleScroll);
        (scrollContainer as HTMLElement).removeEventListener("resize", handleScroll);
      }
    };
  }, []);

  const words = text.split(" ");
  const totalWords = words.length;

  return (
    <div ref={containerRef} className={`leading-relaxed ${className}`}>
      {words.map((word, index) => {
        // Calculate dynamic word opacity
        const wordStart = index / totalWords;
        const wordEnd = (index + 1) / totalWords;
        
        let opacity = 0.15; // default semi-transparent grey
        if (progress >= wordEnd) {
          opacity = 1.0; // fully revealed
        } else if (progress > wordStart) {
          // linear transition between characters
          const p = (progress - wordStart) / (wordEnd - wordStart);
          opacity = 0.15 + p * 0.85;
        }

        return (
          <span
            key={index}
            className="inline-block mr-[0.25em] transition-colors duration-150"
            style={{
              color: `rgba(var(--foreground-rgb), ${opacity})`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}
