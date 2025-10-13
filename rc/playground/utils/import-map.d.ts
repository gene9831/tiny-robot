import { ImportMap } from '@vue/repl';
interface ImportMapOptions {
    tinyRobotVersion: string;
    builtinImportMap?: ImportMap;
}
export declare function generateImportMap(options: ImportMapOptions): ImportMap;
export {};
