import Image from "next/image";

export default function Footer() {
    return (
        <div className="mb-0 mt-auto flex pt-10">
            <div className="flex w-full flex-wrap justify-between gap-4 border-t bg-background px-5 pb-12 pt-8 sm:py-8">
                <p>&copy; {new Date().getFullYear()} Filmlista</p>
                <div className="flex items-center gap-1">
                    <p>Laget av</p>
                    <a
                        className="flex items-center underline underline-offset-2"
                        href="https://github.com/henriksvendsgard"
                    >
                        henriksvendsgard
                        <Image
                            className="ml-1 h-6 w-6 rounded-full"
                            src="/images/github_avatar.jpeg"
                            alt="Watcher"
                            width={24}
                            height={24}
                        />
                    </a>
                </div>
            </div>
        </div>
    );
}
