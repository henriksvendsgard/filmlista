import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Custom404() {
    const previousRoute = typeof window !== "undefined" ? window.location.href : "/";
    return (
        <div className="flex h-[calc(100vh-120px)] w-full items-center justify-center">
            <h1 className="flex items-center font-heading text-4xl">
                Husj! Gå tilbake dit du{" "}
                <Link className="ml-3 underline underline-offset-4 hover:text-gray-400" href={previousRoute}>
                    kom fra
                </Link>
            </h1>
        </div>
    );
}
