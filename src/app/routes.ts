import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/root-layout";
import { MobileLayout } from "./components/mobile-layout";
import { RouteLoadingFallback, RouteErrorBoundary } from "./components/route-fallbacks";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    // Fallback shown while lazy children hydrate / load for the first time
    HydrateFallback: RouteLoadingFallback,
    // Catches errors from lazy chunk fetches and any child route errors
    ErrorBoundary: RouteErrorBoundary,
    children: [
      // Onboarding/Pricing page as main page
      {
        index: true,
        lazy: async () => {
          const { OnboardingPricingPage } = await import("./components/pages/onboarding-pricing-page");
          return { Component: OnboardingPricingPage };
        },
      },
      {
        path: "app",
        Component: MobileLayout,
        HydrateFallback: RouteLoadingFallback,
        ErrorBoundary: RouteErrorBoundary,
        children: [
          {
            index: true,
            lazy: async () => {
              const { Dashboard } = await import("./components/pages/dashboard");
              return { Component: Dashboard };
            },
          },
          {
            path: "tasks",
            lazy: async () => {
              const { TasksPage } = await import("./components/pages/tasks-page");
              return { Component: TasksPage };
            },
          },
          {
            path: "habits",
            lazy: async () => {
              const { HabitsPage } = await import("./components/pages/habits-page");
              return { Component: HabitsPage };
            },
          },
          {
            path: "mood",
            lazy: async () => {
              const { MoodPage } = await import("./components/pages/mood-page");
              return { Component: MoodPage };
            },
          },
          {
            path: "stats",
            lazy: async () => {
              const { StatsPage } = await import("./components/pages/stats-page");
              return { Component: StatsPage };
            },
          },
          {
            path: "profile",
            lazy: async () => {
              const { ProfilePage } = await import("./components/pages/profile-page");
              return { Component: ProfilePage };
            },
          },
          {
            path: "notifications",
            lazy: async () => {
              const { NotificationsPage } = await import("./components/pages/notifications-page");
              return { Component: NotificationsPage };
            },
          },
          {
            path: "journal",
            lazy: async () => {
              const { JournalPage } = await import("./components/pages/journal-page");
              return { Component: JournalPage };
            },
          },
          {
            path: "anxiety",
            lazy: async () => {
              const { AnxietyPage } = await import("./components/pages/anxiety-page");
              return { Component: AnxietyPage };
            },
          },
          {
            path: "anxiety/grounding",
            lazy: async () => {
              const { GroundingPage } = await import("./components/pages/grounding-page");
              return { Component: GroundingPage };
            },
          },
          {
            path: "sos",
            lazy: async () => {
              const { SOSPage } = await import("./components/pages/sos-page");
              return { Component: SOSPage };
            },
          },
          {
            path: "worry",
            lazy: async () => {
              const { WorryPage } = await import("./components/pages/worry-page");
              return { Component: WorryPage };
            },
          },
          {
            path: "bingo",
            lazy: async () => {
              const { BingoPage } = await import("./components/pages/bingo-page");
              return { Component: BingoPage };
            },
          },
          {
            path: "skills",
            lazy: async () => {
              const { SkillTreePage } = await import("./components/pages/skill-tree-page");
              return { Component: SkillTreePage };
            },
          },
          {
            path: "distortions",
            lazy: async () => {
              const { CognitiveDistortionsPage } = await import(
                "./components/pages/cognitive-distortions-page"
              );
              return { Component: CognitiveDistortionsPage };
            },
          },
          {
            path: "challenge",
            lazy: async () => {
              const { ChallengePage } = await import("./components/pages/challenge-page");
              return { Component: ChallengePage };
            },
          },
          {
            path: "pmr",
            lazy: async () => {
              const { PMRPage } = await import("./components/pages/pmr-page");
              return { Component: PMRPage };
            },
          },
          {
            path: "lifewheel",
            lazy: async () => {
              const { LifeWheelPage } = await import("./components/pages/life-wheel-page");
              return { Component: LifeWheelPage };
            },
          },
          {
            path: "capsule",
            lazy: async () => {
              const { CapsulePage } = await import("./components/pages/capsule-page");
              return { Component: CapsulePage };
            },
          },
          {
            path: "sleep",
            lazy: async () => {
              const { SleepPage } = await import("./components/pages/sleep-page");
              return { Component: SleepPage };
            },
          },
        ],
      },
      // Auth page (login / signup)
      {
        path: "auth",
        lazy: async () => {
          const { AuthRoutePage } = await import("./components/pages/auth-route-page");
          return { Component: AuthRoutePage };
        },
      },
      // Payment success page
      {
        path: "success",
        lazy: async () => {
          const { SuccessPage } = await import("./components/pages/success-page");
          return { Component: SuccessPage };
        },
      },
      // 404 — outside MobileLayout so it shows full-screen
      {
        path: "*",
        lazy: async () => {
          const { NotFoundPage } = await import("./components/pages/not-found-page");
          return { Component: NotFoundPage };
        },
      },
    ],
  },
]);
