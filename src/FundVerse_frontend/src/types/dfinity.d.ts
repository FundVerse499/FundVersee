// Temporary type declarations for @dfinity packages
declare module '@dfinity/principal' {
  export class Principal {
    static fromText(text: string): Principal;
    static fromUint8Array(arr: Uint8Array): Principal;
    toText(): string;
    toUint8Array(): Uint8Array;
  }
}

declare module '@dfinity/agent' {
  export type ActorSubclass<T> = T & {
    [key: string]: any;
  };
  
  export class Actor {
    static createActor<T>(config: any): ActorSubclass<T>;
  }
  
  export class HttpAgent {
    constructor(config?: any);
    fetchRootKey(): Promise<void>;
  }
  
  export interface ActorConfig {
    [key: string]: any;
  }
}

declare module '@dfinity/auth-client' {
  export class AuthClient {
    static create(options?: any): Promise<AuthClient>;
    login: (options?: any) => Promise<void>;
    logout: (options?: any) => Promise<void>;
    isAuthenticated: () => Promise<boolean>;
    getIdentity: () => any;
  }
  
  export function createAuthClient(): Promise<AuthClient>;
}

declare module '@dfinity/identity' {
  export interface Identity {
    getPrincipal(): any;
  }
}

declare module '@dfinity/candid' {
  export function encode<T>(value: T): Uint8Array;
  export function decode<T>(bytes: Uint8Array, type: any): T;
}

// Node.js globals
declare const process: {
  env: { [key: string]: string | undefined };
};
