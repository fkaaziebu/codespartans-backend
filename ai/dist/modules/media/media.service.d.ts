import { Image } from './entities/image.entity';
import { Repository } from 'typeorm';
export declare class MediaService {
    private imageRepository;
    constructor(imageRepository: Repository<Image>);
    uploadImage({ file }: {
        file: Express.Multer.File;
    }): Promise<{
        message: string;
        path: string;
    }>;
    fetchImage({ id }: {
        id: string;
    }): Promise<Image>;
}
