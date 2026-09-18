/**
 * Ambient type definitions for Chrome extension APIs used by the popup.
 */
declare namespace chrome {
  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
    }
    function query(queryInfo: { active?: boolean; currentWindow?: boolean }): Promise<Tab[]>;
    function query(queryInfo: { active?: boolean; currentWindow?: boolean }, callback: (tabs: Tab[]) => void): void;
    function create(createProperties: { url: string }): Promise<Tab>;
    function create(createProperties: { url: string }, callback?: (tab: Tab) => void): void;
  }

  namespace scripting {
    interface ScriptInjection<T = any> {
      target: { tabId: number; allFrames?: boolean };
      func?: () => T;
      args?: any[];
      files?: string[];
    }
    interface InjectionResult<T = any> {
      result: T;
    }
    function executeScript<T = any>(injection: ScriptInjection<T>): Promise<InjectionResult<T>[]>;
    function executeScript<T = any>(
      injection: ScriptInjection<T>,
      callback: (results: InjectionResult<T>[]) => void
    ): void;
  }

  namespace runtime {
    const lastError: { message?: string } | undefined;
  }
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

