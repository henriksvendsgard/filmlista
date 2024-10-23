import Image from "next/image";

import { cn } from "@/lib/utils";
import { getImage } from "@/lib/getImage";

type DynamicImageProps = {
	url: string;
	alt: string;
	containerClass?: string;
	imageClass?: string;
};

export default async function DynamicImage({ url, alt, containerClass, imageClass }: DynamicImageProps) {
	const { base64, img } = await getImage(url);
	return (
		<div className={cn("relative", containerClass)}>
			<Image className={imageClass} {...img} alt={alt || ""} placeholder="blur" blurDataURL={base64} />
		</div>
	);
}
