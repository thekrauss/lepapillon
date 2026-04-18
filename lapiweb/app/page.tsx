import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import HeroSection from "@/components/shop/HeroSection";
import HowItWorksSection from "@/components/shop/HowItWorksSection";
import FeaturedProductsSection from "@/components/shop/FeaturedProductsSection";
import ChefSection from "@/components/shop/ChefSection";
import TestimonialsSection from "@/components/shop/TestimonialsSection";
import CtaBannerSection from "@/components/shop/CtaBannerSection";
import AuroraWrapper from "@/components/AuroraWrapper";

export default function Home() {
  return (
    <>
      <AuroraWrapper>
        <Header />
        <main>
          <HeroSection />
          <HowItWorksSection />
          <FeaturedProductsSection />
          <ChefSection />
          <TestimonialsSection />
          <CtaBannerSection />
        </main>
        <Footer />
      </AuroraWrapper>
    </>
  );
}
