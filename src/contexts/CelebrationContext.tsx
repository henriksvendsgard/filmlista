"use client";

import { fireConfetti } from "@/lib/confetti";
import { useSupabase } from "@/components/SupabaseProvider";
import { Check, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";

const WELCOME_LOGIN_KEY = "filmlista-welcome-login";
const CURTAIN_HANG_MS = 500;
const CURTAIN_OPEN_MS = 2400;
const WELCOME_DISPLAY_MS = 650;
const WELCOME_FADE_MS = 700;

export function setWelcomeAfterLogin() {
    if (typeof window !== "undefined") {
        sessionStorage.setItem(WELCOME_LOGIN_KEY, "1");
    }
}

type WelcomeMode = "login";

interface WatchedMoment {
    title: string;
    mediaType: "movie" | "tv";
}

interface CelebrationContextValue {
    celebrateWatched: (moment: WatchedMoment) => void;
}

const CelebrationContext = createContext<CelebrationContextValue | undefined>(undefined);

function FilmlistaLogo({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 87 97" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path
                d="M22.2615 0.368028C13.096 0.980574 7.65115 3.09045 4.54305 7.21946C2.11555 10.4637 1.04927 14.0028 0.323288 21.3307C-0.107763 25.5958 -0.107763 78.5016 0.323288 82.245C1.11733 89.3687 2.47854 92.1138 6.44875 94.6774C8.53594 96.0159 10.7139 96.6512 13.3002 96.6512C15.4101 96.6512 15.5008 96.6285 17.2704 95.6756C18.2913 95.1538 19.9701 94.0422 21.0137 93.2027C23.2824 91.4105 29.8843 84.8313 34.0587 80.1805C39.7077 73.9189 40.5244 73.3064 43.1334 73.3064C44.9484 73.3064 46.0827 73.9189 48.0111 75.9607C61.0788 89.8905 65.48 94.0648 68.9965 95.8344C71.9004 97.2864 75.0993 97.2183 78.3435 95.6302C79.9089 94.8589 80.4987 94.4051 81.9734 92.7944C83.9698 90.6164 84.7865 89.3233 85.4445 87.3495C86.8964 82.9483 87.1006 77.7303 86.9645 48.2147C86.8511 23.0095 86.8057 21.4668 85.7621 16.2942C84.7865 11.3938 83.2665 8.37649 80.3853 5.65407C76.8915 2.31909 72.581 0.9352 63.8919 0.345341C60.0352 0.0730983 26.2317 0.0957852 22.2615 0.368028ZM59.9444 20.6728C61.5098 21.4214 62.3265 23.2591 61.8501 24.9606C61.6232 25.7773 60.1713 27.32 51.0058 36.4629C39.4582 47.9651 39.5943 47.8744 37.7113 47.3072C36.9399 47.0803 35.8283 46.0821 31.4951 41.7943C28.5685 38.8903 26.0502 36.236 25.846 35.873C25.1881 34.6025 25.4377 32.6968 26.4359 31.5625C27.3887 30.4962 29.5667 30.1105 30.9052 30.8138C31.2682 31.018 33.1512 32.7649 35.0796 34.6933L38.5961 38.2324L47.2171 29.6114C51.9586 24.8925 56.1557 20.8543 56.5187 20.6728C57.4035 20.1964 58.9689 20.219 59.9444 20.6728Z"
                fill="currentColor"
            />
        </svg>
    );
}

function clearCelebrationPendingClass() {
    if (typeof document !== "undefined") {
        document.documentElement.classList.remove("celebration-pending");
    }
}

function shouldShowLoginWelcome(): boolean {
    if (typeof window === "undefined") return false;

    if (sessionStorage.getItem(WELCOME_LOGIN_KEY) === "1") {
        sessionStorage.removeItem(WELCOME_LOGIN_KEY);
        return true;
    }

    return false;
}

export function CelebrationProvider({ children }: { children: ReactNode }) {
    const { user } = useSupabase();
    const pathname = usePathname();
    const [welcome, setWelcome] = useState<WelcomeMode | null>(null);
    const [curtainsOpen, setCurtainsOpen] = useState(false);
    const [welcomeFading, setWelcomeFading] = useState(false);
    const [watchedMoment, setWatchedMoment] = useState<WatchedMoment | null>(null);
    const [watchedVisible, setWatchedVisible] = useState(false);
    const welcomeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const curtainTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const watchedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const welcomeStarted = useRef(false);

    const clearWelcomeTimer = () => {
        if (welcomeTimer.current) {
            clearTimeout(welcomeTimer.current);
            welcomeTimer.current = null;
        }
    };

    const clearCurtainTimer = () => {
        if (curtainTimer.current) {
            clearTimeout(curtainTimer.current);
            curtainTimer.current = null;
        }
    };

    const clearWatchedTimer = () => {
        if (watchedTimer.current) {
            clearTimeout(watchedTimer.current);
            watchedTimer.current = null;
        }
    };

    const startWelcome = useCallback(() => {
        clearWelcomeTimer();
        clearCurtainTimer();
        welcomeStarted.current = true;
        setWelcome("login");
        setCurtainsOpen(false);
        setWelcomeFading(false);
        clearCelebrationPendingClass();

        curtainTimer.current = setTimeout(() => {
            setCurtainsOpen(true);
        }, CURTAIN_HANG_MS);

        const totalBeforeFade = CURTAIN_HANG_MS + CURTAIN_OPEN_MS + WELCOME_DISPLAY_MS;
        welcomeTimer.current = setTimeout(() => {
            setWelcomeFading(true);
            welcomeTimer.current = setTimeout(() => {
                setWelcome(null);
                setCurtainsOpen(false);
                setWelcomeFading(false);
                welcomeStarted.current = false;
            }, WELCOME_FADE_MS);
        }, totalBeforeFade);
    }, []);

    useLayoutEffect(() => {
        if (pathname === "/login") {
            clearCelebrationPendingClass();
            return;
        }

        if (welcomeStarted.current) return;

        if (shouldShowLoginWelcome()) {
            startWelcome();
            return;
        }

        clearCelebrationPendingClass();
    }, [pathname, startWelcome]);

    useEffect(() => {
        return () => {
            clearWelcomeTimer();
            clearCurtainTimer();
            clearWatchedTimer();
        };
    }, []);

    const celebrateWatched = useCallback((moment: WatchedMoment) => {
        clearWatchedTimer();
        setWatchedMoment(moment);
        fireConfetti({ particleCount: 65, spread: 60, originY: 0.5 });

        requestAnimationFrame(() => setWatchedVisible(true));

        watchedTimer.current = setTimeout(() => {
            setWatchedVisible(false);
            watchedTimer.current = setTimeout(() => setWatchedMoment(null), 450);
        }, 2200);
    }, []);

    const displayName =
        (user?.user_metadata?.display_name as string | undefined) ||
        user?.email?.split("@")[0] ||
        "filmvenn";

    return (
        <CelebrationContext.Provider value={{ celebrateWatched }}>
            <div className={welcome && !welcomeFading ? "invisible" : undefined}>{children}</div>

            {welcome && (
                <div
                    className={`celebration-welcome fixed inset-0 z-[200] flex items-center justify-center overflow-hidden transition-opacity duration-700 ease-out ${
                        welcomeFading ? "pointer-events-none opacity-0" : "opacity-100"
                    }`}
                    aria-live="polite"
                >
                    <div className="celebration-welcome__stage absolute inset-0" />
                    <div className="celebration-welcome__vignette absolute inset-0" />
                    <div
                        className={`celebration-welcome__spotlight absolute inset-0 transition-opacity duration-1000 ${
                            curtainsOpen ? "opacity-100" : "opacity-0"
                        }`}
                    />
                    <div className="celebration-welcome__proscenium absolute inset-0" aria-hidden />

                    <div
                        className={`relative z-20 flex flex-col items-center px-8 text-center transition-all duration-500 ${
                            curtainsOpen ? "celebration-welcome__content--in" : "opacity-0"
                        }`}
                    >
                        <div className="celebration-welcome__logo mb-8 p-6">
                            <FilmlistaLogo className="h-16 w-16 text-white" />
                        </div>

                        <div className="celebration-welcome__eyebrow mb-4 flex items-center gap-2.5">
                            <span className="celebration-welcome__rule" aria-hidden />
                            <Sparkles className="h-3.5 w-3.5 text-white/50" />
                            <span>Velkommen inn</span>
                            <Sparkles className="h-3.5 w-3.5 text-white/50" />
                            <span className="celebration-welcome__rule" aria-hidden />
                        </div>
                        <h2 className="celebration-welcome__title font-heading text-3xl font-semibold sm:text-4xl">
                            Hei, {displayName}
                        </h2>
                        <p className="celebration-welcome__subtitle mt-4 max-w-sm text-base">
                            Filmlista er klar. Utforsk, lag lister og hold styr på hva du har sett.
                        </p>
                    </div>

                    <div className="celebration-welcome__valance absolute inset-x-0 top-0 z-40" aria-hidden />
                    <div className="celebration-welcome__valance-fringe absolute inset-x-0 top-0 z-40" aria-hidden />
                    <div
                        className={`celebration-curtain celebration-curtain--left ${
                            curtainsOpen ? "celebration-curtain--open" : ""
                        }`}
                        aria-hidden
                    />
                    <div
                        className={`celebration-curtain celebration-curtain--right ${
                            curtainsOpen ? "celebration-curtain--open" : ""
                        }`}
                        aria-hidden
                    />
                </div>
            )}

            {watchedMoment && (
                <div
                    className={`celebration-watched fixed inset-0 z-[200] flex items-center justify-center px-6 transition-all duration-500 ${
                        watchedVisible ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                    aria-live="polite"
                >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                    <div
                        className={`celebration-watched__card relative z-10 flex max-w-sm flex-col items-center rounded-2xl border border-white/10 bg-background/95 px-8 py-8 text-center shadow-2xl transition-all duration-500 ${
                            watchedVisible ? "celebration-watched__card--in" : "scale-90 opacity-0"
                        }`}
                    >
                        <div className="celebration-watched__check mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-lg shadow-green-600/30">
                            <Check className="h-8 w-8 stroke-[3]" />
                        </div>
                        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                            {watchedMoment.mediaType === "movie" ? "Film sett" : "Serie sett"}
                        </p>
                        <h3 className="mt-2 font-heading text-xl font-semibold leading-snug">
                            {watchedMoment.title}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">Godt jobbet — nå er den i boks!</p>
                    </div>
                </div>
            )}
        </CelebrationContext.Provider>
    );
}

export function useCelebration() {
    const context = useContext(CelebrationContext);
    if (!context) {
        throw new Error("useCelebration must be used inside CelebrationProvider");
    }
    return context;
}
