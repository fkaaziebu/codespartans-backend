import { Response } from 'express';
import { MediaService } from './media.service';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    uploadImage(file: Express.Multer.File): Promise<{
        message: string;
        path: string;
    }>;
    fetchImage(imageId: string, res: Response): Promise<void>;
}
