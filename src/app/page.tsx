import { Preloader } from "@/components/preloader";
import { Hero } from "@/components/sections/hero";
import { Manifesto } from "@/components/sections/manifesto";
import { Pillars } from "@/components/sections/pillars";
import { Marquee } from "@/components/sections/marquee";
import { Ecosystem } from "@/components/sections/ecosystem";
import { OpenSource } from "@/components/sections/open-source";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Pricing } from "@/components/sections/pricing";
import { Faq } from "@/components/sections/faq";
import { MegaFooter } from "@/components/sections/mega-footer";

export default function Home() {
  return (
    <>
      <Preloader />
      <Hero />
      <Manifesto />
      <Pillars />
      <Marquee />
      <Ecosystem />
      <OpenSource />
      <HowItWorks />
      <Pricing />
      <Faq />
      <MegaFooter />
    </>
  );
}
