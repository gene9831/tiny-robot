interface GetVersionsOptions {
    versionSegments?: number;
    includePrerelease?: boolean | string[];
    limit?: number;
    keepPerGroup?: number;
    includeLatest?: boolean;
}
export declare function getVersions(pkg: string, options?: GetVersionsOptions): Promise<string[]>;
export {};
