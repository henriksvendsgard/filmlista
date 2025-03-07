import AuthComponent from "@/components/Auth/AuthComponent";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Logg inn | Filmlista",
    description: "Logg inn med din konto på Filmlista",
};

export default function LoginPage() {
    return (
        <div className="mt-12 w-full items-center bg-background px-5 sm:flex sm:min-h-[600px] sm:w-auto">
            <AuthComponent />
        </div>
    );
}
