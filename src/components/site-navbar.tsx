"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AudioLinesIcon,
  ClapperboardIcon,
  Code2Icon,
  EyeIcon,
  FileTextIcon,
  FlaskConicalIcon,
  Gamepad2Icon,
  ImageIcon,
  LayersIcon,
  MenuIcon,
  MessageSquareTextIcon,
  MicIcon,
  ScaleIcon,
  Table2Icon,
  TimerIcon,
  XIcon,
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavGridCard,
  NavItemMobile,
  NavSmallItem,
  type NavItemType,
} from "@/components/ui/navigation-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const modelLinks: NavItemType[] = [
  {
    title: "Text Generation",
    href: "/hub?task=text-generation",
    description: "LLMs, chat & instruct models",
    icon: MessageSquareTextIcon,
  },
  {
    title: "Computer Vision",
    href: "/hub?task=image-text-to-text",
    description: "Detection, segmentation & OCR",
    icon: EyeIcon,
  },
  {
    title: "Audio",
    href: "/hub?task=automatic-speech-recognition",
    description: "ASR, TTS & audio classification",
    icon: AudioLinesIcon,
  },
  {
    title: "Multimodal",
    href: "/hub?task=any-to-any",
    description: "Vision-language & unified models",
    icon: LayersIcon,
  },
  { title: "Embeddings", href: "/hub?task=feature-extraction", icon: Code2Icon },
  { title: "Image Classification", href: "/hub?task=image-classification", icon: Table2Icon },
  { title: "Text-to-Video", href: "/hub?task=text-to-video", icon: TimerIcon },
  { title: "Object Detection", href: "/hub?task=object-detection", icon: Gamepad2Icon },
];



export const datasetLinks: NavItemType[] = [
  {
    title: "All Datasets",
    href: "/hub?view=datasets",
    description: "Browse every dataset on the Hub",
    icon: FileTextIcon,
  },
  {
    title: "Arena",
    href: "/arena",
    description: "Chat with any open model, bring your own key",
    icon: FlaskConicalIcon,
  },
  {
    title: "Trending",
    href: "/hub?view=datasets&sort=trendingScore",
    description: "What the community is training on",
    icon: ImageIcon,
  },
  {
    title: "Most Downloaded",
    href: "/hub?view=datasets&sort=downloads",
    description: "Battle-tested corpora",
    icon: MicIcon,
  },
  {
    title: "Newest",
    href: "/hub?view=datasets&sort=lastModified",
    description: "Fresh drops, indexed live",
    icon: ClapperboardIcon,
  },
  {
    title: "Most Liked",
    href: "/hub?view=datasets&sort=likes",
    description: "Community favorites",
    icon: LayersIcon,
  },
  {
    title: "Open License",
    href: "/hub?view=datasets&license=mit",
    description: "Permissive corpora, ready to ship",
    icon: ScaleIcon,
  },
];

export function SiteNavbar() {
  const [embedded, setEmbedded] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (window.self !== window.top) queueMicrotask(() => setEmbedded(true));
  }, []);

  if (embedded || pathname?.startsWith("/playground")) return null;

  return (
    <div className="sticky top-4 z-50 mx-auto mt-4 w-[calc(100%-2rem)] max-w-5xl border-2 border-ink bg-paper">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Vulpix home"
        >
          <Image
            src="/vulpix-logo.png"
            alt="Vulpix logo"
            width={48}
            height={48}
            priority
            sizes="48px"
            className="h-10 w-auto md:h-12"
          />
          <span className="text-xl font-bold tracking-tight text-exotic">
            Vulpix
          </span>
        </Link>
        <DesktopMenu />
        <div className="flex items-center gap-2">
          <Button
            asChild
            className="hidden border-2 border-exotic bg-exotic text-paper hover:bg-paper hover:text-exotic sm:inline-flex"
          >
            <Link href="/hub">Enter Hub</Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </div>
  );
}

function DesktopMenu() {
  return (
    <NavigationMenu className="hidden lg:block">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="label text-exotic">
            Models
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-full md:w-4xl md:grid-cols-[1fr_.30fr]">
              <ul className="grid grow gap-4 p-4 md:grid-cols-3 md:border-r">
                {modelLinks.slice(0, 3).map((link) => (
                  <li key={link.title}>
                    <NavGridCard link={link} />
                  </li>
                ))}
              </ul>
              <ul className="space-y-1 p-4">
                {modelLinks.slice(3).map((link) => (
                  <li key={link.title}>
                    <NavSmallItem item={link} href={link.href} />
                  </li>
                ))}
              </ul>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="label text-exotic">
            Datasets
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-full md:w-4xl md:grid-cols-[1fr_.30fr]">
              <ul className="grid grow gap-4 p-4 md:grid-cols-2 md:border-r">
                {datasetLinks.slice(0, 2).map((link) => (
                  <li key={link.title}>
                    <NavGridCard link={link} />
                  </li>
                ))}
              </ul>
              <ul className="space-y-1 p-4">
                {datasetLinks.slice(2).map((link) => (
                  <li key={link.title}>
                    <NavSmallItem item={link} href={link.href} />
                  </li>
                ))}
              </ul>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            asChild
            className="label text-exotic cursor-pointer"
          >
            <Link href="/playground">Playground</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            asChild
            className="label text-exotic cursor-pointer"
          >
            <Link href="/arena">Arena</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function MobileNav() {
  const sections = [
    { id: "models", name: "Models", list: modelLinks },
    { id: "datasets", name: "Datasets", list: datasetLinks },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="hover:bg-paper/20 hover:text-paper lg:hidden"
        >
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-full gap-0 border-l-2 border-ink bg-exotic text-paper shadow-none"
        showCloseButton={false}
      >
        <div className="flex h-14 items-center justify-end border-b px-4">
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="hover:bg-paper/20 hover:text-paper"
            >
              <XIcon className="size-5" />
              <span className="sr-only">Close</span>
            </Button>
          </SheetClose>
        </div>
        <div className="container grid gap-y-2 overflow-y-auto px-4 pt-5 pb-12">
          <Accordion type="single" collapsible>
            {sections.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="capitalize hover:no-underline">
                  {section.name}
                </AccordionTrigger>
                <AccordionContent className="space-y-1">
                  <ul className="grid gap-1">
                    {section.list.map((link) => (
                      <li key={link.title}>
                        <SheetClose asChild>
                          <NavItemMobile item={link} href={link.href} />
                        </SheetClose>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
            <AccordionItem value="direct" className="border-b-0">
              <div className="flex gap-2 py-4">
                <Button
                  asChild
                  className="flex-1 border-2 border-paper bg-paper text-exotic hover:bg-exotic hover:text-paper"
                >
                  <Link href="/playground">Playground</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-paper text-paper hover:bg-paper hover:text-exotic"
                >
                  <Link href="/arena">Arena</Link>
                </Button>
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}
