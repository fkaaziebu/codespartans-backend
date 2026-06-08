export declare class HashHelper {
    private static salt;
    static encrypt(str: string): Promise<string>;
    static compare(plain: string, encrypted: string): Promise<boolean>;
}
