import Image from "next/image";

export default function Footer() {
	return (
		<div className="flex mt-auto mb-0 pt-10">
			<div className="w-full bg-background border-t px-5 py-8 flex justify-between flex-wrap gap-4">
				<p>&copy; 2024 Filmlista</p>
				<div className="flex items-center gap-1">
					<p>Laget av</p>
					<a className="underline underline-offset-2 flex items-center" href="https://github.com/henriksvendsgard">
						henriksvendsgard
						<Image className="rounded-full ml-1 w-6 h-6" src="/images/github_avatar.jpeg" alt="Watcher" width={24} height={24} />
					</a>
				</div>
			</div>
		</div>
	);
}
