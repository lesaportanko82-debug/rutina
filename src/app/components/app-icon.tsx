import { type LucideIcon, Leaf, Droplets, Salad, Pill, Sunrise, Moon, CandyOff, Sparkles,
  Mountain, Dumbbell, Footprints, Timer, Bike, Activity, Waves,
  Brain, PenLine, Wind, PhoneOff, BookOpen, Unplug, MessageCircle, Rainbow,
  Globe, ClipboardList, BarChart3, Target, Puzzle, Mail, Palette,
  CloudLightning, CircleSlash, Eye, Infinity, UserX, HeartCrack, Ruler, Search, Tag, Filter,
  Telescope, ScrollText, ScanFace,
  Hand, Heart, Coffee, Music, HeartPulse, Briefcase, Wallet, Users, Pin,
  Scale, Flower2, Smile, Sprout, TreePine, TreeDeciduous, Home, Crown, Wand2,
  RefreshCw, Headphones, Phone, Apple, ShowerHead, Cloud, BedDouble, Cat,
  Route, Sun, Ban, HeartHandshake, Wheat, PartyPopper,
  Library, Smartphone, Utensils, Wine, Bath,
  Flame, Volume2, CloudRain, Shield,
  CircleDot, Star, Feather, Orbit, Check,
  PersonStanding, Ear, Grab, CircleAlert, Frown, Angry, Meh, SmilePlus,
  Hourglass, Package, Zap } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  // Nature / Plants
  "\u{1F33F}": Leaf,
  "\u{1F331}": Sprout,
  "\u{1F33E}": Wheat,
  "\u{1F338}": Flower2,
  "\u{1F332}": TreePine,
  "\u{1F333}": TreeDeciduous,
  "\u{1F334}": TreeDeciduous,
  "\u{1FAB7}": Flower2,
  "\u{1F33B}": Sun,

  // Weather / Sky
  "\u{1F319}": Moon,
  "\u{1F305}": Sunrise,
  "\u2601\uFE0F": Cloud,
  "\u{1F324}\uFE0F": Sun,
  "\u{1F327}\uFE0F": CloudRain,
  "\u{1F308}": Rainbow,
  "\u{1F30A}": Waves,

  // Health / Body
  "\u{1F4A7}": Droplets,
  "\u{1F957}": Salad,
  "\u{1F48A}": Pill,
  "\u{1F36C}": CandyOff,
  "\u2728": Sparkles,
  "\u{1F9CD}": PersonStanding,
  "\u2764\uFE0F": Heart,
  "\u{1F494}": HeartCrack,
  "\u{1F495}": Heart,
  "\u{1F49C}": Heart,
  "\u{1F49B}": Heart,
  "\u{1F3E5}": HeartPulse,
  "\u{1F630}": CloudLightning,

  // Fitness / Movement
  "\u{1F3D4}\uFE0F": Mountain,
  "\u{1F4AA}": Dumbbell,
  "\u{1F6B6}": Footprints,
  "\u{1F463}": Footprints,
  "\u{1F3C3}": Activity,
  "\u{1F938}": Activity,
  "\u{1F9D8}": Brain,
  "\u{1F9D8}\u200D\u2640\uFE0F": Brain,
  "\u{1F3CA}": Waves,
  "\u{1F6B4}": Bike,

  // Mindfulness / Focus
  "\u{1F32C}\uFE0F": Wind,
  "\u{1F4F5}": PhoneOff,
  "\u{1F4F1}": Smartphone,
  "\u{1F50C}": Unplug,
  "\u{1F92B}": Volume2,
  "\u{1F9F9}": Sparkles,
  "\u{1F634}": BedDouble,

  // Writing / Notes
  "\u{1F4DD}": PenLine,
  "\u{1F4D3}": BookOpen,
  "\u{1F4D6}": BookOpen,
  "\u{1F4DA}": Library,
  "\u{1F4CB}": ClipboardList,
  "\u{1F4CA}": BarChart3,
  "\u{1F4DC}": ScrollText,
  "\u{1F4E7}": Mail,
  "\u{1F48C}": Mail,
  "\u{1F4CC}": Pin,

  // Communication
  "\u{1F4AC}": MessageCircle,
  "\u{1F4AD}": MessageCircle,
  "\u{1F4DE}": Phone,
  "\u{1F60A}": Smile,
  "\u{1F917}": HeartHandshake,

  // Creativity / Focus
  "\u{1F3A8}": Palette,
  "\u{1F3AF}": Target,
  "\u{1F9E9}": Puzzle,
  "\u{1F30D}": Globe,

  // Food / Drinks
  "\u2615": Coffee,
  "\u{1F375}": Coffee,
  "\u{1F34E}": Apple,
  "\u{1F955}": Apple,
  "\u{1F355}": Utensils,
  "\u{1F377}": Wine,
  "\u{1F37D}\uFE0F": Utensils,

  // Music / Sound
  "\u{1F3B5}": Music,
  "\u{1F3A7}": Headphones,

  // Cognitive distortions
  "\u{1F32A}\uFE0F": CloudLightning,
  "\u2B1B": CircleSlash,
  "\u{1F52E}": Eye,
  "\u267E\uFE0F": Infinity,
  "\u{1F464}": UserX,
  "\u{1F4CF}": Ruler,
  "\u{1F50D}": Search,
  "\u{1F3F7}\uFE0F": Tag,
  "\u{1F573}\uFE0F": Filter,
  "\u{1F52D}": Telescope,
  "\u{1FA9E}": ScanFace,

  // SOS / Safety
  "\u{1F590}\uFE0F": Hand,
  "\u{1F6E1}\uFE0F": Shield,

  // Social / People
  "\u{1F465}": Users,
  "\u{1F4BC}": Briefcase,
  "\u{1F4B0}": Wallet,
  "\u{1FAC2}": HeartHandshake,

  // Gamification
  "\u{1F330}": CircleDot,
  "\u{1F3E1}": Home,
  "\u{1F98B}": Feather,
  "\u{1F9D9}": Wand2,
  "\u{1F451}": Crown,

  // Activities
  "\u{1F504}": RefreshCw,
  "\u2705": Check,
  "\u{1F345}": Timer,
  "\u{1F388}": PartyPopper,
  "\u{1F389}": PartyPopper,
  "\u{1F64F}": Star,
  "\u{1F6BF}": ShowerHead,
  "\u{1F6C1}": Bath,
  "\u{1FAA7}": Wind,
  "\u{1F6AB}": Ban,
  "\u{1F6E4}\uFE0F": Route,
  "\u{1F431}": Cat,
  "\u{1F525}": Flame,
  "\u{1F3A1}": Orbit,

  // Profile
  "\u262F\uFE0F": Scale,
  "\u{1F3E0}": Home,

  // Senses (grounding)
  "\u{1F441}\uFE0F": Eye,
  "\u{1F442}": Ear,
  "\u270B": Hand,
  "\u{1F443}": Wind,
  "\u{1F445}": Smile,

  // PMR / Body parts
  "\u270A": Grab,
  "\u{1F646}": PersonStanding,
  "\u{1F62C}": Meh,
  "\u{1F992}": Activity,
  "\u{1FAC1}": Wind,
  "\u{1F9B5}": Footprints,
  "\u{1F9B6}": Footprints,
  "\u{1F624}": Angry,
  "\u{1F611}": Meh,

  // Mood emojis
  "\u{1F60C}": Smile,
  "\u{1F604}": SmilePlus,
  "\u{1F914}": Brain,
  "\u{1F622}": Droplets,
  "\u{1F62E}\u200D\u{1F4A8}": Wind,

  // Misc
  "\u{1F4E6}": Package,
  "\u{1FAA3}": Wind,
  "\u231B": Hourglass,
  "\u23F3": Hourglass,
  "\u{1F31F}": Star,
  "\u26A1": Zap,
  "\u{1F989}": Moon,
  "\u{1FAB2}": Leaf,
  "\u{1F7E2}": CircleDot,
  "\u{1F534}": CircleAlert,
  "\u{1FAC0}": HeartHandshake,
};

interface AppIconProps {
  icon: string;
  size?: number;
  color?: string;
  className?: string;
}

export function AppIcon({ icon, size = 16, color, className }: AppIconProps) {
  const LucideComponent = iconMap[icon];

  if (LucideComponent) {
    return (
      <LucideComponent
        className={className}
        style={{
          width: size,
          height: size,
          color: color || "currentColor",
          strokeWidth: 1.8,
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <span
      className={className}
      style={{
        fontSize: size * 0.85,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {icon}
    </span>
  );
}

export function getIconComponent(emoji: string): LucideIcon | undefined {
  return iconMap[emoji];
}