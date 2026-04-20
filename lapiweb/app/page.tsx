import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import HeroSection from "@/components/shop/HeroSection";
import MarqueeStrip from "@/components/shop/MarqueeStrip";
import HowItWorksSection from "@/components/shop/HowItWorksSection";
import FeaturedProductsSection from "@/components/shop/FeaturedProductsSection";
import ChefSection from "@/components/shop/ChefSection";
import TestimonialsSection from "@/components/shop/TestimonialsSection";
import CtaBannerSection from "@/components/shop/CtaBannerSection";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <MarqueeStrip />
        <HowItWorksSection />
        <FeaturedProductsSection />
        <ChefSection />
        <TestimonialsSection />
        <CtaBannerSection />
      </main>
      <Footer />
    </>
  );
}
